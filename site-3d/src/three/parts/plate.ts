// Abstract plate for products with no screens (B2B Wholesale, Healthcare
// Staffing, Web3 Creator). It is deliberately NOT a fake UI: a drafting grid,
// the product's tint, and its verbatim label from the live site.
import * as THREE from 'three'
import type { CaseStudy } from '../../content/work'

export async function plateTexture(c: CaseStudy, theme: 'dark' | 'light') {
  const W = 620
  const H = 1000
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const g = cv.getContext('2d')!
  try {
    await Promise.all([document.fonts.load('330 80px Fraunces'), document.fonts.load('500 20px "IBM Plex Mono"')])
  } catch {
    /* fallback fonts */
  }
  const dark = theme === 'dark'
  g.fillStyle = dark ? '#12171c' : '#f7f4ee'
  g.fillRect(0, 0, W, H)
  const grd = g.createRadialGradient(W * 0.8, H * 0.12, 10, W * 0.8, H * 0.12, W * 1.1)
  grd.addColorStop(0, c.tint + (dark ? '88' : '55'))
  grd.addColorStop(1, c.tint + '00')
  g.fillStyle = grd
  g.fillRect(0, 0, W, H)
  g.strokeStyle = dark ? 'rgba(222,232,240,0.08)' : 'rgba(18,22,26,0.1)'
  g.lineWidth = 1
  for (let x = 0; x <= W; x += 31) {
    g.beginPath()
    g.moveTo(x + 0.5, 0)
    g.lineTo(x + 0.5, H)
    g.stroke()
  }
  for (let y = 0; y <= H; y += 31) {
    g.beginPath()
    g.moveTo(0, y + 0.5)
    g.lineTo(W, y + 0.5)
    g.stroke()
  }
  // registration marks
  g.strokeStyle = dark ? 'rgba(236,231,220,0.45)' : 'rgba(18,22,26,0.5)'
  ;[
    [40, 40],
    [W - 40, 40],
    [40, H - 40],
    [W - 40, H - 40],
  ].forEach(([x, y]) => {
    g.beginPath()
    g.moveTo(x - 12, y)
    g.lineTo(x + 12, y)
    g.moveTo(x, y - 12)
    g.lineTo(x, y + 12)
    g.stroke()
  })
  const fg = dark ? '#ece7dc' : '#12161a'
  const t = c.tile ?? { title: c.label, sub: c.summary }
  g.fillStyle = fg
  g.font = '330 76px Fraunces, Georgia, serif'
  const words = t.title.split(' ')
  let y = H - 300
  words.forEach((w) => {
    g.fillText(w, 56, y)
    y += 80
  })
  g.fillStyle = dark ? '#a8b0b5' : '#424a50'
  g.font = '400 21px "IBM Plex Mono", monospace'
  wrap(g, t.sub.toUpperCase(), W - 112).forEach((l, i) => g.fillText(l, 56, H - 450 + i * 30))
  g.fillStyle = c.kind === 'concept' ? fg : dark ? '#86bcd9' : '#2a6a8f'
  g.font = '500 19px "IBM Plex Mono", monospace'
  g.fillText((c.status ?? 'Name withheld (NDA)').toUpperCase(), 56, 90)
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function wrap(g: CanvasRenderingContext2D, text: string, max: number) {
  const out: string[] = []
  let line = ''
  for (const w of text.split(' ')) {
    const test = line ? `${line} ${w}` : w
    if (g.measureText(test).width > max && line) {
      out.push(line)
      line = w
    } else line = test
  }
  if (line) out.push(line)
  return out
}
