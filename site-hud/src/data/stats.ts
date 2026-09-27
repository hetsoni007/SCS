// "Why us" gauges. Every value is published on the live site:
//  • 5+ years  → about page + home founder copy ("5+ years commercial, store-proven")
//  • 4+ apps   → home metrics ("Apps live on App Store & Play Store")
//  • 6–10 wks  → home "Why founders pick us" ("A focused MVP on both stores in 6–10 weeks")
//  • 48 h      → home + services ("A clear proposal within 48 hours of our call")
// `sweep` is how far the dial arc fills. It is decorative, not a percentage.

export interface Gauge {
  id: string;
  from?: number; // renders "from–value", e.g. 6–10
  value: number;
  suffix?: string;
  label: string;
  sub: string;
  sweep: number;
}

export const GAUGES: Gauge[] = [
  { id: 'years', value: 5, suffix: '+', label: 'Years shipping', sub: 'Senior, commercial, store-proven', sweep: 0.62 },
  { id: 'apps', value: 4, suffix: '+', label: 'Apps shipped', sub: 'Live on the App Store & Google Play', sweep: 0.74 },
  { id: 'mvp', from: 6, value: 10, suffix: 'wk', label: 'Engagement length', sub: 'A focused MVP on both stores', sweep: 0.52 },
  { id: 'proposal', value: 48, suffix: 'h', label: 'To a fixed price', sub: 'Clear proposal after our call', sweep: 0.86 },
];

export const PILLARS = [
  { k: 'Ship in weeks, not quarters', v: 'A focused MVP on both stores in 6–10 weeks. You see working software every week — no black box.' },
  { k: 'Senior engineers, no juniors', v: 'The people on your call are the people writing the code. 5+ years commercial, store-proven.' },
  { k: 'Fixed scope, fixed price', v: 'A clear proposal within 48 hours of our call. You know the number before you commit a penny.' },
];

export const GUARANTEES = ['You own all code & IP', 'NDA on request', 'Free intro call, no upfront fee', 'Fixed scope & price up front'];
