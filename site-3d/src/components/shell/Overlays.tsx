// Cursor, film grain, build HUD, tilt permission chip.
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { live } from '../../lib/live'
import { gsap } from '../../lib/motion'
import { requestTilt, tiltNeedsPermission } from '../../lib/tilt'
import { labelFor } from '../../routes'
import { useStore } from '../../state/store'

/* ── Cursor: crosshair + lagging ring that labels itself ── */
export function Cursor() {
  const root = useRef<HTMLDivElement>(null)
  const x = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')
  const reduced = useStore((s) => s.reduced)
  const [on] = useState(() => typeof window !== 'undefined' && matchMedia('(hover: hover) and (pointer: fine)').matches)

  useEffect(() => {
    if (!on) return
    document.documentElement.classList.add('has-cursor')
    const el = root.current!
    const rx = gsap.quickTo(ring.current, 'x', { duration: reduced ? 0.01 : 0.38, ease: 'power3.out' })
    const ry = gsap.quickTo(ring.current, 'y', { duration: reduced ? 0.01 : 0.38, ease: 'power3.out' })
    const move = (e: PointerEvent) => {
      gsap.set(x.current, { x: e.clientX, y: e.clientY })
      rx(e.clientX)
      ry(e.clientY)
      const t = e.target as Element | null
      const text = t?.closest('input, textarea, select, [contenteditable]')
      // DOM elements label the cursor with data-cursor; 3D objects set it on <html>.
      const lab = t?.closest<HTMLElement>('[data-cursor]')?.dataset.cursor || document.documentElement.dataset.cursor || ''
      const hot = t?.closest('a, button, label, summary, [role="button"]')
      el.classList.toggle('is-hidden', !!text)
      el.classList.toggle('is-label', !!lab)
      el.classList.toggle('is-hover', !!hot && !lab)
      setLabel(lab)
    }
    const down = () => el.classList.add('is-down')
    const up = () => el.classList.remove('is-down')
    const leave = () => el.classList.add('is-hidden')
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    document.addEventListener('pointerleave', leave)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      document.removeEventListener('pointerleave', leave)
    }
  }, [on, reduced])

  if (!on) return null
  return (
    <div className="cursor is-hidden" ref={root} aria-hidden="true">
      <div className="cursor__ring" ref={ring}>
        <span>
          <b>{label.toUpperCase()}</b>
        </span>
      </div>
      <div className="cursor__x" ref={x} />
    </div>
  )
}

/* ── Film grain: a noise tile generated once at runtime ── */
export function Grain() {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 160
    const ctx = c.getContext('2d')
    if (!ctx) return
    const img = ctx.createImageData(160, 160)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
    setSrc(c.toDataURL('image/png'))
  }, [])
  if (!src) return null
  return <div className="grain" aria-hidden="true" style={{ backgroundImage: `url(${src})` }} />
}

/* ── Build HUD: ▸ /route · §02 section · 38% ─────────── */
export function Hud() {
  const { pathname } = useLocation()
  const section = useStore((s) => s.section)
  const fill = useRef<HTMLSpanElement>(null)
  const pct = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let last = -1
    const tick = () => {
      const p = Math.round(live.scroll.p * 100)
      if (p === last) return
      last = p
      if (fill.current) fill.current.style.transform = `scaleX(${live.scroll.p})`
      if (pct.current) pct.current.textContent = `${p}%`
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])
  return (
    <div className="hud" aria-hidden="true">
      <span className="t-sig">▸</span>
      <span className="hud__route">{labelFor(pathname)}</span>
      <span>·</span>
      <span>
        §{String(section.index + 1).padStart(2, '0')} {section.label}
      </span>
      <span className="hud__bar">
        <span className="hud__fill" ref={fill} />
      </span>
      <span className="hud__pct" ref={pct}>
        0%
      </span>
    </div>
  )
}

/* ── iOS motion permission (tilt is the mobile interaction) ── */
export function TiltChip() {
  const tiltOn = useStore((s) => s.tiltOn)
  const tier = useStore((s) => s.tier)
  const reduced = useStore((s) => s.reduced)
  const [ask] = useState(() => typeof window !== 'undefined' && matchMedia('(pointer: coarse)').matches && tiltNeedsPermission())
  const [dismissed, setDismissed] = useState(false)
  if (!ask || tiltOn || dismissed || tier === 'off' || reduced) return null
  return (
    <button
      type="button"
      className="tilt-chip"
      onClick={async () => {
        const ok = await requestTilt()
        if (!ok) setDismissed(true)
      }}
    >
      <span className="t-sig" aria-hidden="true">
        ◐
      </span>
      Tilt to explore
    </button>
  )
}
