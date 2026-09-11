/*
 * MapReader → lat/long
 *
 * Takes MapReader text detections whose coordinates are image pixels, plus an
 * Allmaps Georeference Annotation, and applies the annotation's ground control
 * points to every coordinate. Runs entirely client-side: the only optional
 * network calls are fetching an annotation by URL and the map preview tiles.
 */
;(function () {
  'use strict'

  var GcpTransformer = window.AllmapsTransform && window.AllmapsTransform.GcpTransformer

  // Fields MapReader (and neighbouring tools) use for the transcription and the
  // recognition confidence, in order of preference.
  var TEXT_KEYS = ['text', 'transcription', 'label', 'name', 'word']
  var SCORE_KEYS = ['score', 'confidence', 'text_score', 'prob']

  var MAX_TABLE_ROWS = 1000
  var CHUNK_SIZE = 200 // features transformed per animation frame

  var state = {
    pixelFeatures: null, // normalised array of GeoJSON-ish features
    pixelWarnings: [],
    annotation: null, // { gcps, transformationType, width, height, label }
    rows: null, // results of the last run
    sortKey: null,
    sortDir: 1,
    columns: [],
    map: null
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

  function normaliseFeatures (parsed) {
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
      width: source.width,
      height: source.height,
      label: source.id || item.id || 'annotation'
    }
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

  function textOf (props) {
    var key = pickKey(props, TEXT_KEYS)
    return key ? String(props[key]) : ''
  }

  function scoreOf (props) {
    var key = pickKey(props, SCORE_KEYS)
    if (!key) return null
    var value = Number(props[key])
    return isFinite(value) ? value : null
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
      var result = normaliseFeatures(parseLooseJson(text))
      state.pixelFeatures = result.features
      state.pixelWarnings = result.warnings

      var scored = result.features.filter(function (f) { return scoreOf(f.properties) !== null }).length
      var detected = detectYMode(result.features)
      var parts = [result.features.length.toLocaleString() + ' features loaded' + (origin ? ' from ' + origin : '')]
      parts.push(scored.toLocaleString() + ' with a score')
      parts.push('Y looks ' + (detected === 'negated' ? 'negative (will be flipped)' : 'downward (used as-is)'))
      setStatus($('pixel-status'), parts.concat(result.warnings).join(' · '), 'ok')
      $('y-axis-hint').dataset.detected = detected
    } catch (err) {
      state.pixelFeatures = null
      setStatus($('pixel-status'), err.message, 'error')
    }
    refreshRunButton()
  }

  function loadAnnotation (text, origin) {
    try {
      var maps = parseAnnotation(parseLooseJson(text))
      state.annotation = maps[0]
      var a = state.annotation
      var parts = [a.gcps.length + ' ground control points']
      parts.push('transformation: ' + a.transformationType)
      if (a.width && a.height) parts.push('image ' + a.width + '×' + a.height + ' px')
      if (maps.length > 1) parts.push('note: file holds ' + maps.length + ' maps, using the first')
      if (origin) parts.push('from ' + origin)
      setStatus($('annotation-status'), parts.join(' · '), 'ok')
      $('transformation-hint').textContent =
        'Leave as "From annotation" to use ' + a.transformationType + ', exactly as chosen in Allmaps Editor.'
    } catch (err) {
      state.annotation = null
      setStatus($('annotation-status'), err.message, 'error')
    }
    refreshRunButton()
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

  function readFile (file, onText) {
    var reader = new FileReader()
    reader.onload = function () { onText(String(reader.result), file.name) }
    reader.onerror = function () { window.alert('Could not read ' + file.name) }
    reader.readAsText(file)
  }

  /* ── The conversion run ─────────────────────────────────────────────────── */

  function run () {
    var threshold = Number($('score-number').value)
    var keepUnscored = $('keep-unscored').checked
    var textNeedle = $('text-filter').value.trim().toLowerCase()
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

    var candidates = state.pixelFeatures.filter(function (f) {
      var score = scoreOf(f.properties)
      if (score === null) { if (!keepUnscored) return false } else if (score < threshold) return false
      if (textNeedle && textOf(f.properties).toLowerCase().indexOf(textNeedle) === -1) return false
      return true
    })

    var rows = []
    var failures = 0
    var index = 0

    $('run').disabled = true
    $('progress').hidden = false
    setStatus($('run-status'), 'Converting ' + candidates.length.toLocaleString() + ' detections…')

    function toGeo (point) {
      return transformer.transformToGeo([Number(point[0]), correctY(Number(point[1]))])
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
    var summary = '<strong>' + rows.length.toLocaleString() + '</strong> of <strong>' +
      total.toLocaleString() + '</strong> detections converted. ' +
      dropped.toLocaleString() + ' filtered out (score below ' + settings.threshold +
      ' or text filter). Transformation: <code>' + settings.transformationType + '</code>, ' +
      state.annotation.gcps.length + ' GCPs, Y treated as ' +
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

  var BASE_COLUMNS = [
    { key: 'text', label: 'text' },
    { key: 'score', label: 'score', num: true, digits: 3 },
    { key: 'lat', label: 'latitude', num: true, digits: 6 },
    { key: 'lon', label: 'longitude', num: true, digits: 6 },
    { key: 'pixel_x', label: 'pixel x', num: true, digits: 1 },
    { key: 'pixel_y', label: 'pixel y', num: true, digits: 1 },
    { key: 'geometry_type', label: 'geometry' },
    { key: 'vertex_count', label: 'vertices', num: true, digits: 0 }
  ]

  // Any other MapReader property (patch id, page, …) becomes its own column.
  function buildColumns () {
    var extras = []
    var seen = {}
    var usedKeys = TEXT_KEYS.concat(SCORE_KEYS)
    state.rows.slice(0, 200).forEach(function (row) {
      Object.keys(row.properties).forEach(function (key) {
        if (seen[key] || usedKeys.indexOf(key) !== -1) return
        var value = row.properties[key]
        if (value !== null && typeof value === 'object') return
        seen[key] = true
        extras.push({ key: key, label: key, prop: true })
      })
    })
    state.columns = BASE_COLUMNS.concat(extras)
  }

  function cellValue (row, column) {
    return column.prop ? row.properties[column.key] : row[column.key]
  }

  function formatCell (row, column) {
    var value = cellValue(row, column)
    if (value === null || value === undefined || value === '') return '—'
    if (column.num && typeof value === 'number') return value.toFixed(column.digits)
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
    var header = ['text', 'score', 'latitude', 'longitude', 'pixel_x', 'pixel_y', 'geometry_type', 'vertex_count']
      .concat(extras.map(function (c) { return c.key }))
    if (state.settings.fullOutlines) header.push('geometry_wkt')

    var lines = [header.map(csvCell).join(',')]
    state.rows.forEach(function (row) {
      var cells = [
        row.text,
        row.score === null ? '' : row.score,
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

  var LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
  var LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

  function toggleMap () {
    var container = $('map')
    if (!container.hidden) {
      container.hidden = true
      $('map-status').hidden = true
      $('toggle-map').textContent = 'Show map preview'
      return
    }
    container.hidden = false
    $('toggle-map').textContent = 'Hide map preview'
    if (state.map) { state.map.invalidateSize(); drawMarkers(); return }

    setStatus($('map-status'), 'Loading map tiles…')
    $('map-status').hidden = false
    loadLeaflet(function (err) {
      if (err) {
        setStatus($('map-status'), 'The preview needs an internet connection (it loads Leaflet and OpenStreetMap tiles). The downloads work offline.', 'error')
        return
      }
      $('map-status').hidden = true
      state.map = window.L.map('map')
      window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(state.map)
      state.map.setView([0, 0], 2)
      drawMarkers()
    })
  }

  function loadLeaflet (done) {
    if (window.L) return done(null)
    var link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = LEAFLET_CSS
    document.head.appendChild(link)
    var script = document.createElement('script')
    script.src = LEAFLET_JS
    script.onload = function () { done(null) }
    script.onerror = function () { done(new Error('offline')) }
    document.head.appendChild(script)
  }

  function drawMarkers () {
    if (!state.map || !state.rows) return
    if (state.layer) state.map.removeLayer(state.layer)
    var L = window.L
    var markers = state.rows.slice(0, 3000).map(function (row) {
      return L.circleMarker([row.lat, row.lon], {
        radius: 4,
        weight: 1,
        color: '#1f6f8b',
        fillColor: '#5fb0cc',
        fillOpacity: 0.8
      }).bindTooltip((row.text || '(no text)') + (row.score === null ? '' : ' · ' + row.score))
    })
    state.layer = L.layerGroup(markers).addTo(state.map)
    if (markers.length) {
      state.map.fitBounds(L.latLngBounds(state.rows.slice(0, 3000).map(function (row) {
        return [row.lat, row.lon]
      })).pad(0.1))
    }
    setStatus($('map-status'), state.rows.length > 3000
      ? 'Previewing the first 3,000 label points.'
      : 'Previewing ' + markers.length.toLocaleString() + ' label points.')
    $('map-status').hidden = state.rows.length <= 3000
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
      var url = $('annotation-url').value.trim()
      if (!url) return
      setStatus($('annotation-status'), 'Fetching…')
      window.fetch(url)
        .then(function (response) {
          if (!response.ok) throw new Error('HTTP ' + response.status)
          return response.text()
        })
        .then(function (text) { loadAnnotation(text, 'URL') })
        .catch(function (err) {
          setStatus($('annotation-status'),
            'Could not fetch that URL (' + err.message + '). Download the annotation and load the file instead.', 'error')
        })
    })

    var slider = $('score-threshold')
    var number = $('score-number')
    slider.addEventListener('input', function () { number.value = slider.value })
    number.addEventListener('input', function () {
      var value = Math.min(1, Math.max(0, Number(number.value) || 0))
      slider.value = value
    })

    $('run').addEventListener('click', run)
    $('dl-csv').addEventListener('click', downloadCsv)
    $('dl-geojson').addEventListener('click', downloadGeojson)
    $('dl-points').addEventListener('click', downloadPoints)
    $('toggle-map').addEventListener('click', toggleMap)

    refreshRunButton()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
