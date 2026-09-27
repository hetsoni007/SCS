// Orbiting capability modules. Readout lines are taken from the live /services/ and
// home pages. "Field" lines only name pseudonymised case studies (NDA) that really used
// the stack; they are listed in src/data/projects.ts.

export interface Readout {
  k: string;
  v: string;
}

export interface Capability {
  id: string;
  code: string;
  name: string;
  summary: string;
  readout: Readout[];
  /** optional deeper link on the live site */
  link?: { label: string; href: string };
}

export const CAPABILITIES: Capability[] = [
  {
    id: 'react-native',
    code: 'MOD-01',
    name: 'React Native',
    summary: 'iOS & Android from one codebase — native performance, push, maps, payments, offline.',
    readout: [
      { k: 'Stack', v: 'React Native · Expo · TypeScript' },
      { k: 'Targets', v: 'iOS + Android from one codebase' },
      { k: 'Built in', v: 'Push, maps, payments, biometrics, offline' },
      { k: 'Launch', v: 'App Store & Play Store submission, done for you' },
    ],
    link: { label: 'React Native service', href: 'https://soniconsultancyservices.com/react-native-app-development/' },
  },
  {
    id: 'mern',
    code: 'MOD-02',
    name: 'MERN',
    summary: 'MongoDB, Express, React, Node — the API, auth, dashboards and real-time infrastructure your app runs on.',
    readout: [
      { k: 'Stack', v: 'MongoDB · Express · React · Node.js' },
      { k: 'APIs', v: 'REST/GraphQL APIs, auth, real-time' },
      { k: 'Business', v: 'Stripe, webhooks, multi-tenancy' },
      { k: 'Ops', v: 'AWS · Docker · CI/CD' },
    ],
    link: { label: 'All services', href: 'https://soniconsultancyservices.com/services/' },
  },
  {
    id: 'nextjs',
    code: 'MOD-03',
    name: 'Next.js',
    summary: 'The SSR web app and admin dashboard your product runs on, on the same TypeScript stack as the app.',
    readout: [
      { k: 'Render', v: 'Admin dashboards & SSR web apps' },
      { k: 'Pairs with', v: 'Node.js · PostgreSQL · AWS' },
      { k: 'Field', v: 'Ride-Hailing and Healthcare Staffing platforms' },
    ],
    link: { label: 'Case studies', href: 'https://soniconsultancyservices.com/work/' },
  },
  {
    id: 'flutter',
    code: 'MOD-04',
    name: 'Flutter',
    summary: 'Cross-platform iOS & Android in Dart, for products where Flutter is the better fit than React Native.',
    readout: [
      { k: 'Stack', v: 'Flutter · Dart' },
      { k: 'Targets', v: 'iOS + Android from one codebase' },
      { k: 'Choosing', v: 'React Native or Flutter, decided per product' },
    ],
    link: { label: 'React Native vs Flutter guide', href: 'https://soniconsultancyservices.com/blog/react-native-vs-flutter-2026/' },
  },
  {
    id: 'ai',
    code: 'MOD-05',
    name: 'AI Integration',
    summary: 'Claude & GPT features that earn their place — assistants, matching, prediction, RAG.',
    readout: [
      { k: 'Stack', v: 'Claude API · GPT · RAG' },
      { k: 'Build', v: 'Pipelines & agents, embeddings, vector search' },
      { k: 'Guard', v: 'Evaluation, guardrails, cost control' },
      { k: 'Field', v: 'AI fare prediction · AI nurse matching' },
    ],
    link: { label: 'AI app ideas', href: 'https://soniconsultancyservices.com/ai-app-development/' },
  },
];
