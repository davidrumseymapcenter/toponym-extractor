import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--remote-debugging-port=9222','--user-data-dir=' + mkdtempSync(join(tmpdir(),'rl-')),'--window-size=1400,1000','--enable-unsafe-swiftshader','--no-first-run','about:blank'], { stdio: 'ignore' })
const wait = ms => new Promise(r => setTimeout(r, ms))
let v; for (let i=0;i<25;i++){ try { v = await fetch('http://127.0.0.1:9222/json/version').then(r=>r.json()); break } catch(e){ await wait(400) } }
const t = await fetch('http://127.0.0.1:9222/json/new?about:blank',{method:'PUT'}).then(r=>r.json())
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => { ws.onopen = r })
let id=0; const p=new Map(); ws.onmessage=e=>{const m=JSON.parse(e.data); if(m.id&&p.has(m.id)){p.get(m.id)(m);p.delete(m.id)}}
const send=(method,params={})=>new Promise((res,rej)=>{const n=++id;p.set(n,m=>m.error?rej(new Error(m.error.message)):res(m.result));ws.send(JSON.stringify({id:n,method,params}))})
const ev=async x=>{const r=await send('Runtime.evaluate',{expression:x,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error((r.exceptionDetails.exception?.description||'').split('\n')[0]);return r.result.value}
await send('Page.enable'); await send('Runtime.enable')
await send('Page.navigate',{url:'http://127.0.0.1:8000/'}); await wait(1500)

await ev(`(async () => { const el=document.getElementById('pixel-text');
  el.value = await fetch('samples/mapreader-detections.example.geojson').then(r=>r.text());
  el.dispatchEvent(new Event('change',{bubbles:true})) })()`)
await ev(`document.getElementById('annotation-url').value = 'https://annotations.allmaps.org/images/640bda7266961d41'`)
await ev(`document.getElementById('fetch-annotation').click()`)
await wait(4000)
console.log('after fetch:  ', await ev(`document.getElementById('annotation-status').textContent`))
console.log('reload shown: ', await ev(`!document.getElementById('reload-annotation').hidden`))
await ev(`document.getElementById('run').click()`); await wait(2500)
console.log('rows:         ', await ev(`document.querySelectorAll('#table-body tr').length`))
await ev(`document.getElementById('reload-annotation').click()`); await wait(5000)
console.log('after reload: ', await ev(`document.getElementById('annotation-status').textContent`))
console.log('pixels kept:  ', await ev(`document.getElementById('pixel-status').textContent.slice(0, 48)`))
console.log('summary:      ', await ev(`document.getElementById('summary').textContent.replace(/\\s+/g,' ').slice(0, 110)`))
ws.close()
