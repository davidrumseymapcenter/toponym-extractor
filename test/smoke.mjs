/*
 * End-to-end smoke test: loads index.html in jsdom, feeds it the sample files
 * through the real UI controls, and checks the resulting table and downloads.
 *
 *   npm test
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { JSDOM, VirtualConsole } from 'jsdom'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(root, p), 'utf8')

let failures = 0
function check (label, condition, detail) {
  if (condition) {
    console.log('  ok   ' + label)
  } else {
    failures++
    console.log('  FAIL ' + label + (detail === undefined ? '' : ' → ' + detail))
  }
}

const virtualConsole = new VirtualConsole()
virtualConsole.on('jsdomError', (err) => {
  failures++
  console.log('  FAIL page error → ' + err.message)
})

const dom = new JSDOM(read('index.html'), {
  runScripts: 'dangerously',
  url: 'https://example.org/toponym-extractor/',
  virtualConsole,
  pretendToBeVisual: true,
  resources: undefined
})
const { window } = dom
const document = window.document

// jsdom serves no subresources, so inject the two scripts by hand.
for (const src of ['vendor/allmaps-transform.js', 'vendor/image-size.js', 'app.js']) {
  const script = document.createElement('script')
  script.textContent = read(src)
  document.body.appendChild(script)
}

// Captured downloads, plus the URL.createObjectURL that jsdom lacks.
const downloads = []
window.HTMLAnchorElement.prototype.click = function () {
  downloads.push({ name: this.download, text: this.__text })
}
window.URL.createObjectURL = (blob) => {
  const link = { __blob: blob }
  blobs.push(blob)
  return 'blob:' + blobs.length
}
window.URL.revokeObjectURL = () => {}
const blobs = []
// Blob.text() is async; keep the payloads as they are created instead.
const NativeBlob = window.Blob
window.Blob = class extends NativeBlob {
  constructor (parts, options) {
    super(parts, options)
    this.__text = String(parts[0])
    lastBlobText = this.__text
  }
}
let lastBlobText = ''

// Let jsdom finish parsing so the app's DOMContentLoaded wiring runs.
await new Promise((resolve) => window.setTimeout(resolve, 50))

const $ = (id) => document.getElementById(id)
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }))

function paste (id, text) {
  $(id).value = text
  fire($(id), 'change')
}

console.log('\nLoading inputs')
paste('pixel-text', read('samples/mapreader-detections.example.geojson'))
paste('annotation-text', read('samples/annotation.example.json'))

check('detections parsed', /12 features loaded/.test($('pixel-status').textContent), $('pixel-status').textContent)
check('negative Y detected', /Y looks negative/.test($('pixel-status').textContent), $('pixel-status').textContent)
check('GCPs parsed', /4 ground control points/.test($('annotation-status').textContent), $('annotation-status').textContent)
check('polynomial order folded into type', /polynomial1/.test($('annotation-status').textContent), $('annotation-status').textContent)
check('image size read', /4708×1860/.test($('annotation-status').textContent), $('annotation-status').textContent)
check('run enabled', $('run').disabled === false)

console.log('\nScore diagnostics')
check('score field named and ranged', /12 with a "score" \(range 0\.31–0\.99, \d+ distinct values\)/.test($('pixel-status').textContent), $('pixel-status').textContent)
check('no rounding warning on good data', !/rounded/.test($('pixel-status').textContent))

const rounded = JSON.parse(read('samples/mapreader-detections.example.geojson'))
rounded.features.forEach((f) => { f.properties.score = Math.round(f.properties.score) })
paste('pixel-text', JSON.stringify(rounded))
check('rounded scores flagged', /whole numbers only/.test($('pixel-status').textContent), $('pixel-status').textContent)

const noScore = JSON.parse(read('samples/mapreader-detections.example.geojson'))
noScore.features.forEach((f) => { delete f.properties.score })
paste('pixel-text', JSON.stringify(noScore))
check('missing score field named', /no recognition score found/.test($('pixel-status').textContent), $('pixel-status').textContent)

const altKey = JSON.parse(read('samples/mapreader-detections.example.geojson'))
altKey.features.forEach((f) => { f.properties.confidence = f.properties.score; delete f.properties.score })
paste('pixel-text', JSON.stringify(altKey))
check('alternative score key used', /with a "confidence"/.test($('pixel-status').textContent), $('pixel-status').textContent)

console.log('\nRecognition score wins over a detection score')
const box = [[[300, -300], [340, -300], [340, -340], [300, -340], [300, -300]]]
const bothScores = {
  type: 'FeatureCollection',
  features: [
    { text: 'Diambour', score: 1.0, rec_score: 0.98 },
    { text: 'Quai', score: 0.999, rec_score: 0.82 },
    { text: 'smudge', score: 1.0, rec_score: 0.31 }
  ].map((properties) => ({ type: 'Feature', properties, geometry: { type: 'Polygon', coordinates: box } }))
}
paste('pixel-text', JSON.stringify(bothScores))
const bothStatus = $('pixel-status').textContent
check('rec_score chosen, not score', /with a "rec_score" \(range 0\.31–0\.98/.test(bothStatus), bothStatus)
check('detection score called out', /not filtering on score — shown as its own column/.test(bothStatus), bothStatus)

$('score-number').value = '0.5'
fire($('score-number'), 'input')
$('run').click()
await new Promise((resolve) => window.setTimeout(resolve, 200))
const bothHeader = [...document.querySelectorAll('#table-head th')].map((th) => th.textContent.trim())
check('columns name the fields used', bothHeader.slice(0, 2).join(',') === 'text,rec_score' && bothHeader.includes('score'), bothHeader.join(','))
const bothRows = [...document.querySelectorAll('#table-body tr')]
check('filtering used rec_score', bothRows.length === 2, bothRows.map((tr) => tr.children[0].textContent).join(','))
check('score column shows rec_score verbatim', bothRows.map((tr) => tr.children[1].textContent).join(',') === '0.98,0.82',
  bothRows.map((tr) => tr.children[1].textContent).join(','))

// A file with only a near-1.0 detection-style `score` still works, but the
// warning has to make clear the values are not recognition confidences.
paste('pixel-text', JSON.stringify({
  type: 'FeatureCollection',
  features: [1.0, 1.0, 1.0].map((score) => ({ type: 'Feature', properties: { text: 'x', score }, geometry: { type: 'Polygon', coordinates: box } }))
}))
check('all-1.0 scores flagged as rounded/unusable', /all exactly 1.*whole numbers only/.test($('pixel-status').textContent), $('pixel-status').textContent)

console.log('\nThreshold readout and adaptive slider')
paste('pixel-text', read('samples/mapreader-detections.example.geojson'))
$('score-number').value = '0.9'
fire($('score-number'), 'input')
check('readout reports the effect', /Scores run 0.31–0.99, median 0.94. At 0.9 this drops 4 of 12 \(33%\), keeping 8./.test($('score-hint').textContent), $('score-hint').textContent)
check('slider enabled for varied scores', $('score-threshold').disabled === false)

fire($('keep-unscored'), 'change')
paste('pixel-text', JSON.stringify({
  type: 'FeatureCollection',
  features: [1, 1, 1, 1].map((score) => ({ type: 'Feature', properties: { text: 'x', score }, geometry: { type: 'Polygon', coordinates: box } }))
}))
check('slider disabled when every score is identical', $('score-threshold').disabled === true && $('score-number').disabled === true)
check('disabled reason explained', /scores exactly 1, so filtering by score is switched off/.test($('score-hint').textContent), $('score-hint').textContent)

// The stored 0.9 must not be applied while the control is off.
$('run').click()
await new Promise((resolve) => window.setTimeout(resolve, 200))
check('identical scores do not filter everything out', [...document.querySelectorAll('#table-body tr')].length === 4,
  [...document.querySelectorAll('#table-body tr')].length)
check('summary explains scores were unused', /scores in this file are all identical, so they were not used/.test($('summary').textContent), $('summary').textContent)

check('card dimmed when scores are uniform', $('score-option').className.includes('inactive'), $('score-option').className)
check('slider parked on the shared value', $('score-threshold').value === '1' && $('score-number').value === '1',
  $('score-threshold').value + '/' + $('score-number').value)

// Returning to a file with real scores must restore the chosen threshold,
// not inherit the parked 1.
paste('pixel-text', read('samples/mapreader-detections.example.geojson'))
check('threshold restored on reactivation', $('score-number').value === '0.9', $('score-number').value)
check('card undimmed again', !$('score-option').className.includes('inactive'), $('score-option').className)
check('slider usable again', $('score-threshold').disabled === false)

paste('pixel-text', JSON.stringify(noScore))
check('slider disabled when there are no scores', $('score-threshold').disabled === true)
check('no-score reason explained', /nothing to filter on/.test($('score-hint').textContent), $('score-hint').textContent)
check('slider parked at zero when there is nothing to filter', $('score-threshold').value === '0', $('score-threshold').value)

console.log('\nTolerant parsing of a bare feature with a trailing comma')
paste('pixel-text', '{"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[768.09, -759.38], [767.57, -794.02], [774.43, -792.60], [768.09, -759.38]]]}, "properties": {"text": "Diambour", "score": 0.98}},')
check('single trailing-comma feature accepted', /1 features loaded/.test($('pixel-status').textContent), $('pixel-status').textContent)

console.log('\nRunning the conversion')
paste('pixel-text', read('samples/mapreader-detections.example.geojson'))
$('score-number').value = '0.5'
fire($('score-number'), 'input')
$('run').click()

await new Promise((resolve) => window.setTimeout(resolve, 300))

const summary = $('summary').textContent
console.log('  summary: ' + summary.replace(/\s+/g, ' ').trim())
check('results shown', $('results').hidden === false)
check('some rows filtered by score', /of 12 detections converted/.test(summary), summary)
check('no transform failures', !/could not be transformed/.test(summary), summary)
check('Y reported as negative', /Y treated as negative/.test(summary), summary)

const rows = [...document.querySelectorAll('#table-body tr')]
check('table has rows', rows.length > 0, rows.length)
const header = [...document.querySelectorAll('#table-head th')].map((th) => th.textContent.trim())
check('table columns', header.join(',') === 'text,score,latitude,longitude,pixel x,pixel y,geometry,vertices', header.join(','))

const first = rows[0].children
const lat = Number(first[2].textContent)
const lon = Number(first[3].textContent)
console.log('  first row: ' + first[0].textContent + ' score ' + first[1].textContent + ' → ' + lat + ', ' + lon)
check('latitude inside the map area', lat > 48.85 && lat < 48.87, lat)
check('longitude inside the map area', lon > 2.28 && lon < 2.30, lon)

console.log('\nLow scores are excluded')
check('the 0.31 smudge is gone', !rows.some((tr) => tr.children[0].textContent === 'Illegible smudge'))

console.log('\nSorting')
document.querySelectorAll('#table-head th')[1].click()
const scores = [...document.querySelectorAll('#table-body tr')].map((tr) => Number(tr.children[1].textContent))
check('ascending by score', scores.every((v, i) => i === 0 || scores[i - 1] <= v), scores.join(' '))
document.querySelectorAll('#table-head th')[1].click()
const desc = [...document.querySelectorAll('#table-body tr')].map((tr) => Number(tr.children[1].textContent))
check('descending on second click', desc.every((v, i) => i === 0 || desc[i - 1] >= v), desc.join(' '))

console.log('\nDownloads')
$('dl-csv').click()
const csv = lastBlobText
const csvLines = csv.trim().split('\n')
check('CSV header', csvLines[0] === 'text,score,latitude,longitude,pixel_x,pixel_y,geometry_type,vertex_count,geometry_wkt', csvLines[0])
check('CSV row count matches table', csvLines.length - 1 === state_rows(), csvLines.length - 1)
check('CSV has WKT polygons', /POLYGON \(\(2\./.test(csv))
check('CSV quotes fields with commas', !/,\s*$/.test(csvLines[1]))

$('dl-geojson').click()
const geojson = JSON.parse(lastBlobText)
check('GeoJSON is a FeatureCollection', geojson.type === 'FeatureCollection')
check('GeoJSON polygons transformed', geojson.features[0].geometry.type === 'Polygon')
const ring = geojson.features[0].geometry.coordinates[0]
check('GeoJSON ring is lon/lat', ring[0][0] > 2.28 && ring[0][0] < 2.3 && ring[0][1] > 48.85 && ring[0][1] < 48.87, JSON.stringify(ring[0]))
check('GeoJSON keeps properties', geojson.features[0].properties.text.length > 0)
check('GeoJSON adds latitude/longitude', typeof geojson.features[0].properties.latitude === 'number')

$('dl-points').click()
const points = JSON.parse(lastBlobText)
check('label points are Points', points.features.every((f) => f.geometry.type === 'Point'))

check('download filenames', downloads.map((d) => d.name).join(',') ===
  'mapreader-latlong.csv,mapreader-latlong.geojson,mapreader-latlong-points.geojson',
  downloads.map((d) => d.name).join(','))

console.log('\nScores are displayed and exported verbatim')
const verbatim = {
  type: 'FeatureCollection',
  features: [0.98, 1, 0.9, 0.875].map((score, i) => ({
    type: 'Feature',
    properties: { text: 'label' + i, score },
    geometry: { type: 'Polygon', coordinates: [[[300, -300], [340, -300], [340, -340], [300, -340], [300, -300]]] }
  }))
}
paste('pixel-text', JSON.stringify(verbatim))
$('score-number').value = '0'
fire($('score-number'), 'input')
$('run').click()
await new Promise((resolve) => window.setTimeout(resolve, 200))
const displayed = [...document.querySelectorAll('#table-body tr')].map((tr) => tr.children[1].textContent)
check('no padding or rounding in the table', displayed.join(',') === '0.98,1,0.9,0.875', displayed.join(','))
$('dl-csv').click()
const csvScores = lastBlobText.trim().split('\n').slice(1).map((line) => line.split(',')[1])
check('CSV carries the same values', csvScores.join(',') === '0.98,1,0.9,0.875', csvScores.join(','))

console.log('\nText filter')
paste('pixel-text', read('samples/mapreader-detections.example.geojson'))
$('score-number').value = '0.5'
fire($('score-number'), 'input')
$('text-filter').value = 'palais'
$('run').click()
await new Promise((resolve) => window.setTimeout(resolve, 200))
const filtered = [...document.querySelectorAll('#table-body tr')]
check('only matching text remains', filtered.length === 1 && filtered[0].children[0].textContent === 'Palais',
  filtered.map((tr) => tr.children[0].textContent).join(','))
$('text-filter').value = ''

console.log('\nAccent-insensitive text search')
const accents = {
  type: 'FeatureCollection',
  features: ['SEGOU', 'Ségouba', 'Segouro', 'Sénégal', 'Kayes'].map((text) => ({
    type: 'Feature', properties: { text, score: 0.9 }, geometry: { type: 'Polygon', coordinates: box }
  }))
}
paste('pixel-text', JSON.stringify(accents))
$('score-number').value = '0'
fire($('score-number'), 'input')
const searchFor = async (needle) => {
  $('text-filter').value = needle
  $('run').click()
  await new Promise((resolve) => window.setTimeout(resolve, 150))
  return [...document.querySelectorAll('#table-body tr')].map((tr) => tr.children[0].textContent).sort().join(',')
}
check('unaccented query finds accented text', await searchFor('segou') === 'SEGOU,Segouro,Ségouba', await searchFor('segou'))
check('accented query finds unaccented text', await searchFor('ségou') === 'SEGOU,Segouro,Ségouba', await searchFor('ségou'))
check('case is still ignored', await searchFor('SÉNÉGAL') === 'Sénégal', await searchFor('SÉNÉGAL'))
check('non-matching query returns nothing', await searchFor('zzz') === '', await searchFor('zzz'))
$('text-filter').value = ''

console.log('\nY-axis override')
// The wrong Y axis puts every centroid outside the mask, so this has to run
// with masking off to observe the mirroring itself.
$('use-mask').checked = false
$('y-axis').value = 'down'
$('run').click()
await new Promise((resolve) => window.setTimeout(resolve, 200))
check('downward Y reported', /Y treated as downward/.test($('summary').textContent))
const mirroredLat = Number(document.querySelectorAll('#table-body tr')[0].children[2].textContent)
check('wrong Y axis visibly moves the result', Math.abs(mirroredLat - lat) > 0.001, mirroredLat)

// With the mask on, that same mistake empties the results — worth pinning,
// since it is the loudest signal the app gives that the axis is wrong.
$('use-mask').checked = true
$('run').click()
await new Promise((resolve) => window.setTimeout(resolve, 200))
check('wrong Y axis plus mask drops everything', [...document.querySelectorAll('#table-body tr')].length === 0,
  [...document.querySelectorAll('#table-body tr')].length)
const emptied = $('summary').textContent.replace(/\s+/g, ' ')
check('and says the mask did it', /^0 of (\d+) detections converted\./.test(emptied) &&
  new RegExp(emptied.match(/^0 of (\d+)/)[1] + ' outside the Allmaps mask').test(emptied), emptied)

console.log('\nTransformation override')
$('y-axis').value = 'auto'
$('transformation').value = 'polynomial3'
$('run').click()
await new Promise((resolve) => window.setTimeout(resolve, 200))
check('too-few-GCPs error surfaced', /Cannot build the transformation/.test($('run-status').textContent), $('run-status').textContent)
check('error does not clear earlier results', $('results').hidden === false)

$('transformation').value = 'thinPlateSpline'
$('run').click()
await new Promise((resolve) => window.setTimeout(resolve, 200))
check('thinPlateSpline runs', /thinPlateSpline/.test($('summary').textContent), $('summary').textContent)

console.log('\nBad input handling')
paste('pixel-text', 'not json at all')
check('parse error reported', /class="status error"|status error/.test($('pixel-status').outerHTML))
check('run disabled after bad input', $('run').disabled === true)

/*
 * Map preview. jsdom has no WebGL and fetches no subresources, so the real
 * warped layer cannot render here — these checks cover the wiring around it
 * (construction, opacity, layer toggling, failure handling) against a stub.
 * Whether tiles actually warp on screen has to be confirmed in a browser.
 */
console.log('\nDetections measured on a different image')
{
  // Header-only dimension reading: a JPEG with a known size, built by hand.
  const jpegHeader = (w, h) => {
    const bytes = [0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, h >> 8, h & 0xff, w >> 8, w & 0xff, 0x03]
    return new Uint8Array(bytes.concat(new Array(40).fill(0))).buffer
  }
  const size = window.ImageSize.imageSize(jpegHeader(9196, 7979))
  check('JPEG header parsed', size && size.width === 9196 && size.height === 7979, JSON.stringify(size))
  check('PNG header parsed', (() => {
    const b = new Uint8Array(32); const v = new DataView(b.buffer)
    v.setUint32(0, 0x89504e47); v.setUint32(16, 4708); v.setUint32(20, 1860)
    const s = window.ImageSize.imageSize(b.buffer)
    return s && s.width === 4708 && s.height === 1860
  })())
  check('TIFF header parsed', (() => {
    const b = new Uint8Array(64); const v = new DataView(b.buffer)
    v.setUint16(0, 0x4949, true); v.setUint16(2, 42, true); v.setUint32(4, 8, true)
    v.setUint16(8, 2, true)
    v.setUint16(10, 256, true); v.setUint16(12, 4, true); v.setUint32(14, 1, true); v.setUint32(18, 9196, true)
    v.setUint16(22, 257, true); v.setUint16(24, 4, true); v.setUint32(26, 1, true); v.setUint32(30, 7979, true)
    const s = window.ImageSize.imageSize(b.buffer)
    return s && s.width === 9196 && s.height === 7979
  })())
  check('unknown format rejected', window.ImageSize.imageSize(new Uint8Array(40).buffer) === null)

  // The real failure: detections from a 9196-wide scan, annotation on a
  // 4708-wide image. Without correction everything drifts toward the origin.
  paste('pixel-text', read('samples/mapreader-detections.example.geojson'))
  paste('annotation-text', read('samples/annotation.example.json'))
  $('score-number').value = '0'
  fire($('score-number'), 'input')
  $('use-mask').checked = false
  $('run').click()
  await new Promise((resolve) => window.setTimeout(resolve, 300))
  const plainLat = Number(document.querySelectorAll('#table-body tr')[0].children[2].textContent)
  const plainLon = Number(document.querySelectorAll('#table-body tr')[0].children[3].textContent)
  check('no scaling by default', /GCPs, Y treated as/.test($('summary').textContent) &&
    !/coordinates scaled/.test($('summary').textContent), $('summary').textContent)

  $('source-width').value = '2354'
  $('source-height').value = '930'
  fire($('source-height'), 'change')
  check('typed size accepted and scale reported', /coordinates scaled ×2\.0000 to match the annotation's 4708×1860/.test($('source-image-status').textContent),
    $('source-image-status').textContent)
  check('proportional images raise no warning', !/different proportions/.test($('source-image-status').textContent))

  $('run').click()
  await new Promise((resolve) => window.setTimeout(resolve, 300))
  check('summary reports the scaling', /coordinates scaled ×2\.0000/.test($('summary').textContent), $('summary').textContent)
  const scaledLat = Number(document.querySelectorAll('#table-body tr')[0].children[2].textContent)
  const scaledLon = Number(document.querySelectorAll('#table-body tr')[0].children[3].textContent)
  check('coordinates actually moved', Math.abs(scaledLat - plainLat) > 0.0005 || Math.abs(scaledLon - plainLon) > 0.0005,
    `${plainLat},${plainLon} → ${scaledLat},${scaledLon}`)

  // Disproportionate images are the case that cannot be fully corrected.
  $('source-width').value = '9196'
  $('source-height').value = '7979'
  fire($('source-height'), 'change')
  check('different proportions warned about', /different proportions \(1\.153 vs 2\.531\)/.test($('source-image-status').textContent),
    $('source-image-status').textContent)
  check('width ratio still used', /scaled ×0\.5120/.test($('source-image-status').textContent), $('source-image-status').textContent)

  $('source-clear').click()
  check('clearing restores the default assumption', /Assuming the same image as the annotation/.test($('source-image-status').textContent),
    $('source-image-status').textContent)
  $('run').click()
  await new Promise((resolve) => window.setTimeout(resolve, 300))
  check('unscaled again after clearing', !/coordinates scaled/.test($('summary').textContent), $('summary').textContent)
  $('use-mask').checked = true
}

console.log('\nReloading the annotation from its URL')
{
  // The workflow: review the results, fix the georeferencing in Allmaps Editor,
  // reload the annotation without touching the loaded detections.
  const noMaskVersion = JSON.parse(read('samples/annotation.example.json'))
  delete noMaskVersion.target.selector
  const maskedVersion = JSON.parse(read('samples/annotation.example.json'))
  // A mask drawn tighter than the sheet, excluding the left-hand column of the
  // sample detections (x = 300) so the trim is observable.
  maskedVersion.target.selector.value =
    '<svg width="4708" height="1860"><polygon points="1000,100 1000,1500 4600,1500 4600,100" /></svg>'
  maskedVersion.body.features.push({
    type: 'Feature',
    properties: { resourceCoords: [2000, 900] },
    geometry: { type: 'Point', coordinates: [2.2925, 48.8602] }
  })

  const fetched = []
  let serve = noMaskVersion
  window.fetch = (url, options) => {
    fetched.push({ url, cache: options?.cache })
    return Promise.resolve({ ok: true, text: () => Promise.resolve(JSON.stringify(serve)) })
  }

  paste('pixel-text', read('samples/mapreader-detections.example.geojson'))
  $('annotation-url').value = 'https://annotations.allmaps.org/maps/abc123'
  $('fetch-annotation').click()
  await new Promise((resolve) => window.setTimeout(resolve, 60))

  check('fetch bypasses the CDN cache', /_=\d+/.test(fetched[0].url) && fetched[0].cache === 'no-store',
    JSON.stringify(fetched[0]))
  check('annotation loaded from URL', /4 ground control points/.test($('annotation-status').textContent),
    $('annotation-status').textContent)
  check('reload button revealed', $('reload-annotation').hidden === false)
  check('no mask yet', $('use-mask').disabled === true, $('mask-hint').textContent)

  $('score-number').value = '0'
  fire($('score-number'), 'input')
  $('run').click()
  await new Promise((resolve) => window.setTimeout(resolve, 200))
  const before = [...document.querySelectorAll('#table-body tr')].length
  check('results exist before reloading', before === 12, before)

  // Now the Editor has been used: a mask and an extra control point.
  serve = maskedVersion
  $('reload-annotation').click()
  await new Promise((resolve) => window.setTimeout(resolve, 300))

  check('reload re-fetched the same URL', fetched.length === 2 &&
    fetched[1].url.split('?')[0] === 'https://annotations.allmaps.org/maps/abc123', JSON.stringify(fetched[1]))
  check('each request gets a fresh cache-buster', fetched[0].url !== fetched[1].url)
  check('reload reported as such', /from reloaded URL/.test($('annotation-status').textContent),
    $('annotation-status').textContent)
  check('changes summarized', /changed: control points 4 → 5, mask added, covering \d+%/.test($('annotation-status').textContent),
    $('annotation-status').textContent)
  check('mask control now live', $('use-mask').disabled === false)
  check('detections were not reloaded', /12 features loaded/.test($('pixel-status').textContent),
    $('pixel-status').textContent)
  check('conversion re-ran against the new annotation', /5 GCPs/.test($('summary').textContent),
    $('summary').textContent.replace(/\s+/g, ' '))
  const after = [...document.querySelectorAll('#table-body tr')].length
  check('the new mask trimmed the results', after === 10, before + ' → ' + after)
  check('the trim is attributed to the mask', /2 outside the Allmaps mask/.test($('summary').textContent),
    $('summary').textContent.replace(/\s+/g, ' '))

  // An unchanged annotation should say so rather than imply an edit landed.
  $('reload-annotation').click()
  await new Promise((resolve) => window.setTimeout(resolve, 300))
  check('unchanged reload says unchanged', /unchanged from the previous version/.test($('annotation-status').textContent),
    $('annotation-status').textContent)

  // A failed reload must leave the working annotation in place.
  window.fetch = () => Promise.resolve({ ok: false, status: 503 })
  $('reload-annotation').click()
  await new Promise((resolve) => window.setTimeout(resolve, 200))
  check('failed reload explained', /Could not reload that URL \(HTTP 503\)/.test($('annotation-status').textContent),
    $('annotation-status').textContent)
  check('reload button still usable', $('reload-annotation').disabled === false)
  check('previous results survive a failed reload',
    [...document.querySelectorAll('#table-body tr')].length === after,
    [...document.querySelectorAll('#table-body tr')].length)
}

console.log('\nAllmaps mask trimming')
// The sample annotation's mask is a quadrilateral inset from the edges:
// points="117,120 113,1776 4587,1772 4568,101" on a 4708x1860 image.
paste('annotation-text', read('samples/annotation.example.json'))
check('mask parsed and described', /4-point mask covering \d+% of the image/.test($('mask-hint').textContent), $('mask-hint').textContent)
check('mask checkbox enabled', $('use-mask').disabled === false)

// Two detections inside the masked area, two out in the margins.
const maskBox = (x, y) => [[[x - 30, -(y - 20)], [x + 30, -(y - 20)], [x + 30, -(y + 20)], [x - 30, -(y + 20)], [x - 30, -(y - 20)]]]
paste('pixel-text', JSON.stringify({
  type: 'FeatureCollection',
  features: [
    { text: 'inside-center', at: [2300, 900] },
    { text: 'inside-edge', at: [300, 1600] },
    { text: 'margin-top', at: [2300, 40] },
    { text: 'margin-left', at: [40, 900] }
  ].map(({ text, at }) => ({
    type: 'Feature', properties: { text, score: 0.9 }, geometry: { type: 'Polygon', coordinates: maskBox(at[0], at[1]) }
  }))
}))
$('score-number').value = '0'
fire($('score-number'), 'input')

const runAndList = async () => {
  $('run').click()
  await new Promise((resolve) => window.setTimeout(resolve, 200))
  return [...document.querySelectorAll('#table-body tr')].map((tr) => tr.children[0].textContent).sort().join(',')
}

check('mask on: margin text discarded', await runAndList() === 'inside-center,inside-edge', await runAndList())
check('summary counts mask drops', /2 outside the Allmaps mask/.test($('summary').textContent), $('summary').textContent)

$('use-mask').checked = false
check('mask off: everything kept', await runAndList() === 'inside-center,inside-edge,margin-left,margin-top', await runAndList())
check('summary omits the mask when unused', !/Allmaps mask/.test($('summary').textContent), $('summary').textContent)
$('use-mask').checked = true

// A mask tracing the whole sheet must say so rather than imply it trims.
const fullSheet = JSON.parse(read('samples/annotation.example.json'))
fullSheet.target.selector.value = '<svg width="4708" height="1860"><polygon points="0,0 0,1860 4708,1860 4708,0" /></svg>'
paste('annotation-text', JSON.stringify(fullSheet))
check('full-sheet mask flagged as trimming nothing', /traces the whole sheet/.test($('mask-hint').textContent), $('mask-hint').textContent)
check('full-sheet mask keeps every detection', await runAndList() === 'inside-center,inside-edge,margin-left,margin-top', await runAndList())

// No selector at all.
const noMask = JSON.parse(read('samples/annotation.example.json'))
delete noMask.target.selector
paste('annotation-text', JSON.stringify(noMask))
check('missing mask disables the control', $('use-mask').disabled === true)
check('missing mask explained', /no mask/.test($('mask-hint').textContent), $('mask-hint').textContent)
check('mask card dimmed when absent', $('mask-option').className.includes('inactive'))

console.log('\nMap preview wiring')
const calls = { warped: [], opacity: [], added: [], removed: [], fitted: 0, events: [] }
function stubViewer ({ throwOnConstruct = false } = {}) {
  const mapObj = {
    setView: () => mapObj,
    invalidateSize: () => {},
    fitBounds: () => { calls.fitted++ },
    removeLayer: (l) => { calls.removed.push(l.__name) },
    on: (name) => { calls.events.push(name) },
    once: (name) => { calls.events.push(name) },
    addLayer: (l) => { calls.added.push(l.__name) }
  }
  const layer = (name) => ({ __name: name, addTo (m) { m.addLayer(this); return this } })
  window.AllmapsLeaflet = {
    L: {
      map: () => mapObj,
      tileLayer: () => layer('tiles'),
      circleMarker: () => ({ bindTooltip: () => ({}) }),
      layerGroup: () => layer('markers'),
      latLngBounds: () => ({ pad: () => 'bounds' })
    },
    WarpedMapLayer: class {
      constructor (annotation, options) {
        if (throwOnConstruct) throw new Error('WebGL2 unavailable')
        calls.warped.push({ annotation, options })
        this.__name = 'warped'
      }
      addTo (m) { m.addLayer(this); return this }
      setOpacity (o) { calls.opacity.push(o) }
    }
  }
  return mapObj
}

// Get back to a good state: real data, converted, ready to preview.
paste('pixel-text', read('samples/mapreader-detections.example.geojson'))
paste('annotation-text', read('samples/annotation.example.json'))
$('run').click()
await new Promise((resolve) => window.setTimeout(resolve, 300))

stubViewer()
$('toggle-map').click()
await new Promise((resolve) => window.setTimeout(resolve, 50))

check('controls revealed with the map', $('map-controls').hidden === false)
check('historical map layer constructed', calls.warped.length === 1, calls.warped.length)
check('annotation passed through verbatim', calls.warped[0]?.annotation?.type === 'Annotation',
  JSON.stringify(calls.warped[0]?.annotation?.type))
check('starts fully opaque', calls.warped[0]?.options?.opacity === 1, calls.warped[0]?.options?.opacity)
check('warped map added beneath the detections', calls.added.join(',') === 'tiles,warped,markers', calls.added.join(','))
check('waits for the first tile', calls.events.includes('firstmaptileloaded'), calls.events.join(','))
check('view fitted to the detections', calls.fitted === 1, calls.fitted)

$('map-opacity').value = '40'
fire($('map-opacity'), 'input')
check('opacity forwarded to the layer', calls.opacity.join(',') === '0.4', calls.opacity.join(','))
check('opacity readout updated', $('map-opacity-value').textContent === '40%', $('map-opacity-value').textContent)

$('map-opacity').value = '0'
fire($('map-opacity'), 'input')
check('fully transparent is reachable', calls.opacity.at(-1) === 0, calls.opacity.at(-1))
check('zero shown as 0%', $('map-opacity-value').textContent === '0%', $('map-opacity-value').textContent)

$('show-detections').checked = false
fire($('show-detections'), 'change')
check('detections can be hidden', calls.removed.includes('markers'), calls.removed.join(','))
$('show-detections').checked = true
fire($('show-detections'), 'change')
check('detections can be shown again', calls.added.filter((n) => n === 'markers').length === 2, calls.added.join(','))

$('toggle-map').click()
check('hiding the map hides its controls', $('map-controls').hidden === true && $('map').hidden === true)
check('button text toggles back', $('toggle-map').textContent === 'Show map preview', $('toggle-map').textContent)

/*
 * A viewer that cannot build the warped layer must still show the points. The
 * map is built once per page, so this needs a fresh document rather than
 * another click on the one above.
 */
console.log('\nMap preview failure handling')
{
  const page = new JSDOM(read('index.html'), {
    runScripts: 'dangerously', url: 'https://example.org/', virtualConsole, pretendToBeVisual: true
  })
  const w = page.window
  for (const src of ['vendor/allmaps-transform.js', 'vendor/image-size.js', 'app.js']) {
    const script = w.document.createElement('script')
    script.textContent = read(src)
    w.document.body.appendChild(script)
  }
  await new Promise((resolve) => w.setTimeout(resolve, 50))
  const id = (x) => w.document.getElementById(x)
  const set = (x, v) => { id(x).value = v; id(x).dispatchEvent(new w.Event('change', { bubbles: true })) }

  const added = []
  const mapObj = {
    setView: () => mapObj, invalidateSize: () => {}, fitBounds: () => {},
    removeLayer: () => {}, addLayer: (l) => added.push(l.__name), on: () => {}, once: () => {}
  }
  const layer = (name) => ({ __name: name, addTo (m) { m.addLayer(this); return this } })
  w.AllmapsLeaflet = {
    L: {
      map: () => mapObj,
      tileLayer: () => layer('tiles'),
      circleMarker: () => ({ bindTooltip: () => ({}) }),
      layerGroup: () => layer('markers'),
      latLngBounds: () => ({ pad: () => 'bounds' })
    },
    WarpedMapLayer: class { constructor () { throw new Error('WebGL2 unavailable') } }
  }

  set('pixel-text', read('samples/mapreader-detections.example.geojson'))
  set('annotation-text', read('samples/annotation.example.json'))
  id('run').click()
  await new Promise((resolve) => w.setTimeout(resolve, 300))
  id('toggle-map').click()
  await new Promise((resolve) => w.setTimeout(resolve, 50))

  const status = id('map-status').textContent
  check('failure explained to the user', /Could not display the historical map/.test(status), status)
  check('WebGL2 named as a requirement', /WebGL2/.test(status))
  check('opacity slider disabled on failure', id('map-opacity').disabled === true)
  check('detections still drawn', added.includes('markers'), added.join(','))
  check('table untouched by the viewer failure', w.document.querySelectorAll('#table-body tr').length > 0)
}

function state_rows () {
  return [...document.querySelectorAll('#table-body tr')].length
}

console.log('\n' + (failures ? failures + ' check(s) failed' : 'all checks passed'))
process.exit(failures ? 1 : 0)
