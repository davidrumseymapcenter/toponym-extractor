/*
 * Toponym Extractor
 *
 * Takes MapReader text detections whose coordinates are image pixels, plus an
 * Allmaps Georeference Annotation, and applies the annotation's ground control
 * points to every coordinate. Runs entirely client-side: the only optional
 * network calls are fetching an annotation by URL and the map preview tiles.
 */
;(function () {
  'use strict'

  var GcpTransformer = window.AllmapsTransform && window.AllmapsTransform.GcpTransformer

  // Fields MapReader (and neighboring tools) use for the transcription.
  var TEXT_KEYS = ['text', 'transcription', 'label', 'name', 'word']

  // The score we filter on is the *recognition* confidence: how sure the model
  // is that it read the characters correctly. Text-spotting pipelines commonly
  // emit a detection score as well — how sure it is that the box contains text
  // at all — and that one sits close to 1.0 for nearly every surviving box,
  // which makes it useless as a quality filter. So a recognition field always
  // wins, whatever it is called, and generic names are only a fallback.
  var RECOGNITION_PATTERN = /^(rec|recog|recognition|text|word|ocr|transcription)[_-]?(score|conf|confidence|prob|probability)$/i
  var DETECTION_PATTERN = /^(det|detect|detection|box|bbox|obj|objectness)[_-]?(score|conf|confidence|prob|probability)$/i
  var SCORE_KEYS = ['score', 'confidence', 'prob']

  var MAX_TABLE_ROWS = 1000
  var TILE_WAIT = 15000 // ms to wait for the first IIIF tile before complaining
  var CHUNK_SIZE = 200 // features transformed per animation frame

  var state = {
    pixelFeatures: null, // normalized array of GeoJSON-ish features
    pixelWarnings: [],
    scoreStats: null, // { values, count, total, distinct, min, max, median }
    scoreKey: null, // property the score was read from
    textKey: null, // property the transcription was read from
    scoreFilterActive: false,
    annotation: null, // { gcps, transformationType, width, height, label }
    annotationRaw: null, // the annotation as parsed from the file, for the preview
    annotationUrl: null, // set when it came from a URL, so it can be reloaded
    sourceImage: null, // { width, height, name } of the image the detections came from
    rows: null, // results of the last run
    settings: null, // options the last run used
    sortKey: null,
    sortColumn: null,
    sortDir: 1,
    userThreshold: 0.75, // survives files whose scores park the slider elsewhere
    columns: [],
    map: null,
    warped: null, // WarpedMapLayer showing the historical map itself
    markers: null // layer group of detection points
  }

  var $ = function (id) { return document.getElementById(id) }

  /* ── Parsing: pixel GeoJSON ─────────────────────────────────────────────── */

  // MapReader output is often handed around as a fragment: a bare list of
  // features, one feature per line, or a single feature with a trailing comma.
  // Accept all of those in addition to well-formed GeoJSON.
  function parseLooseJson (text) {
    var trimmed = text.trim()
    if (!trimmed) throw new Error('Nothing to parse.')

    try { return JSON.parse(trimmed) } catch (e) { /* keep trying */ }

    var body = trimmed.replace(/,\s*$/, '')
    try { return JSON.parse('[' + body + ']') } catch (e) { /* keep trying */ }

    var lines = trimmed.split(/\r?\n/)
      .map(function (l) { return l.trim().replace(/,$/, '') })
      .filter(function (l) { return l.length > 0 })
    if (lines.length > 1) {
      return lines.map(function (line, i) {
        try { return JSON.parse(line) } catch (e) {
          throw new Error('Could not parse line ' + (i + 1) + ' as JSON.')
        }
      })
    }
    throw new Error('This does not look like JSON or GeoJSON.')
  }

  function normalizeFeatures (parsed) {
    var warnings = []
    var raw

    if (Array.isArray(parsed)) raw = parsed
    else if (parsed && parsed.type === 'FeatureCollection') raw = parsed.features || []
    else if (parsed && parsed.type === 'Feature') raw = [parsed]
    else if (parsed && parsed.type && parsed.coordinates) raw = [{ type: 'Feature', properties: {}, geometry: parsed }]
    else if (parsed && Array.isArray(parsed.items)) raw = parsed.items
    else throw new Error('Expected a FeatureCollection, a Feature, or a list of Features.')

    var features = []
    var skipped = 0
    raw.forEach(function (item) {
      if (!item) { skipped++; return }
      // A bare geometry is acceptable too.
      var feature = item.type === 'Feature'
        ? item
        : (item.coordinates ? { type: 'Feature', properties: {}, geometry: item } : item)
      if (!feature.geometry || !feature.geometry.coordinates) { skipped++; return }
      features.push({
        properties: feature.properties || {},
        geometry: feature.geometry
      })
    })

    if (!features.length) throw new Error('No features with coordinates were found.')
    if (skipped) warnings.push(skipped + ' item(s) had no geometry and were ignored.')
    return { features: features, warnings: warnings }
  }

  /* ── Parsing: Allmaps Georeference Annotation ───────────────────────────── */

  function parseAnnotation (parsed) {
    // A Georeference Annotation, an Annotation Page holding several, or an
    // Allmaps "Georeferenced Map" (the internal form, which already has gcps).
    var items
    if (parsed && parsed.type === 'AnnotationPage') items = parsed.items || []
    else if (Array.isArray(parsed)) items = parsed
    else items = [parsed]

    if (!items.length) throw new Error('The annotation page contains no items.')

    var maps = items.map(parseOneMap).filter(Boolean)
    if (!maps.length) throw new Error('No ground control points found in this file.')
    return maps
  }

  function parseOneMap (item) {
    if (!item) return null

    // Already a Georeferenced Map.
    if (Array.isArray(item.gcps) && item.gcps.length && item.gcps[0].resource) {
      return {
        gcps: item.gcps.map(function (g) { return { resource: g.resource, geo: g.geo } }),
        transformationType: transformationTypeOf(item.transformation),
        width: item.resource && item.resource.width,
        height: item.resource && item.resource.height,
        label: (item.resource && item.resource.id) || item.id || 'georeferenced map'
      }
    }

    var body = item.body
    if (!body || !Array.isArray(body.features)) return null

    var gcps = []
    body.features.forEach(function (f) {
      var props = f.properties || {}
      var resource = props.resourceCoords || props.pixelCoords || props.resource
      var geo = f.geometry && f.geometry.coordinates
      if (Array.isArray(resource) && Array.isArray(geo) && resource.length >= 2 && geo.length >= 2) {
        gcps.push({
          resource: [Number(resource[0]), Number(resource[1])],
          geo: [Number(geo[0]), Number(geo[1])]
        })
      }
    })
    if (!gcps.length) return null

    var source = (item.target && item.target.source) || {}
    return {
      gcps: gcps,
      transformationType: transformationTypeOf(body.transformation),
      mask: parseSvgMask(item.target && item.target.selector),
      width: source.width,
      height: source.height,
      label: source.id || item.id || 'annotation'
    }
  }

  // The resource mask: the polygon drawn in Allmaps Editor around the
  // cartographic area of the sheet, stored as an SvgSelector on the target and
  // expressed in resource (pixel) coordinates. Numbers are pulled out in order
  // and paired, which tolerates any of the separator conventions SVG allows.
  function parseSvgMask (selector) {
    if (!selector || !selector.value) return null
    var match = /<polygon[^>]*\bpoints\s*=\s*"([^"]+)"/i.exec(selector.value)
    if (!match) return null

    var numbers = match[1].match(/-?\d+(?:\.\d+)?/g)
    if (!numbers || numbers.length < 6) return null

    var points = []
    for (var i = 0; i + 1 < numbers.length; i += 2) {
      points.push([Number(numbers[i]), Number(numbers[i + 1])])
    }
    return points.length >= 3 ? points : null
  }

  // Allmaps stores the polynomial order separately; @allmaps/transform wants it
  // folded into the type name (polynomial1 / polynomial2 / polynomial3).
  function transformationTypeOf (transformation) {
    if (!transformation || !transformation.type) return 'polynomial1'
    var type = transformation.type
    if (type === 'polynomial') {
      var order = (transformation.options && transformation.options.order) || 1
      return 'polynomial' + order
    }
    return type
  }

  /* ── Geometry helpers ───────────────────────────────────────────────────── */

  function isPoint (coords) {
    return Array.isArray(coords) && typeof coords[0] === 'number'
  }

  function mapCoordinates (coords, fn) {
    if (isPoint(coords)) return fn(coords)
    return coords.map(function (c) { return mapCoordinates(c, fn) })
  }

  function countPoints (coords) {
    if (isPoint(coords)) return 1
    return coords.reduce(function (sum, c) { return sum + countPoints(c) }, 0)
  }

  function collectPoints (coords, out) {
    out = out || []
    if (isPoint(coords)) out.push(coords)
    else coords.forEach(function (c) { collectPoints(c, out) })
    return out
  }

  function meanPoint (points) {
    var sx = 0, sy = 0
    points.forEach(function (p) { sx += p[0]; sy += p[1] })
    return [sx / points.length, sy / points.length]
  }

  // Area-weighted centroid of a ring, falling back to the vertex mean for
  // degenerate (zero-area) rings.
  function ringCentroid (ring) {
    var area = 0, cx = 0, cy = 0
    var n = ring.length
    for (var i = 0; i < n; i++) {
      var p0 = ring[i]
      var p1 = ring[(i + 1) % n]
      var f = p0[0] * p1[1] - p1[0] * p0[1]
      area += f
      cx += (p0[0] + p1[0]) * f
      cy += (p0[1] + p1[1]) * f
    }
    if (Math.abs(area) < 1e-12) return meanPoint(ring)
    area *= 0.5
    return [cx / (6 * area), cy / (6 * area)]
  }

  function geometryCentroid (geometry) {
    var type = geometry.type
    var coords = geometry.coordinates
    if (type === 'Point') return coords.slice(0, 2)
    if (type === 'Polygon') return ringCentroid(coords[0])
    if (type === 'MultiPolygon') {
      // Largest outer ring by vertex count is a good enough proxy for a label.
      var biggest = coords.reduce(function (best, poly) {
        return (!best || poly[0].length > best[0].length) ? poly : best
      }, null)
      return ringCentroid(biggest[0])
    }
    return meanPoint(collectPoints(coords))
  }

  // Ray casting. Points exactly on an edge are not guaranteed either way,
  // which is immaterial for label centroids.
  function pointInPolygon (point, polygon) {
    var x = point[0]
    var y = point[1]
    var inside = false
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      var xi = polygon[i][0]
      var yi = polygon[i][1]
      var xj = polygon[j][0]
      var yj = polygon[j][1]
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside
      }
    }
    return inside
  }

  function polygonArea (polygon) {
    var sum = 0
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      sum += (polygon[j][0] * polygon[i][1]) - (polygon[i][0] * polygon[j][1])
    }
    return Math.abs(sum / 2)
  }

  function wkt (geometry) {
    var fmt = function (p) { return p[0] + ' ' + p[1] }
    var ring = function (r) { return '(' + r.map(fmt).join(', ') + ')' }
    var poly = function (p) { return '(' + p.map(ring).join(', ') + ')' }
    switch (geometry.type) {
      case 'Point': return 'POINT (' + fmt(geometry.coordinates) + ')'
      case 'MultiPoint': return 'MULTIPOINT (' + geometry.coordinates.map(fmt).join(', ') + ')'
      case 'LineString': return 'LINESTRING ' + ring(geometry.coordinates)
      case 'MultiLineString': return 'MULTILINESTRING (' + geometry.coordinates.map(ring).join(', ') + ')'
      case 'Polygon': return 'POLYGON ' + poly(geometry.coordinates)
      case 'MultiPolygon': return 'MULTIPOLYGON (' + geometry.coordinates.map(poly).join(', ') + ')'
      default: return ''
    }
  }

  /* ── Field lookups ──────────────────────────────────────────────────────── */

  function pickKey (props, keys) {
    for (var i = 0; i < keys.length; i++) {
      if (props[keys[i]] !== undefined && props[keys[i]] !== null) return keys[i]
    }
    return null
  }

  // Strips diacritics so the text filter matches across spellings: these maps
  // carry both "SEGOU" and "Ségouba", and a search for either should find both.
  // Applied to the query and the text alike, so an accented query works too.
  function foldAccents (text) {
    return text.normalize ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : text
  }

  function textOf (props) {
    var key = pickKey(props, TEXT_KEYS)
    return key ? String(props[key]) : ''
  }

  // Sorted score values plus the summary the slider needs. Kept on state so
  // moving the slider can report its effect without rescanning the features.
  function summarizeScores (features) {
    var values = []
    features.forEach(function (f) {
      var score = scoreOf(f.properties)
      if (score !== null) values.push(score)
    })
    values.sort(function (a, b) { return a - b })

    var distinct = {}
    values.forEach(function (v) { distinct[v] = 1 })

    return {
      values: values,
      count: values.length,
      total: features.length,
      distinct: Object.keys(distinct).length,
      min: values[0],
      max: values[values.length - 1],
      median: values.length ? values[Math.floor(values.length / 2)] : null
    }
  }

  // How many scored values fall below a threshold. The array is sorted, so stop
  // at the first value that passes.
  function countBelow (values, threshold) {
    for (var i = 0; i < values.length; i++) {
      if (values[i] >= threshold) return i
    }
    return values.length
  }

  // Not every feature carries every field, so scan a few before giving up.
  function firstKeyFound (features, pick) {
    for (var i = 0; i < features.length && i < 200; i++) {
      var key = pick(features[i].properties)
      if (key) return key
    }
    return null
  }

  function isNumeric (value) {
    return value !== null && value !== '' && isFinite(Number(value))
  }

  // A recognition-confidence field if there is one, otherwise a generic score
  // name. Detection scores are never chosen.
  function pickScoreKey (props) {
    var keys = Object.keys(props)
    var i
    for (i = 0; i < keys.length; i++) {
      if (RECOGNITION_PATTERN.test(keys[i]) && isNumeric(props[keys[i]])) return keys[i]
    }
    for (i = 0; i < SCORE_KEYS.length; i++) {
      if (isNumeric(props[SCORE_KEYS[i]])) return SCORE_KEYS[i]
    }
    return null
  }

  // The value exactly as it appears in the input file, untouched. This is what
  // gets displayed and exported.
  function rawScoreOf (props) {
    var key = pickScoreKey(props)
    return key ? props[key] : undefined
  }

  // A numeric copy, used only for comparing against the threshold and for
  // sorting. Never displayed.
  function scoreOf (props) {
    var key = pickScoreKey(props)
    if (!key) return null
    var value = Number(props[key])
    return isFinite(value) ? value : null
  }

  // Reports the range and the number of distinct score values, and names the
  // field they came from. A single distinct value (or a whole-number range)
  // usually means the scores were rounded away upstream — a GIS round-trip that
  // typed the column as an integer will turn every 0.31–0.99 into 0 or 1.
  function describeScores (features) {
    var key = null
    var values = []
    var skipped = {}
    features.forEach(function (f) {
      if (!key) key = pickScoreKey(f.properties)
      Object.keys(f.properties).forEach(function (k) {
        if (k === key || !isNumeric(f.properties[k])) return
        if (DETECTION_PATTERN.test(k) || SCORE_KEYS.indexOf(k) !== -1) skipped[k] = 1
      })
      var score = scoreOf(f.properties)
      if (score !== null) values.push(score)
    })

    if (!values.length) {
      return 'no recognition score found (looked for a rec/text/ocr score field, then ' +
        SCORE_KEYS.join(', ') + ')'
    }

    var min = Math.min.apply(null, values)
    var max = Math.max.apply(null, values)
    var distinct = Object.keys(values.reduce(function (set, v) { set[v] = 1; return set }, {})).length
    var summary = values.length.toLocaleString() + ' with a "' + key + '" (' +
      (min === max ? 'all exactly ' + min : 'range ' + min + '–' + max + ', ' + distinct + ' distinct values') + ')'

    var allWhole = values.every(function (v) { return v === Math.round(v) })
    if (allWhole) summary += ' ⚠ whole numbers only — the scores look rounded, so filtering by them will not work'

    var skippedKeys = Object.keys(skipped)
    if (skippedKeys.length) {
      summary += '; not filtering on ' + skippedKeys.join(', ') + ' — shown as its own column instead'
    }
    return summary
  }

  /* ── Source image and scaling ───────────────────────────────────────────── */

  /*
   * Pixel coordinates are meaningless without the image they were measured on.
   * When MapReader ran on a different scan than the annotation georeferences,
   * every coordinate is off by the ratio between them, and because the error
   * grows with distance from the pixel origin it looks like a drift toward the
   * top-left corner of the sheet rather than an obvious mistake.
   *
   * Only the width ratio is used, applied to both axes. Different scans are
   * related by a uniform scale: heights can differ because one includes more
   * margin, so scaling the axes independently stretches the geometry and does
   * worse. A disagreement between the two ratios is reported instead, since it
   * means the scans are also cropped differently and no scale fixes that fully.
   */
  function detectionScale () {
    var source = state.sourceImage
    var annotation = state.annotation
    if (!source || !annotation || !annotation.width || !source.width) return 1
    return annotation.width / source.width
  }

  function describeSourceImage () {
    var status = $('source-image-status')
    var source = state.sourceImage
    var annotation = state.annotation

    if (!source) {
      setStatus(status, 'Assuming the same image as the annotation.')
      return
    }

    var parts = [source.width + '×' + source.height + ' px' + (source.name ? ' (' + source.name + ')' : '')]

    if (!annotation || !annotation.width) {
      parts.push('load an annotation to compare')
      setStatus(status, parts.join(' · '))
      return
    }

    var scale = detectionScale()
    if (Math.abs(scale - 1) < 0.001) {
      parts.push('same size as the annotation image, no scaling needed')
      setStatus(status, parts.join(' · '), 'ok')
      return
    }

    parts.push('coordinates scaled ×' + scale.toFixed(4) + ' to match the annotation\'s ' +
      annotation.width + '×' + annotation.height)

    var heightRatio = annotation.height / source.height
    if (Math.abs(heightRatio - scale) / scale > 0.01) {
      parts.push('⚠ the two images have different proportions (' +
        (source.width / source.height).toFixed(3) + ' vs ' +
        (annotation.width / annotation.height).toFixed(3) +
        '), so they are cropped differently as well as resized — the width ratio is used, and some error remains')
    }
    setStatus(status, parts.join(' · '), 'ok')
  }

  function setSourceImage (size, name) {
    state.sourceImage = size ? { width: size.width, height: size.height, name: name } : null
    $('source-width').value = size ? size.width : ''
    $('source-height').value = size ? size.height : ''
    describeSourceImage()
  }

  // Only the header is read, so the file size does not matter: map scans arrive
  // as hundreds of megabytes and a browser cannot decode them at all.
  function readImageHeader (file) {
    setStatus($('source-image-status'), 'Reading ' + file.name + '…')
    var slice = file.slice(0, 65536)
    var reader = new FileReader()
    reader.onload = function () {
      var size = window.ImageSize && window.ImageSize.imageSize(reader.result)
      if (!size) {
        setStatus($('source-image-status'),
          'Could not read the dimensions from ' + file.name +
          '. JPEG, PNG, TIFF, GIF and WebP headers are understood — otherwise type the size.', 'error')
        return
      }
      setSourceImage(size, file.name)
    }
    reader.onerror = function () {
      setStatus($('source-image-status'), 'Could not read ' + file.name, 'error')
    }
    reader.readAsArrayBuffer(slice)
  }

  /* ── Y-axis handling ────────────────────────────────────────────────────── */

  // Allmaps resource coordinates are image pixels: origin top-left, Y growing
  // downward. MapReader output that has been through a GIS is commonly flipped
  // (Y negative, or Y measured upward from the bottom), which would mirror the
  // result. Detect the negative case, since it is unambiguous.
  function detectYMode (features) {
    var negative = 0
    var total = 0
    var limit = Math.min(features.length, 500)
    for (var i = 0; i < limit; i++) {
      collectPoints(features[i].geometry.coordinates).forEach(function (p) {
        total++
        if (p[1] < 0) negative++
      })
    }
    if (!total) return 'down'
    return (negative / total) > 0.95 ? 'negated' : 'down'
  }

  function makeYCorrection (mode, height) {
    if (mode === 'negated') return function (y) { return -y }
    if (mode === 'up') {
      if (!height) throw new Error('The annotation does not record an image height, so "Y increases upward" cannot be applied. Use "Y is negative" or "Y increases downward".')
      return function (y) { return height - y }
    }
    return function (y) { return y }
  }

  /* ── Loading inputs ─────────────────────────────────────────────────────── */

  function setStatus (el, message, kind) {
    el.textContent = message
    el.className = 'status' + (kind ? ' ' + kind : '')
  }

  function loadPixels (text, origin) {
    try {
      var result = normalizeFeatures(parseLooseJson(text))
      state.pixelFeatures = result.features
      state.pixelWarnings = result.warnings
      state.scoreStats = summarizeScores(result.features)
      state.scoreKey = firstKeyFound(result.features, pickScoreKey)
      state.textKey = firstKeyFound(result.features, function (props) {
        return pickKey(props, TEXT_KEYS)
      })

      var detected = detectYMode(result.features)
      var parts = [result.features.length.toLocaleString() + ' features loaded' + (origin ? ' from ' + origin : '')]
      parts.push(describeScores(result.features))
      parts.push('Y looks ' + (detected === 'negated' ? 'negative (will be flipped)' : 'downward (used as-is)'))
      setStatus($('pixel-status'), parts.concat(result.warnings).join(' · '), 'ok')
      $('y-axis-hint').dataset.detected = detected
    } catch (err) {
      state.pixelFeatures = null
      state.scoreStats = null
      setStatus($('pixel-status'), err.message, 'error')
    }
    updateScoreEffect()
    refreshRunButton()
  }

  function loadAnnotation (text, origin) {
    var previous = state.annotation
    try {
      var parsed = parseLooseJson(text)
      var maps = parseAnnotation(parsed)
      state.annotation = maps[0]
      // Kept verbatim for the map preview: @allmaps/leaflet wants the original
      // annotation, not our reduced form.
      state.annotationRaw = parsed
      var a = state.annotation
      var parts = [a.gcps.length + ' ground control points']
      parts.push('transformation: ' + a.transformationType)
      if (a.width && a.height) parts.push('image ' + a.width + '×' + a.height + ' px')
      if (maps.length > 1) parts.push('note: file holds ' + maps.length + ' maps, using the first')
      if (origin) parts.push('from ' + origin)
      var changes = previous ? describeAnnotationChange(previous, a) : null
      if (changes) parts.push(changes)
      setStatus($('annotation-status'), parts.join(' · '), 'ok')
      $('transformation-hint').textContent =
        'Leave as "From annotation" to use ' + a.transformationType + ', exactly as chosen in Allmaps Editor.'
      describeMask(a)
      describeSourceImage()
    } catch (err) {
      state.annotation = null
      setStatus($('annotation-status'), err.message, 'error')
    }
    refreshRunButton()
    refreshControls()
  }

  // What changed between two versions of the same annotation. The point of
  // reloading is usually to check that an edit in Allmaps Editor took effect,
  // so saying what moved beats a status line that looks identical either way.
  function describeAnnotationChange (before, after) {
    var notes = []
    if (before.gcps.length !== after.gcps.length) {
      notes.push('control points ' + before.gcps.length + ' → ' + after.gcps.length)
    }
    if (before.transformationType !== after.transformationType) {
      notes.push('transformation ' + before.transformationType + ' → ' + after.transformationType)
    }
    var coverage = function (annotation) {
      if (!annotation.mask || !annotation.width || !annotation.height) return null
      return polygonArea(annotation.mask) / (annotation.width * annotation.height)
    }
    var wasCovering = coverage(before)
    var nowCovering = coverage(after)
    if (wasCovering === null && nowCovering !== null) {
      notes.push('mask added, covering ' + Math.round(nowCovering * 100) + '%')
    } else if (wasCovering !== null && nowCovering === null) {
      notes.push('mask removed')
    } else if (wasCovering !== null && Math.abs(wasCovering - nowCovering) > 0.005) {
      notes.push('mask coverage ' + Math.round(wasCovering * 100) + '% → ' + Math.round(nowCovering * 100) + '%')
    }
    return notes.length ? 'changed: ' + notes.join(', ') : 'unchanged from the previous version'
  }

  // The reload button only makes sense once an annotation came from a URL.
  function refreshControls () {
    $('reload-annotation').hidden = !state.annotationUrl
  }

  // Describes what the threshold will actually do to the loaded file, and turns
  // the control off when the scores carry no information — a slider that looks
  // like it is filtering while doing nothing is worse than no slider.
  function updateScoreEffect () {
    var hint = $('score-hint')
    var slider = $('score-threshold')
    var number = $('score-number')
    var card = $('score-option')
    var stats = state.scoreStats
    var wasActive = state.scoreFilterActive === true

    // Off: dim the heading and slider, leaving the hint legible so the reason
    // is readable. The threshold is forced to 0 at conversion time, so the
    // parked slider position never filters anything.
    var deactivate = function (message, parkAt) {
      state.scoreFilterActive = false
      slider.disabled = number.disabled = true
      card.classList.add('inactive')
      if (parkAt !== undefined) {
        var parked = Math.min(1, Math.max(0, parkAt))
        slider.value = parked
        number.value = parkAt
      }
      hint.textContent = message
    }

    if (!state.pixelFeatures || !stats) {
      deactivate('Detections scoring below this are left out of the results.')
      return
    }

    if (!stats.count) {
      deactivate('No scores in this file, so there is nothing to filter on. All ' +
        stats.total.toLocaleString() + ' detections will be converted.', 0)
      return
    }

    if (stats.distinct === 1) {
      // Park the slider on the value every detection shares, so the control
      // reads as "nothing is being excluded" rather than sitting at a
      // threshold it is not applying.
      deactivate('Every detection in this file scores exactly ' + stats.values[0] +
        ', so filtering by score is switched off — this export carries no usable confidence values.',
      stats.values[0])
      return
    }

    state.scoreFilterActive = true
    slider.disabled = number.disabled = false
    card.classList.remove('inactive')

    // Coming back from a parked position, restore the threshold the user chose
    // rather than inheriting the previous file's parked value.
    if (!wasActive) {
      slider.value = state.userThreshold
      number.value = state.userThreshold
    }

    var threshold = Number(number.value)
    state.userThreshold = threshold
    var unscored = stats.total - stats.count
    var dropped = countBelow(stats.values, threshold) +
      ($('keep-unscored').checked ? 0 : unscored)
    var kept = stats.total - dropped

    hint.textContent = 'Scores run ' + stats.min + '–' + stats.max + ', median ' + stats.median +
      '. At ' + threshold + ' this drops ' + dropped.toLocaleString() + ' of ' +
      stats.total.toLocaleString() + ' (' + Math.round((dropped / stats.total) * 100) + '%), keeping ' +
      kept.toLocaleString() + '.'
  }

  // Says what the mask will actually do, since a mask that traces the whole
  // image — the default when nobody adjusted it in the Editor — trims nothing,
  // and a checkbox that appears to be working is worse than a disabled one.
  function describeMask (annotation) {
    var box = $('use-mask')
    var hint = $('mask-hint')
    var card = $('mask-option')
    var mask = annotation && annotation.mask

    if (!mask) {
      box.disabled = true
      card.classList.add('inactive')
      hint.textContent = 'This annotation has no mask, so nothing can be trimmed by one.'
      return
    }

    box.disabled = false
    card.classList.remove('inactive')

    var described = mask.length + '-point mask'
    if (annotation.width && annotation.height) {
      var coverage = polygonArea(mask) / (annotation.width * annotation.height)
      described += ' covering ' + Math.round(coverage * 100) + '% of the image'
      if (coverage > 0.995) {
        described += ' — it traces the whole sheet, so it will not trim anything'
      }
    }
    hint.textContent = described + '. Detections whose center falls outside it are discarded: ' +
      'margin text such as titles, legends and imprints.'
  }

  function refreshRunButton () {
    var ready = !!(state.pixelFeatures && state.annotation && GcpTransformer)
    $('run').disabled = !ready
    if (!GcpTransformer) {
      setStatus($('run-status'), 'vendor/allmaps-transform.js failed to load — run `npm run build`.', 'error')
    } else if (ready) {
      setStatus($('run-status'), 'Ready.', 'ok')
    } else {
      setStatus($('run-status'), 'Load both inputs to continue.')
    }
  }

  /*
   * Fetching an annotation, and re-fetching it after an edit in Allmaps Editor.
   *
   * annotations.allmaps.org sits behind a CDN with `s-maxage=300,
   * stale-while-revalidate=3600`, so a plain re-fetch can return an annotation
   * up to five minutes old — exactly wrong when the point is to see an edit you
   * just made. A cache-busting parameter plus `no-store` gets the current one.
   */
  function fetchAnnotation (url, isReload) {
    if (!url) return

    var target = url + (url.indexOf('?') === -1 ? '?' : '&') + '_=' + Date.now()
    setStatus($('annotation-status'), isReload ? 'Reloading…' : 'Fetching…')
    $('reload-annotation').disabled = true

    window.fetch(target, { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status)
        return response.text()
      })
      .then(function (text) {
        state.annotationUrl = url
        loadAnnotation(text, isReload ? 'reloaded URL' : 'URL')
        if (state.annotation) applyNewAnnotation()
      })
      .catch(function (err) {
        setStatus($('annotation-status'), (isReload ? 'Could not reload' : 'Could not fetch') +
          ' that URL (' + err.message + '). Download the annotation and load the file instead.', 'error')
      })
      .then(function () {
        $('reload-annotation').disabled = false
        refreshControls()
      })
  }

  // Everything downstream of a new annotation: the open preview has to be
  // rebuilt around the new GCPs and mask, and results already on screen were
  // computed with the old ones.
  function applyNewAnnotation () {
    if (state.map) {
      if (state.warped) {
        state.map.removeLayer(state.warped)
        state.warped = null
      }
      $('map-opacity').disabled = false
      addWarpedMap()
    }
    if (state.rows) run()
  }

  function readFile (file, onText) {
    var reader = new FileReader()
    reader.onload = function () { onText(String(reader.result), file.name) }
    reader.onerror = function () { window.alert('Could not read ' + file.name) }
    reader.readAsText(file)
  }

  /* ── The conversion run ─────────────────────────────────────────────────── */

  function run () {
    // With a disabled slider the stored value must not be applied, or a file
    // whose scores are all 0.5 would silently lose every row.
    var threshold = state.scoreFilterActive ? Number($('score-number').value) : 0
    var keepUnscored = $('keep-unscored').checked
    var textNeedle = foldAccents($('text-filter').value.trim().toLowerCase())
    var fullOutlines = $('full-outlines').checked

    var yMode = $('y-axis').value
    if (yMode === 'auto') yMode = detectYMode(state.pixelFeatures)

    var transformationType = $('transformation').value || state.annotation.transformationType

    var transformer, correctY
    try {
      correctY = makeYCorrection(yMode, state.annotation.height)
      transformer = new GcpTransformer(state.annotation.gcps, transformationType)
      // Fail fast on an unusable GCP set (e.g. polynomial3 with 4 points).
      transformer.transformToGeo([state.annotation.gcps[0].resource[0], state.annotation.gcps[0].resource[1]])
    } catch (err) {
      setStatus($('run-status'), 'Cannot build the transformation: ' + err.message, 'error')
      return
    }

    var mask = ($('use-mask').checked && !$('use-mask').disabled) ? state.annotation.mask : null
    var maskDropped = 0
    var scale = detectionScale()

    // A detection coordinate in the annotation's pixel space: scaled to the
    // annotation's image, then corrected for the Y axis convention. The mask
    // lives in that space too, so it has to be tested after both steps.
    var toResource = function (point) {
      return [Number(point[0]) * scale, correctY(Number(point[1]) * scale)]
    }

    var candidates = state.pixelFeatures.filter(function (f) {
      var score = scoreOf(f.properties)
      if (score === null) { if (!keepUnscored) return false } else if (score < threshold) return false
      if (textNeedle && foldAccents(textOf(f.properties).toLowerCase()).indexOf(textNeedle) === -1) return false
      if (mask) {
        if (!pointInPolygon(toResource(geometryCentroid(f.geometry)), mask)) {
          maskDropped++
          return false
        }
      }
      return true
    })

    var rows = []
    var failures = 0
    var index = 0

    $('run').disabled = true
    $('progress').hidden = false
    setStatus($('run-status'), 'Converting ' + candidates.length.toLocaleString() + ' detections…')

    function toGeo (point) {
      return transformer.transformToGeo(toResource(point))
    }

    function step () {
      var end = Math.min(index + CHUNK_SIZE, candidates.length)
      for (; index < end; index++) {
        var feature = candidates[index]
        try {
          var pixelCentroid = geometryCentroid(feature.geometry)
          var centroid = toGeo(pixelCentroid)
          var geoGeometry = null
          if (fullOutlines) {
            geoGeometry = {
              type: feature.geometry.type,
              coordinates: mapCoordinates(feature.geometry.coordinates, toGeo)
            }
          }
          rows.push({
            text: textOf(feature.properties),
            score: scoreOf(feature.properties),
            score_raw: rawScoreOf(feature.properties),
            lon: centroid[0],
            lat: centroid[1],
            pixel_x: pixelCentroid[0],
            pixel_y: pixelCentroid[1],
            geometry_type: feature.geometry.type,
            vertex_count: countPoints(feature.geometry.coordinates),
            properties: feature.properties,
            geoGeometry: geoGeometry
          })
        } catch (err) {
          failures++
        }
      }

      $('progress-bar').style.width = (candidates.length ? (index / candidates.length) * 100 : 100) + '%'

      if (index < candidates.length) {
        window.requestAnimationFrame(step)
      } else {
        finish(rows, candidates.length, failures, {
          yMode: yMode,
          transformationType: transformationType,
          threshold: threshold,
          scoreFiltered: state.scoreFilterActive,
          maskDropped: maskDropped,
          maskUsed: !!mask,
          scale: scale,
          fullOutlines: fullOutlines
        })
      }
    }

    window.requestAnimationFrame(step)
  }

  function finish (rows, attempted, failures, settings) {
    state.rows = rows
    state.settings = settings
    state.sortKey = null
    state.sortDir = 1

    $('progress').hidden = true
    $('progress-bar').style.width = '0'
    $('run').disabled = false

    var total = state.pixelFeatures.length
    var dropped = total - attempted
    var reason = settings.scoreFiltered
      ? 'score below ' + settings.threshold + ' or text filter'
      : 'text filter; scores in this file are all identical, so they were not used'
    if (settings.maskUsed) {
      reason += '; ' + settings.maskDropped.toLocaleString() + ' outside the Allmaps mask'
    }
    var summary = '<strong>' + rows.length.toLocaleString() + '</strong> of <strong>' +
      total.toLocaleString() + '</strong> detections converted. ' +
      dropped.toLocaleString() + ' filtered out (' + reason +
      '). Transformation: <code>' + settings.transformationType + '</code>, ' +
      state.annotation.gcps.length + ' GCPs, ' +
      (Math.abs(settings.scale - 1) < 0.001 ? '' : 'coordinates scaled ×' + settings.scale.toFixed(4) + ', ') +
      'Y treated as ' +
      (settings.yMode === 'negated' ? 'negative' : settings.yMode === 'up' ? 'upward' : 'downward') + '.'
    if (failures) summary += ' <strong>' + failures + '</strong> detections could not be transformed.'
    $('summary').innerHTML = summary

    setStatus($('run-status'), 'Done.', 'ok')
    $('results').hidden = false
    buildColumns()
    renderTable()
    if (state.map) drawMarkers()
  }

  /* ── Table ──────────────────────────────────────────────────────────────── */

  // The text and score columns are labeled with the field names actually used,
  // so they can be told apart from any other score-like column in the file.
  function baseColumns () {
    return [
      { key: 'text', label: state.textKey || 'text' },
      // Sorted and filtered on the numeric copy, but displayed straight from
      // the file: 0.98 stays 0.98, and a file holding a rounded 1 shows as 1
      // rather than a convincing-looking 1.000.
      { key: 'score', label: state.scoreKey || 'score', num: true, display: 'score_raw' },
      { key: 'lat', label: 'latitude', num: true, digits: 6 },
      { key: 'lon', label: 'longitude', num: true, digits: 6 },
      { key: 'pixel_x', label: 'pixel x', num: true, digits: 1 },
      { key: 'pixel_y', label: 'pixel y', num: true, digits: 1 },
      { key: 'geometry_type', label: 'geometry' },
      { key: 'vertex_count', label: 'vertices', num: true, digits: 0 }
    ]
  }

  // Any other MapReader property (patch id, page, …) becomes its own column.
  function buildColumns () {
    var extras = []
    var seen = {}
    state.rows.slice(0, 200).forEach(function (row) {
      // Only the two fields already shown as their own columns are excluded, so
      // a detection score sitting alongside the recognition score stays visible.
      var scoreKey = pickScoreKey(row.properties)
      var textKey = pickKey(row.properties, TEXT_KEYS)
      Object.keys(row.properties).forEach(function (key) {
        if (seen[key] || key === scoreKey || key === textKey) return
        var value = row.properties[key]
        if (value !== null && typeof value === 'object') return
        seen[key] = true
        extras.push({ key: key, label: key, prop: true })
      })
    })
    state.columns = baseColumns().concat(extras)
  }

  function cellValue (row, column) {
    return column.prop ? row.properties[column.key] : row[column.key]
  }

  function formatCell (row, column) {
    var value = column.display ? row[column.display] : cellValue(row, column)
    if (value === null || value === undefined || value === '') return '—'
    // Only computed values (lat/long, pixel centers) are rounded for display.
    // Anything carried over from the input file is printed as-is.
    if (column.num && typeof value === 'number' && column.digits !== undefined) {
      return value.toFixed(column.digits)
    }
    return String(value)
  }

  function renderTable () {
    var head = $('table-head')
    head.innerHTML = ''
    state.columns.forEach(function (column) {
      var th = document.createElement('th')
      th.textContent = column.label
      if (state.sortKey === column.key) {
        var arrow = document.createElement('span')
        arrow.className = 'arrow'
        arrow.textContent = state.sortDir > 0 ? ' ▲' : ' ▼'
        th.appendChild(arrow)
      }
      th.onclick = function () {
        if (state.sortKey === column.key) state.sortDir = -state.sortDir
        else { state.sortKey = column.key; state.sortDir = 1 }
        state.sortColumn = column
        renderTable()
      }
      head.appendChild(th)
    })

    var rows = state.rows.slice()
    if (state.sortKey) {
      var column = state.sortColumn
      rows.sort(function (a, b) {
        var va = cellValue(a, column)
        var vb = cellValue(b, column)
        if (va === null || va === undefined) return 1
        if (vb === null || vb === undefined) return -1
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * state.sortDir
        return String(va).localeCompare(String(vb)) * state.sortDir
      })
    }

    var body = $('table-body')
    body.innerHTML = ''
    var shown = rows.slice(0, MAX_TABLE_ROWS)
    var fragment = document.createDocumentFragment()
    shown.forEach(function (row) {
      var tr = document.createElement('tr')
      state.columns.forEach(function (column) {
        var td = document.createElement('td')
        td.textContent = formatCell(row, column)
        if (column.num) td.className = 'num'
        tr.appendChild(td)
      })
      fragment.appendChild(tr)
    })
    body.appendChild(fragment)

    $('table-note').textContent = rows.length > MAX_TABLE_ROWS
      ? 'Showing the first ' + MAX_TABLE_ROWS.toLocaleString() + ' of ' + rows.length.toLocaleString() +
        ' rows. Downloads contain every row. Click a column heading to sort.'
      : 'Click a column heading to sort.'
  }

  /* ── Downloads ──────────────────────────────────────────────────────────── */

  function csvCell (value) {
    if (value === null || value === undefined) return ''
    var text = String(value)
    return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text
  }

  function downloadCsv () {
    var extras = state.columns.filter(function (c) { return c.prop })
    var header = [state.textKey || 'text', state.scoreKey || 'score',
      'latitude', 'longitude', 'pixel_x', 'pixel_y', 'geometry_type', 'vertex_count']
      .concat(extras.map(function (c) { return c.key }))
    if (state.settings.fullOutlines) header.push('geometry_wkt')

    var lines = [header.map(csvCell).join(',')]
    state.rows.forEach(function (row) {
      var cells = [
        row.text,
        row.score_raw === undefined ? '' : row.score_raw,
        row.lat.toFixed(7),
        row.lon.toFixed(7),
        row.pixel_x.toFixed(2),
        row.pixel_y.toFixed(2),
        row.geometry_type,
        row.vertex_count
      ]
      extras.forEach(function (c) { cells.push(row.properties[c.key]) })
      if (state.settings.fullOutlines) cells.push(row.geoGeometry ? wkt(row.geoGeometry) : '')
      lines.push(cells.map(csvCell).join(','))
    })

    save(lines.join('\n'), 'mapreader-latlong.csv', 'text/csv')
  }

  function featureCollection (rows, geometryFor) {
    return {
      type: 'FeatureCollection',
      features: rows.map(function (row) {
        var properties = {}
        Object.keys(row.properties).forEach(function (key) {
          var value = row.properties[key]
          if (value === null || typeof value !== 'object') properties[key] = value
        })
        properties.latitude = Number(row.lat.toFixed(7))
        properties.longitude = Number(row.lon.toFixed(7))
        properties.pixel_x = Number(row.pixel_x.toFixed(2))
        properties.pixel_y = Number(row.pixel_y.toFixed(2))
        return { type: 'Feature', properties: properties, geometry: geometryFor(row) }
      })
    }
  }

  function downloadGeojson () {
    if (!state.settings.fullOutlines) {
      window.alert('Outlines were not transformed for this run. Tick "Transform full outlines" and convert again.')
      return
    }
    var collection = featureCollection(state.rows, function (row) { return row.geoGeometry })
    save(JSON.stringify(collection), 'mapreader-latlong.geojson', 'application/geo+json')
  }

  function downloadPoints () {
    var collection = featureCollection(state.rows, function (row) {
      return { type: 'Point', coordinates: [Number(row.lon.toFixed(7)), Number(row.lat.toFixed(7))] }
    })
    save(JSON.stringify(collection), 'mapreader-latlong-points.geojson', 'application/geo+json')
  }

  function save (text, filename, mime) {
    var blob = new Blob([text], { type: mime + ';charset=utf-8' })
    var url = URL.createObjectURL(blob)
    var link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.setTimeout(function () { URL.revokeObjectURL(url) }, 1000)
  }

  /* ── Optional map preview (needs a connection; degrades quietly) ───────── */

  function toggleMap () {
    var container = $('map')
    if (!container.hidden) {
      container.hidden = true
      $('map-controls').hidden = true
      $('map-status').hidden = true
      $('toggle-map').textContent = 'Show map preview'
      return
    }
    container.hidden = false
    $('toggle-map').textContent = 'Hide map preview'
    if (state.map) {
      $('map-controls').hidden = false
      state.map.invalidateSize()
      fitToDetections()
      drawMarkers()
      return
    }

    setStatus($('map-status'), 'Loading the map viewer…')
    $('map-status').hidden = false
    loadMapLibs(function (err) {
      if (err) {
        setStatus($('map-status'),
          'The map viewer could not load: ' + err.message +
          ' (vendor/allmaps-leaflet.js). The table and downloads are unaffected.', 'error')
        return
      }
      buildMap()
    })
  }

  // Loaded on demand: the viewer bundle is about a megabyte, and most runs end
  // at the downloads without ever opening a map.
  function loadMapLibs (done) {
    if (window.AllmapsLeaflet) return done(null)

    var link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = './vendor/leaflet.css'
    document.head.appendChild(link)

    var script = document.createElement('script')
    script.src = './vendor/allmaps-leaflet.js'
    script.onload = function () {
      done(window.AllmapsLeaflet ? null : new Error('bundle loaded but exported nothing'))
    }
    script.onerror = function () { done(new Error('could not load the viewer bundle')) }
    document.head.appendChild(script)
  }

  function buildMap () {
    var L = window.AllmapsLeaflet.L
    state.map = L.map('map', { preferCanvas: true })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(state.map)
    state.map.setView([0, 0], 2)

    $('map-controls').hidden = false
    // Set the view before adding the warped layer: added while the map is still
    // at its world view, the layer requests tiles for the wrong extent and can
    // come up blank.
    fitToDetections()
    addWarpedMap()
    drawMarkers()
  }

  function fitToDetections () {
    if (!state.map || !state.rows || !state.rows.length) return
    var L = window.AllmapsLeaflet.L
    state.map.fitBounds(L.latLngBounds(state.rows.slice(0, 3000).map(function (row) {
      return [row.lat, row.lon]
    })).pad(0.1))
  }

  // The historical map itself, warped live from its IIIF tiles using the same
  // annotation that produced the coordinates. Added before the detections so
  // the points draw on top of it.
  function addWarpedMap () {
    if (!state.annotationRaw || !window.AllmapsLeaflet.WarpedMapLayer) return
    try {
      state.warped = new window.AllmapsLeaflet.WarpedMapLayer(state.annotationRaw, {
        opacity: currentOpacity()
      })
      state.warped.addTo(state.map)
      watchForTiles()
    } catch (err) {
      state.warped = null
      setStatus($('map-status'),
        'Could not display the historical map: ' + err.message +
        '. This needs WebGL2 and a IIIF image server that allows cross-origin requests. The detection points below are unaffected.', 'error')
      $('map-status').hidden = false
      $('map-opacity').disabled = true
    }
  }

  /*
   * A IIIF service that never answers leaves an empty map and no error: the
   * layer is built, the canvas exists, nothing is drawn. David Rumsey's LUNA
   * server does exactly this — info.json returns instantly while region tiles
   * time out. So wait for the layer's first tile and say something if none
   * arrives.
   */
  function watchForTiles () {
    var arrived = false
    var generation = (state.tileWatch || 0) + 1
    state.tileWatch = generation

    state.map.once('firstmaptileloaded', function () {
      arrived = true
      if (state.tileWatch === generation) $('map-status').hidden = true
    })

    window.setTimeout(function () {
      if (arrived || !state.warped || state.tileWatch !== generation) return
      var host = state.annotation && state.annotation.label
      try { host = new URL(host).host } catch (e) { host = 'its IIIF image service' }
      setStatus($('map-status'),
        'No image tiles have arrived from ' + host + ', so the historical map is not drawing. ' +
        'That service may be slow, offline, or refusing tile requests — the coordinates, table and ' +
        'downloads are unaffected.', 'error')
      $('map-status').hidden = false
    }, TILE_WAIT)
  }

  function currentOpacity () {
    return Number($('map-opacity').value) / 100
  }

  function applyOpacity () {
    var percent = Number($('map-opacity').value)
    $('map-opacity-value').textContent = percent + '%'
    if (state.warped && state.warped.setOpacity) state.warped.setOpacity(percent / 100)
  }

  function drawMarkers () {
    if (!state.map || !state.rows) return
    if (state.markers) state.map.removeLayer(state.markers)
    var L = window.AllmapsLeaflet.L
    var shown = state.rows.slice(0, 3000)
    var markers = shown.map(function (row) {
      return L.circleMarker([row.lat, row.lon], {
        radius: 4,
        weight: 1,
        color: '#1f6f8b',
        fillColor: '#5fb0cc',
        fillOpacity: 0.8
      }).bindTooltip((row.text || '(no text)') + (row.score_raw === undefined ? '' : ' · ' + row.score_raw))
    })
    state.markers = L.layerGroup(markers)
    if ($('show-detections').checked) state.markers.addTo(state.map)

    if (state.rows.length > 3000) {
      setStatus($('map-status'), 'Showing the first 3,000 of ' +
        state.rows.length.toLocaleString() + ' detection points.')
      $('map-status').hidden = false
    } else {
      $('map-status').hidden = true
    }
  }

  function toggleDetections () {
    if (!state.map || !state.markers) return
    if ($('show-detections').checked) state.markers.addTo(state.map)
    else state.map.removeLayer(state.markers)
  }

  /* ── Wiring ─────────────────────────────────────────────────────────────── */

  function wireDropZone (element, onText) {
    ;['dragenter', 'dragover'].forEach(function (type) {
      element.addEventListener(type, function (event) {
        event.preventDefault()
        element.classList.add('dragover')
      })
    })
    ;['dragleave', 'drop'].forEach(function (type) {
      element.addEventListener(type, function () { element.classList.remove('dragover') })
    })
    element.addEventListener('drop', function (event) {
      event.preventDefault()
      var file = event.dataTransfer.files && event.dataTransfer.files[0]
      if (file) readFile(file, onText)
    })
  }

  function init () {
    $('pixel-file').addEventListener('change', function (event) {
      if (event.target.files[0]) readFile(event.target.files[0], loadPixels)
    })
    $('pixel-text').addEventListener('change', function (event) {
      if (event.target.value.trim()) loadPixels(event.target.value, 'pasted text')
    })
    wireDropZone($('drop-pixels'), loadPixels)

    $('annotation-file').addEventListener('change', function (event) {
      if (event.target.files[0]) readFile(event.target.files[0], loadAnnotation)
    })
    $('annotation-text').addEventListener('change', function (event) {
      if (event.target.value.trim()) loadAnnotation(event.target.value, 'pasted text')
    })
    wireDropZone($('drop-annotation'), loadAnnotation)

    $('fetch-annotation').addEventListener('click', function () {
      fetchAnnotation($('annotation-url').value.trim(), false)
    })
    $('source-image-file').addEventListener('change', function (event) {
      if (event.target.files[0]) readImageHeader(event.target.files[0])
    })
    var typedSize = function () {
      var w = Number($('source-width').value)
      var h = Number($('source-height').value)
      if (w > 0 && h > 0) {
        state.sourceImage = { width: w, height: h, name: null }
        describeSourceImage()
      }
    }
    $('source-width').addEventListener('change', typedSize)
    $('source-height').addEventListener('change', typedSize)
    $('source-clear').addEventListener('click', function () {
      $('source-image-file').value = ''
      setSourceImage(null)
    })

    $('reload-annotation').addEventListener('click', function () {
      fetchAnnotation(state.annotationUrl, true)
    })

    var slider = $('score-threshold')
    var number = $('score-number')
    slider.addEventListener('input', function () {
      number.value = slider.value
      updateScoreEffect()
    })
    number.addEventListener('input', function () {
      var value = Math.min(1, Math.max(0, Number(number.value) || 0))
      slider.value = value
      updateScoreEffect()
    })
    $('keep-unscored').addEventListener('change', updateScoreEffect)
    updateScoreEffect()

    $('run').addEventListener('click', run)
    $('dl-csv').addEventListener('click', downloadCsv)
    $('dl-geojson').addEventListener('click', downloadGeojson)
    $('dl-points').addEventListener('click', downloadPoints)
    $('toggle-map').addEventListener('click', toggleMap)
    $('map-opacity').addEventListener('input', applyOpacity)
    $('show-detections').addEventListener('change', toggleDetections)

    refreshRunButton()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
