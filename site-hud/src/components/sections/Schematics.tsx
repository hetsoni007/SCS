import type { Schematic } from '@/data/process';

/**
 * Line-art schematics for the process steps. Every stroke carries
 * pathLength=1 + class "draw" so it can be drawn on (GSAP sets stroke-dashoffset
 * from 1 → 0 as the panel slides in). They are illustrative diagrams and carry no
 * numbers or claims.
 */
export function StepSchematic({ kind }: { kind: Schematic }) {
  return (
    <svg className="schematic" viewBox="0 0 320 170" aria-hidden="true">
      <g className="schematic__grid">
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="170" />
        ))}
        {Array.from({ length: 5 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 40 + 5} x2="320" y2={i * 40 + 5} />
        ))}
      </g>
      {kind === 'target' && <Target />}
      {kind === 'wireframe' && <Wireframe />}
      {kind === 'loop' && <Loop />}
      {kind === 'launch' && <Launch />}
      {kind === 'scale' && <Scale />}
    </svg>
  );
}

const D = { pathLength: 1, className: 'draw' } as const;
const DA = { pathLength: 1, className: 'draw draw--amber' } as const;

function Target() {
  return (
    <g>
      <circle {...D} cx="120" cy="85" r="62" />
      <circle {...D} cx="120" cy="85" r="42" />
      <circle {...D} cx="120" cy="85" r="22" />
      <path {...D} d="M120 12v30M120 128v30M48 85h30M162 85h30" />
      <circle {...DA} cx="136" cy="72" r="5" />
      <path {...DA} d="M141 68 L200 36 H292" />
      <text x="206" y="30" className="schematic__label">
        METRIC TO MOVE
      </text>
      <path {...D} d="M200 120 H292 M200 134 H270 M200 148 H282" />
      <text x="206" y="112" className="schematic__label">
        SCOPE
      </text>
    </g>
  );
}

function Phone({ x, amber = false }: { x: number; amber?: boolean }) {
  const p = amber ? DA : D;
  return (
    <g>
      <rect {...p} x={x} y="22" width="62" height="118" rx="9" />
      <path {...D} d={`M${x + 10} 42 h42 M${x + 10} 56 h30 M${x + 10} 96 h42 M${x + 10} 108 h26`} />
      <rect {...D} x={x + 10} y="66" width="42" height="22" rx="3" />
    </g>
  );
}

function Wireframe() {
  return (
    <g>
      <Phone x={26} />
      <Phone x={128} amber />
      <Phone x={230} />
      <path {...D} d="M92 81 H124 M118 76 l6 5 -6 5" />
      <path {...D} d="M194 81 H226 M220 76 l6 5 -6 5" />
      <text x="128" y="160" className="schematic__label">
        CLICKABLE UX
      </text>
    </g>
  );
}

function Loop() {
  return (
    <g>
      <path {...D} d="M160 22 A63 63 0 1 1 97 85" />
      <path {...D} d="M97 85 l-7 -12 M97 85 l11 -7" />
      <circle {...DA} cx="160" cy="22" r="7" />
      <circle {...D} cx="223" cy="85" r="7" />
      <circle {...D} cx="160" cy="148" r="7" />
      <text x="172" y="18" className="schematic__label">
        BUILD
      </text>
      <text x="236" y="89" className="schematic__label">
        DEMO
      </text>
      <text x="172" y="160" className="schematic__label">
        FEEDBACK
      </text>
      <text x="126" y="89" className="schematic__label schematic__label--hi">
        WEEKLY
      </text>
    </g>
  );
}

function Launch() {
  return (
    <g>
      <rect {...D} x="196" y="18" width="104" height="48" rx="6" />
      <rect {...D} x="196" y="98" width="104" height="48" rx="6" />
      <path {...DA} d="M210 42 l8 8 16 -16" />
      <path {...DA} d="M210 122 l8 8 16 -16" />
      <text x="244" y="46" className="schematic__label">
        iOS
      </text>
      <text x="244" y="126" className="schematic__label">
        ANDROID
      </text>
      <path {...D} d="M24 150 C 80 150, 120 90, 180 44" />
      <path {...D} d="M24 150 C 80 150, 120 140, 180 122" />
      <circle {...DA} cx="24" cy="150" r="6" />
    </g>
  );
}

function Scale() {
  const bars = [30, 46, 60, 84, 108];
  return (
    <g>
      <path {...D} d="M24 150 H200 M24 150 V20" />
      {bars.map((h, i) => (
        <rect key={i} {...(i === bars.length - 1 ? DA : D)} x={40 + i * 32} y={150 - h} width="20" height={h} />
      ))}
      <circle {...D} cx="258" cy="50" r="14" />
      <circle {...D} cx="236" cy="118" r="10" />
      <circle {...D} cx="290" cy="118" r="10" />
      <path {...D} d="M252 62 L240 108 M264 62 L286 108 M246 118 H280" />
      <text x="226" y="160" className="schematic__label">
        OPS
      </text>
    </g>
  );
}
