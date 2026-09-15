/*
 * Visual check in real Chrome. jsdom has no WebGL, so the smoke test can only
 * verify the wiring around the warped map layer — this drives an actual browser
 * to confirm the historical map renders and the opacity slider blends it.
 *
 *   npm run serve                    # in another terminal
 *   npm run check:browser            # writes PNGs to /tmp
 *
 * Needs Google Chrome installed and a network connection (basemap and IIIF
 * tiles). Launches its own headless Chrome on port 9222.
 */
import { writeFileSync, mkdtempSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const APP = process.env.APP_URL || 'http://127.0.0.1:8000/'
const PIXELS = process.env.PIXELS_URL || 'samples/mapreader-detections.example.geojson'
const ANNOTATION = process.env.ANNOTATION_URL || 'samples/annotation.example.json'
const OUT = process.env.OUT_DIR || tmpdir()
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 9222

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function debuggerReady () {
  for (let i = 0; i < 25; i++) {
    try { return await fetch(`http://127.0.0.1:${PORT}/json/version`).then((r) => r.json()) } catch (e) { await wait(400) }
  }
  throw new Error('Chrome did not expose its debugging port')
}

let chrome
try {
  await fetch(`http://127.0.0.1:${PORT}/json/version`)
  console.log('reusing the Chrome already on port ' + PORT)
} catch (e) {
  chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`,
    '--user-data-dir=' + mkdtempSync(join(tmpdir(), 'chrome-check-')),
    '--window-size=1500,1150', '--enable-unsafe-swiftshader',
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', 'about:blank'
  ], { stdio: 'ignore', detached: false })
}

const version = await debuggerReady()
console.log(version.Browser)

const target = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' }).then((r) => r.json())
const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve) => { ws.onopen = resolve })

let id = 0
const pending = new Map()
ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id) }
}
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const n = ++id
  pending.set(n, (m) => m.error ? reject(new Error(method + ': ' + m.error.message)) : resolve(m.result))
  ws.send(JSON.stringify({ id: n, method, params }))
})
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || 'eval failed').split('\n')[0])
  return r.result.value
}
const screenshot = async (name) => {
  const { data } = await send('Page.captureScreenshot', { format: 'png' })
  const path = join(OUT, name)
  writeFileSync(path, Buffer.from(data, 'base64'))
  console.log('  wrote ' + path)
}
const setOpacity = (percent) => evaluate(
  `(() => { const el = document.getElementById('map-opacity'); el.value = '${percent}';` +
  ` el.dispatchEvent(new Event('input', { bubbles: true })) })()`)

let failures = 0
const check = (label, ok, detail) => {
  if (ok) console.log('  ok   ' + label)
  else { failures++; console.log('  FAIL ' + label + (detail === undefined ? '' : ' → ' + detail)) }
}

await send('Page.enable')
await send('Runtime.enable')
await send('Page.navigate', { url: APP })
await wait(1500)

check('WebGL2 available', await evaluate("!!document.createElement('canvas').getContext('webgl2')"))

await evaluate(`(async () => {
  const load = async (id, url) => {
    const el = document.getElementById(id)
    el.value = await fetch(url).then((r) => r.text())
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }
  await load('pixel-text', '${PIXELS}')
  await load('annotation-text', '${ANNOTATION}')
})()`)
check('inputs accepted', /features loaded/.test(await evaluate("document.getElementById('pixel-status').textContent")))

await evaluate("document.getElementById('run').click()")
await wait(2000)
check('conversion produced rows', await evaluate("document.querySelectorAll('#table-body tr').length") > 0)

await evaluate("document.getElementById('toggle-map').click()")
await wait(12000)
await evaluate("document.getElementById('results').scrollIntoView()")
await wait(500)

const status = await evaluate(
  "document.getElementById('map-status').hidden ? '' : document.getElementById('map-status').textContent")
check('no viewer error reported', status === '', status)
check('map canvases present', await evaluate("document.querySelectorAll('#map canvas').length") >= 1,
  await evaluate("document.querySelectorAll('#map canvas').length"))
check('opacity slider live', await evaluate("!document.getElementById('map-opacity').disabled"))

/*
 * The warped layer can build happily and still draw nothing — a dead IIIF
 * service looks identical to a working one from the DOM's point of view. Its
 * WebGL canvas cannot be read back (no preserveDrawingBuffer), but
 * Page.captureScreenshot composites it, so the screenshot is fed back into the
 * page and the map's region measured. A rendering overlay changes that region
 * when the opacity changes; a blank one does not.
 */
async function mapRegionMean () {
  const { data } = await send('Page.captureScreenshot', { format: 'png' })
  return evaluate(`(async () => {
    const box = document.getElementById('map').getBoundingClientRect()
    const img = new Image()
    img.src = 'data:image/png;base64,${data}'
    await img.decode()
    const scale = img.width / window.innerWidth
    const probe = document.createElement('canvas')
    probe.width = 160; probe.height = 120
    const ctx = probe.getContext('2d')
    ctx.drawImage(img, box.x * scale, box.y * scale, box.width * scale, box.height * scale,
      0, 0, probe.width, probe.height)
    const d = ctx.getImageData(0, 0, probe.width, probe.height).data
    let sum = 0
    for (let i = 0; i < d.length; i += 4) sum += d[i] + d[i + 1] + d[i + 2]
    return sum / (d.length / 4) / 3
  })()`)
}

const opaqueMean = await mapRegionMean()
await screenshot('toponym-overlay-100.png')

await setOpacity(45)
await wait(2500)
check('45% reported', await evaluate("document.getElementById('map-opacity-value').textContent") === '45%')
await screenshot('toponym-overlay-45.png')

await setOpacity(0)
await wait(2500)
const clearMean = await mapRegionMean()
await screenshot('toponym-overlay-0.png')

const shift = Math.abs(opaqueMean - clearMean)
check('historical map visibly rendered', shift > 2,
  `map region brightness ${opaqueMean.toFixed(1)} at 100% vs ${clearMean.toFixed(1)} at 0% ` +
  `(shift ${shift.toFixed(1)}) — no shift means the overlay drew nothing, usually a dead IIIF service`)
console.log(`       brightness ${opaqueMean.toFixed(1)} → ${clearMean.toFixed(1)} as opacity went 100% → 0%`)

ws.close()
if (chrome) chrome.kill()
console.log('\n' + (failures ? failures + ' check(s) failed' : 'browser checks passed') +
  ' — open the PNGs to confirm the map itself looks right')
process.exit(failures ? 1 : 0)
