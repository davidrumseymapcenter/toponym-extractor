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
  url: 'https://example.org/mapreader-georeferencer/',
  virtualConsole,
  pretendToBeVisual: true,
  resources: undefined
})
const { window } = dom
const document = window.document

// jsdom serves no subresources, so inject the two scripts by hand.
for (const src of ['vendor/allmaps-transform.js', 'app.js']) {
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

console.log('\nText filter')
$('text-filter').value = 'palais'
$('run').click()
await new Promise((resolve) => window.setTimeout(resolve, 200))
const filtered = [...document.querySelectorAll('#table-body tr')]
check('only matching text remains', filtered.length === 1 && filtered[0].children[0].textContent === 'Palais',
  filtered.map((tr) => tr.children[0].textContent).join(','))
$('text-filter').value = ''

console.log('\nY-axis override')
$('y-axis').value = 'down'
$('run').click()
await new Promise((resolve) => window.setTimeout(resolve, 200))
check('downward Y reported', /Y treated as downward/.test($('summary').textContent))
const mirroredLat = Number(document.querySelectorAll('#table-body tr')[0].children[2].textContent)
check('wrong Y axis visibly moves the result', Math.abs(mirroredLat - lat) > 0.001, mirroredLat)

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

function state_rows () {
  return [...document.querySelectorAll('#table-body tr')].length
}

console.log('\n' + (failures ? failures + ' check(s) failed' : 'all checks passed'))
process.exit(failures ? 1 : 0)
