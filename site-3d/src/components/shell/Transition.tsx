import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/motion'
import { registerDomTransition } from '../../lib/transition'
import { labelFor } from '../../routes'

/**
 * DOM half of the route "rebuild": the page lifts away while a scan line crosses
 * the viewport and the build log names the next route. The WebGL half runs in
 * the stage (see three/Stage.tsx), so the canvas is never covered.
 */
export function TransitionLayer() {
  const line = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const main = () => document.getElementById('main')
    registerDomTransition({
      out: (to) =>
        new Promise<void>((resolve) => {
          if (label.current) label.current.innerHTML = `▸ compiling /${labelFor(to)}`
          gsap
            .timeline({ onComplete: resolve })
            .to(main(), { autoAlpha: 0, y: -18, duration: 0.42, ease: 'power2.in' }, 0)
            .fromTo(line.current, { top: '0%', opacity: 1 }, { top: '100%', duration: 0.5, ease: 'power3.inOut' }, 0)
            .to(label.current, { opacity: 1, duration: 0.2 }, 0.08)
        }),
      in: (from) =>
        new Promise<void>((resolve) => {
          const m = main()
          if (label.current && from !== null) label.current.innerHTML += `\n<span class="ok">✓ mounted</span>`
          gsap
            .timeline({ onComplete: resolve })
            .fromTo(m, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.75, ease: 'expo.out', clearProps: 'transform' }, 0.05)
            .to(line.current, { opacity: 0, duration: 0.3 }, 0)
            .to(label.current, { opacity: 0, duration: 0.35 }, 0.25)
        }),
    })
  }, [])

  return (
    <div className="xfer" aria-hidden="true">
      <div className="xfer__line" ref={line} />
      <div className="xfer__label" ref={label} />
    </div>
  )
}
