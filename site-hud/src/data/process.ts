// The engagement flow. Titles and one-liners are verbatim from the live /services/
// "Five steps. No surprises." block; detail lines come from the same site's
// /mvp-development/, home "Why us" and DevOps copy (lightly trimmed, never
// embellished). The three phases group the steps on the rail.

export type Phase = 'Discovery' | 'Build' | 'Ship';
export type Schematic = 'target' | 'wireframe' | 'loop' | 'launch' | 'scale';

export interface Step {
  n: string;
  title: string;
  line: string;
  phase: Phase;
  schematic: Schematic;
  output: string;
  details: string[];
}

export const PHASES: Phase[] = ['Discovery', 'Build', 'Ship'];

export const STEPS: Step[] = [
  {
    n: '01',
    title: 'Discover',
    line: 'Goals, scope, the metric to move. Fixed proposal in 48h.',
    phase: 'Discovery',
    schematic: 'target',
    output: 'Fixed-price proposal',
    details: ['30 minutes on your goals, users and constraints', 'Scope, timeline and a fixed price within 48 hours'],
  },
  {
    n: '02',
    title: 'Design',
    line: 'Clickable UX before a line of code.',
    phase: 'Discovery',
    schematic: 'wireframe',
    output: 'Clickable UX prototype',
    details: ['Scope cut to Core / Supporting / Later', 'Version one separated from later phases, assumptions written down'],
  },
  {
    n: '03',
    title: 'Build',
    line: 'Weekly working software, in your tools.',
    phase: 'Build',
    schematic: 'loop',
    output: 'Working software, every week',
    details: ['Weekly demo builds you can hold in your hand from the first sprint', 'The people on your call are the people writing the code'],
  },
  {
    n: '04',
    title: 'Launch',
    line: 'App Store & Play Store submission, done for you.',
    phase: 'Ship',
    schematic: 'launch',
    output: 'Live on both stores',
    details: ['Submitted, approved, live', 'Analytics instrumented from day one'],
  },
  {
    n: '05',
    title: 'Scale',
    line: 'Iterate on real usage; own the ops.',
    phase: 'Ship',
    schematic: 'scale',
    output: 'Iteration + ops ownership',
    details: ['AWS architecture & auto-scaling', 'CI/CD, Docker, monitoring'],
  },
];
