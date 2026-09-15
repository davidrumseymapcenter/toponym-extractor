/*
 * Asserts the committed vendor bundles actually execute and export what the app
 * expects. Worth its own step because a bundle can build cleanly and still
 * throw on load: @allmaps/annotation's schemas break under zod >= 4.5, which
 * silently produced a 1 MB file that exported nothing. Run by `npm run build`
 * and by `npm test`.
 */
import { readFileSync } from 'node:fs'
import { JSDOM, VirtualConsole } from 'jsdom'

const BUNDLES = [
  { file: 'vendor/allmaps-transform.js', global: 'AllmapsTransform', expect: ['GcpTransformer'] },
  { file: 'vendor/allmaps-leaflet.js', global: 'AllmapsLeaflet', expect: ['WarpedMapLayer', 'L'] }
]

let failed = false

for (const bundle of BUNDLES) {
  const thrown = []
  const virtualConsole = new VirtualConsole()
  virtualConsole.on('jsdomError', (err) => thrown.push(err.message.split('\n')[0]))

  const dom = new JSDOM('<!doctype html><body></body>', {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole
  })

  const script = dom.window.document.createElement('script')
  script.textContent = readFileSync(new URL('../' + bundle.file, import.meta.url), 'utf8')
  dom.window.document.body.appendChild(script)

  const exported = dom.window[bundle.global]
  const missing = exported ? bundle.expect.filter((key) => !exported[key]) : bundle.expect

  if (!exported || missing.length) {
    failed = true
    console.log(`  FAIL ${bundle.file}`)
    console.log(`       window.${bundle.global} is ${exported ? 'missing ' + missing.join(', ') : 'undefined'}`)
    thrown.forEach((message) => console.log('       threw: ' + message))
    console.log('       rebuild with `npm run build`; if it throws under zod, check overrides.zod in package.json')
  } else {
    console.log(`  ok   ${bundle.file} exports ${bundle.expect.join(', ')}`)
  }
}

if (failed) {
  console.log('\nvendor bundles are broken — do not commit them')
  process.exit(1)
}
