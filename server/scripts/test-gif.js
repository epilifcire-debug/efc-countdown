// Gera GIFs de teste em ./test-output para conferência visual.
import fs from 'node:fs'
import { generateGif, renderPng } from '../src/gif.js'

fs.mkdirSync('test-output', { recursive: true })
const target = new Date(Date.now() + (2 * 86400 + 14 * 3600 + 37 * 60 + 52) * 1000).toISOString()
for (const v of [0, 1, 10, 25, 50, 75, 99, 100]) fs.writeFileSync(`test-output/pct-${v}.png`, renderPng('percentage', { value: v, width: 400, height: 400, title: '' }, { t: 1 }))
const cases = {
  countdown: ['countdown', { targetAt: target }],
  percentage: ['percentage', { value: 73 }],
  progress: ['progress', {}],
  alerta_sirene: ['alert', { icon: 'siren', blinkStyle: 'alternate', blinkTargets: ['icon', 'title', 'border'], colorA: '#E11D48', colorB: '#D4AF37', borderWidth: 3 }],
}
for (const [name, [type, s]] of Object.entries(cases)) {
  const t = Date.now()
  const r = await generateGif(type, s)
  fs.writeFileSync(`test-output/${name}.gif`, r.buffer)
  console.log(`${name}: ${r.frames} frames, ${(r.buffer.length / 1024).toFixed(0)} KB, ${Date.now() - t} ms`)
}
