'use client';

import { useRef, type PointerEvent } from 'react';
import { m, useInView } from 'framer-motion';
import { PROJECTS, STATUS_LABEL, type Project } from '@/data/projects';
import { EASE } from '@/lib/animation';
import { useHUD } from '../HUDProvider';
import { SectionHeader } from '../hud/SectionHeader';

/** Stand-in visual for projects without a public screenshot. */
function SchematicTile({ project }: { project: Project }) {
  const code = project.code ?? project.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 4).toUpperCase();
  return (
    <svg className="tile" viewBox="0 0 300 220" aria-hidden="true">
      <defs>
        <pattern id={`hex-${project.id}`} width="28" height="24" patternUnits="userSpaceOnUse">
          <path d="M7 0h14l7 12-7 12H7L0 12z" className="tile__hex" />
        </pattern>
      </defs>
      <rect width="300" height="220" fill={`url(#hex-${project.id})`} />
      <circle cx="150" cy="110" r="64" className="tile__ring" />
      <circle cx="150" cy="110" r="44" className="tile__ring tile__ring--dash" />
      <path d="M40 110h46M214 110h46M150 20v26M150 174v26" className="tile__ring" />
      <text x="150" y="122" textAnchor="middle" className="tile__code">
        {code}
      </text>
      <text x="150" y="206" textAnchor="middle" className="tile__note">
        SCHEMATIC VIEW
      </text>
    </svg>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const { reduced } = useHUD();
  const ref = useRef<HTMLElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, amount: 0.3 });

  const tilt = (e: PointerEvent<HTMLElement>) => {
    if (reduced || e.pointerType !== 'mouse' || !inner.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    inner.current.style.setProperty('--rx', `${(-y * 9).toFixed(2)}deg`);
    inner.current.style.setProperty('--ry', `${(x * 11).toFixed(2)}deg`);
    inner.current.style.setProperty('--gx', `${(x + 0.5) * 100}%`);
    inner.current.style.setProperty('--gy', `${(y + 0.5) * 100}%`);
  };
  const reset = () => {
    inner.current?.style.setProperty('--rx', '0deg');
    inner.current?.style.setProperty('--ry', '0deg');
  };

  return (
    <m.article
      ref={ref}
      className={`proj${seen || reduced ? ' is-revealed' : ''}`}
      style={{ ['--i' as string]: index }}
      onPointerMove={tilt}
      onPointerLeave={reset}
      initial={reduced ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, delay: (index % 3) * 0.1, ease: EASE.hud }}
      aria-labelledby={`proj-${project.id}`}
    >
      <div className="proj__float">
        <div ref={inner} className="proj__inner">
          <span className="proj__glare" aria-hidden="true" />
          <div className="proj__media">
            {project.image ? (
              // SWAP POINT: real case-study imagery comes from projects.ts (`image`)
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.image.src}
                alt={project.image.alt}
                width={project.image.width}
                height={project.image.height}
                loading="lazy"
                decoding="async"
                className="proj__shot"
              />
            ) : (
              <SchematicTile project={project} />
            )}
            <span className="proj__scan" aria-hidden="true" />
          </div>
          <div className="proj__meta">
            <p className="proj__sector">
              {project.sector}
              {project.duration && <span> · {project.duration}</span>}
            </p>
            <h3 id={`proj-${project.id}`} className="proj__name">
              {project.name}
            </h3>
            <p className="proj__outcome">{project.outcome}</p>
            <ul className="proj__metrics">
              {project.metrics.map((mt) => (
                <li key={mt.label}>
                  <b>{mt.value}</b>
                  <span>{mt.label}</span>
                </li>
              ))}
            </ul>
            <ul className="proj__stack" aria-label="Stack">
              {project.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <div className="proj__foot">
              {/* status is a plain badge, never a store link (NDA) */}
              <span className={`badge badge--${project.status}`}>
                {project.status.startsWith('live') ? '✓ ' : ''}
                {STATUS_LABEL[project.status]}
              </span>
              <span className="proj__nda">Name withheld (NDA)</span>
            </div>
            {project.link && (
              <a className="laser proj__link" href={project.link}>
                Full case file <span aria-hidden="true">→</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </m.article>
  );
}

/**
 * 03 — Proof. Floating glass case-study panels with a perspective tilt that
 * follows the cursor and a holographic scan-in for the screenshot. Content comes
 * from src/data/projects.ts.
 */
export function Proof() {
  return (
    <section id="proof" data-hud-section className="proof" aria-labelledby="proof-title">
      <SectionHeader
        code="03"
        eyebrow="Proof"
        id="proof-title"
        title={
          <>
            Shipped. Live.
            <br />
            Under NDA.
          </>
        }
        lead="Real products in users' hands. Product names are withheld under client NDAs; every metric below is real."
      />
      <div className="proof__grid">
        {PROJECTS.map((p, i) => (
          <ProjectCard key={p.id} project={p} index={i} />
        ))}
      </div>
    </section>
  );
}
