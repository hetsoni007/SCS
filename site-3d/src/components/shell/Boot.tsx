import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CASES } from '../../content/work'
import { SERVICES } from '../../content/services'
import { AI_PAGE } from '../../content/ai'
import { DEVOPS_PAGE } from '../../content/devops'
import { gsap } from '../../lib/motion'
import { ROUTES } from '../../routes'
import { useStore } from '../../state/store'

const KEY = 'scs3d-booted'

// Every count in the log is read from the real content modules.
const LOG: [string, string, string?][] = [
  ['▸ cold build', 'soniconsultancyservices.com', 'hot'],
  ['resolve routes', `${ROUTES.length}`],
  ['compile services', `${SERVICES.length} modules`],
  ['link case studies', `${CASES.length} · names withheld (NDA)`],
  ['bundle ai capabilities', `${AI_PAGE.ideas.items.length}`],
  ['provision reference architecture', `${DEVOPS_PAGE.arch.nodes.length} layers`],
  ['✓ type', 'fraunces / ibm plex', 'ok'],
  ['✓ build ready', 'shipping', 'ok'],
]

/**
 * The cold-build loader (DESIGN.md §8). First visit per session only, at most ~1.5s,
 * skippable, never shown under reduced motion. It streams a build log whose timings
 * are measured, then a scan line wipes it away to reveal the page.
 */
export function Boot() {
  const reduced = useStore((s) => s.reduced)
  const setBooted = useStore((s) => s.setBooted)
  const [show, setShow] = useState(() => {
    try {
      return !reduced && !sessionStorage.getItem(KEY)
    } catch {
      return !reduced
    }
  })
  const root = useRef<HTMLDivElement>(null)
  const log = useRef<HTMLDivElement>(null)
  const pct = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLElement>(null)
  const scan = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)

  useLayoutEffect(() => {
    if (!show) {
      setBooted()
      return
    }
    const t0 = performance.now()
    const rows = Array.from(log.current?.children ?? []) as HTMLElement[]
    let shown = 0
    const counter = { v: 0 }
    const stamp = () => `[${((performance.now() - t0) / 1000).toFixed(2).padStart(5, '0')}]`
    const t = gsap.timeline({
      onComplete: () => {
        try {
          sessionStorage.setItem(KEY, '1')
        } catch {
          /* ignore */
        }
        setShow(false)
      },
    })
    t.to(counter, {
      v: 100,
      duration: 0.8,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (pct.current) pct.current.textContent = String(Math.round(counter.v)).padStart(3, '0')
        if (bar.current) bar.current.style.transform = `scaleX(${counter.v / 100})`
        const want = Math.min(LOG.length, Math.floor((counter.v / 100) * LOG.length + 0.6))
        while (shown < want) {
          const row = rows[shown]
          if (row) {
            row.firstChild!.textContent = stamp()
            row.style.visibility = 'visible'
          }
          shown++
        }
      },
    })
    // Hand over just before the wipe so the page's own reveals overlap it.
    t.add(() => setBooted(), '-=0.05')
    t.set(scan.current, { opacity: 1 })
    t.to(root.current, { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.7, ease: 'power3.inOut' })
    t.to(scan.current, { y: () => window.innerHeight, duration: 0.7, ease: 'power3.inOut' }, '<')
    tl.current = t
    return () => {
      t.kill()
    }
  }, [show, setBooted])

  useEffect(() => {
    if (!show) return
    const skip = (e: KeyboardEvent | MouseEvent) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return
      const t = tl.current
      if (t && t.progress() < 0.6) t.progress(0.6)
    }
    window.addEventListener('keydown', skip)
    root.current?.addEventListener('click', skip)
    return () => window.removeEventListener('keydown', skip)
  }, [show])

  if (!show) return null
  return (
    <div className="boot" ref={root} role="status" aria-live="polite" aria-label="Loading">
      <div className="boot__log" ref={log} aria-hidden="true">
        {LOG.map(([a, b, cls]) => (
          <span key={a} className={cls} style={{ visibility: 'hidden' }}>
            <span>[00.00]</span> {a} {'.'.repeat(Math.max(2, 34 - a.length))} {b}
            {'\n'}
          </span>
        ))}
      </div>
      <div className="boot__foot">
        <span className="boot__pct" ref={pct} aria-hidden="true">
          000
        </span>
        <button type="button" className="boot__skip">
          Esc · skip
        </button>
      </div>
      <div className="boot__bar" aria-hidden="true">
        <i ref={bar} />
      </div>
      <div className="boot__scan" ref={scan} aria-hidden="true" />
    </div>
  )
}
