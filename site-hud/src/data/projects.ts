// ─────────────────────────────────────────────────────────────────────────────
// PORTFOLIO DATA. Drop real projects in here; the Proof section renders whatever
// this array holds, in order.
//
// The entries below are the studio's real, already-published case studies, copied
// from the live /work/ page. Every number is real.
//
// NDA rules (from ../../CLAUDE.md — they apply to anything added here):
//  • `name` is a generic industry-style label, NEVER the real client/product name.
//  • `link` may point to a case study page, NEVER to an App Store / Play Store
//    listing (a store link de-anonymises the label instantly). "Live on…" is shown
//    as a plain status badge from `status`, not a link.
//  • Before adding a screenshot, check its pixels for a baked-in wordmark, logo or
//    token ticker. Crop it out, pick another screen, or omit `image` (the card then
//    renders a schematic tile). Use the generic slug in the filename too.
// ─────────────────────────────────────────────────────────────────────────────

export type ProjectStatus = 'live-both' | 'live-ios' | 'delivered' | 'concept';

export interface Project {
  /** generic slug, also used for the image filename and the case-study anchor */
  id: string;
  /** pseudonymised label — never the real name */
  name: string;
  /** short code shown on the schematic tile when there is no image */
  code?: string;
  sector: string;
  duration?: string;
  summary: string;
  /** the measured result, verbatim from the case study */
  outcome: string;
  metrics: { value: string; label: string }[];
  stack: string[];
  status: ProjectStatus;
  /**
   * SWAP POINT — real portfolio images: put a WebP in /public/portfolio/ (≤ 540px
   * wide, ~25 KB) and set src/alt/width/height. Omit to render the schematic tile.
   */
  image?: { src: string; alt: string; width: number; height: number };
  /** full case study. Never a store listing. */
  link?: string;
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  'live-both': 'Live on the App Store & Google Play',
  'live-ios': 'Live on the App Store',
  delivered: 'Delivered platform',
  concept: 'Product & UI/UX design concept',
};

const CASE = 'https://soniconsultancyservices.com/work/';

export const PROJECTS: Project[] = [
  {
    id: 'hr-payroll',
    name: 'HR & Payroll Platform',
    sector: 'HR & Payroll',
    duration: '16 weeks',
    summary: 'Attendance & salary ledger system — real-time attendance, automated payroll and centralised records across Company, Branch and Staff roles.',
    outcome: '40% less payroll processing time and accurate, transparent pay every cycle.',
    metrics: [
      { value: '40%', label: 'Faster payroll' },
      { value: '3', label: 'User roles' },
      { value: '2', label: 'Stores live' },
    ],
    stack: ['React Native', 'React', 'Node.js', 'MongoDB'],
    status: 'live-both',
    image: { src: '/portfolio/hr-payroll-sim-punch.webp', alt: 'HR platform punch in and out with live hour tracker', width: 540, height: 1072 },
    link: `${CASE}#hr-payroll`,
  },
  {
    id: 'creator-marketplace',
    name: 'Creator–Venue Marketplace',
    sector: 'Creator Marketplace',
    duration: '24 weeks',
    summary: 'An influencer-to-venue collaboration platform — slot booking, in-app content sharing, chat and a points & rewards engine.',
    outcome: 'A 35% lift in downloads and a 20% rise in venue bookings driven by authentic creator content.',
    metrics: [
      { value: '+35%', label: 'Downloads' },
      { value: '+20%', label: 'Bookings' },
      { value: '4.x', label: 'App Store' },
    ],
    stack: ['React Native', 'Chat', 'Rewards', 'Maps'],
    status: 'live-ios',
    image: { src: '/portfolio/creator-marketplace-1.webp', alt: 'Creator marketplace app home', width: 516, height: 1119 },
    link: `${CASE}#creator-marketplace`,
  },
  {
    id: 'retail-ops',
    name: 'Retail Operations Platform',
    sector: 'Retail SaaS',
    duration: '32 weeks',
    summary: 'A retail chain management platform unifying operational checklists, a gamified LMS, issue logs and customer logs.',
    outcome: 'Standardised multi-store operations with real-time visibility and measurably faster staff onboarding.',
    metrics: [
      { value: '4', label: 'Modules unified' },
      { value: '2', label: 'Stores live' },
      { value: 'LMS', label: 'Gamified' },
    ],
    stack: ['React Native', 'React', 'Node.js', 'MongoDB'],
    status: 'live-both',
    image: { src: '/portfolio/retail-ops-sim-menu.webp', alt: 'Retail platform store menu with checklists, trainings, logs and reports', width: 540, height: 1118 },
    link: `${CASE}#retail-ops`,
  },
  {
    id: 'ride-hailing',
    name: 'Ride-Hailing Platform',
    sector: 'Ride-Hailing · AI',
    duration: '25 weeks',
    summary: 'A cab-booking platform built around rider trust — transparent pricing, real-time tracking, safety features and AI-based fare prediction.',
    outcome: 'Average booking time down to ~3 minutes with safety-first UX riders actually trust.',
    metrics: [
      { value: '3min', label: 'Avg. booking' },
      { value: 'AI', label: 'Fare prediction' },
      { value: 'SOS', label: 'Safety built-in' },
    ],
    stack: ['React Native', 'Next.js', 'PostgreSQL', 'AWS'],
    status: 'live-both',
    image: { src: '/portfolio/ride-hailing-sim-map.webp', alt: 'Ride-hailing live ride tracking with fare', width: 540, height: 687 },
    link: `${CASE}#ride-hailing`,
  },
  {
    id: 'b2b-wholesale',
    name: 'B2B Wholesale Platform',
    code: 'B2B',
    sector: 'B2B Retail · Loyalty',
    summary: 'A B2B wholesale ordering platform for retailers, with a points-based loyalty engine, tiered pricing catalogue and real-time inventory tracking.',
    outcome: 'Order placement time cut by 30% and customer retention up 20% post-launch.',
    metrics: [
      { value: '-30%', label: 'Order time' },
      { value: '+20%', label: 'Retention' },
      { value: '60%', label: 'Redeemed in mo. 1' },
    ],
    stack: ['React.js', 'Node.js', 'ERP Integration'],
    status: 'live-both',
    link: `${CASE}#b2b-wholesale`,
  },
  {
    id: 'healthcare-staffing',
    name: 'Healthcare Staffing Platform',
    code: 'HLTH',
    sector: 'HealthTech · Platform',
    duration: '26 weeks',
    summary: 'A digital hiring platform connecting hospitals with nurses for shift-based work — a mobile app for nurses and a web dashboard for hospitals.',
    // Research-based target, labelled as such on the live site too. Not a live result.
    outcome: 'Designed to cut average shift-fill time from 4–8 hours to under 30 minutes, based on research across 18 hospitals.',
    metrics: [
      { value: '78%', label: 'Want short-term shifts' },
      { value: '65%', label: 'Still use manual calls' },
      { value: '<30min', label: 'Target fill time' },
    ],
    stack: ['React Native', 'Next.js', 'Express.js', 'PostgreSQL'],
    status: 'delivered',
    link: `${CASE}#healthcare-staffing`,
  },
];
