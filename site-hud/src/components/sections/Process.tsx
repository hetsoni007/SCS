'use client';

import { useEffect, useRef, useState } from 'react';
import { PHASES, STEPS } from '@/data/process';
import { loadEngine } from '@/lib/engine';
import { useHUD } from '../HUDProvider';
import { HUDFrame } from '../hud/HUDFrame';
import { SectionHeader } from '../hud/SectionHeader';
import { StepSchematic } from './Schematics';

/**
 * 02 — Process. On desktop the section pins and the five steps scroll
 * horizontally (GSAP ScrollTrigger, scrubbed), with each schematic drawing
 * itself as its panel slides in, a phase rail filling along the bottom, and the
 * camera strafing sideways through the scene. Phones, tablets and reduced motion
 * get a plain vertical timeline.
 */
export function Process() {
  const { reduced } = useHUD();
  const pin = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const [step, setStep] = useState(0);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    // same condition as the horizontal layout in globals.css
    if (reduced || !window.matchMedia('(min-width: 1024px) and (min-height: 600px)').matches) return;
    let revert = () => {};
    let cancelled = false;
    loadEngine().then(({ gsap }) => {
      if (cancelled) return;
      const mm = gsap.matchMedia();
      revert = () => mm.revert();
      mm.add('(min-width: 1024px) and (min-height: 600px)', () => {
        if (reduced || !pin.current || !track.current) return;
        setPinned(true);
        const strip = track.current;
        const distance = () => Math.max(0, strip.scrollWidth - window.innerWidth);
        const panels = Array.from(strip.querySelectorAll<HTMLElement>('[data-step]'));

        const tween = gsap.to(strip, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: pin.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (fill.current) fill.current.style.transform = `scaleX(${self.progress})`;
              setStep(Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length * 0.999)));
            },
          },
        });

        panels.forEach((panel) => {
          const strokes = panel.querySelectorAll('.draw');
          gsap.fromTo(
            strokes,
            { strokeDashoffset: 1 },
            {
              strokeDashoffset: 0,
              ease: 'none',
              stagger: 0.04,
              scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left 90%', end: 'left 35%', scrub: true },
            },
          );
        });

        return () => setPinned(false);
      });
    });
    return () => {
      cancelled = true;
      revert();
    };
  }, [reduced]);

  return (
    // the id lives on the in-flow wrapper: the <section> itself is position:fixed while pinned
    <div id="process" data-hud-section className="process-wrap">
      <section className={`process${pinned ? ' process--pinned' : ''}`} aria-labelledby="process-title" ref={pin}>
        <div className="process__track" ref={track}>
          <div className="process__intro">
            <SectionHeader
              code="02"
              eyebrow="Process"
              id="process-title"
              title={
                <>
                  Five steps.
                  <br />
                  No surprises.
                </>
              }
              lead="Discovery → build → ship. You see working software every week, and the price is fixed before a line of code is written."
            />
            <p className="process__hint" aria-hidden="true">
              <span>Scroll</span> <i />
            </p>
          </div>

          {STEPS.map((s, i) => (
            <HUDFrame key={s.n} as="article" className="step" label={`Step ${s.n}/05 · ${s.phase}`} tone={i === 3 ? 'amber' : 'cyan'}>
              <div data-step>
                <div className="step__top">
                  <span className="step__n" aria-hidden="true">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="step__title">{s.title}</h3>
                    <p className="step__line">{s.line}</p>
                  </div>
                </div>
                <StepSchematic kind={s.schematic} />
                <ul className="step__details">
                  {s.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                <p className="step__output">
                  <span>Output</span> {s.output}
                </p>
              </div>
            </HUDFrame>
          ))}
          <div className="process__end" aria-hidden="true" />
        </div>

        <div className="rail" aria-hidden="true">
          <div className="rail__phases">
            {PHASES.map((p) => (
              <span key={p} className={STEPS[step]?.phase === p ? 'is-on' : ''}>
                {p}
              </span>
            ))}
          </div>
          <div className="rail__bar">
            <span ref={fill} className="rail__fill" />
            {STEPS.map((s, i) => (
              <i key={s.n} className={`rail__node${i <= step ? ' is-on' : ''}`} style={{ left: `${(i / (STEPS.length - 1)) * 100}%` }}>
                {s.n}
              </i>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
