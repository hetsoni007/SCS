// The studio's real public facts. These are the ONLY contact channels and social
// URLs that exist. Never add others (see ../../CLAUDE.md, "Hard rules").

export const SITE = {
  name: 'Soni Consultancy Services',
  short: 'SCS',
  url: 'https://soniconsultancyservices.com',
  founder: 'Het Soni',
  tagline: 'Senior-led. Fixed-price. No bloat.',
  calendly: 'https://calendly.com/het-soni-soniconsultancyservices/introductory',
  email: 'het.soni@soniconsultancyservices.com',
  phone: '+91 8160682185',
  whatsapp: 'https://wa.me/918160682185',
  socials: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/hetsoni/' },
    { label: 'Instagram', href: 'https://www.instagram.com/soni.consultancyservices/' },
    { label: 'Facebook', href: 'https://www.facebook.com/soniconsultancyservices' },
    { label: 'Medium', href: 'https://medium.com/@hetsoni9398' },
  ],
  // From the founder copy on the live home page ("Working across UK, US, UAE and India time zones").
  coverage: ['UK', 'US', 'UAE', 'IN'],
} as const;

/** The six full-viewport HUD panels, in scroll order. Drives nav, the ladder and the camera path. */
export const SECTIONS = [
  { id: 'top', code: '00', label: 'Core' },
  { id: 'capabilities', code: '01', label: 'Capabilities' },
  { id: 'process', code: '02', label: 'Process' },
  { id: 'proof', code: '03', label: 'Proof' },
  { id: 'why', code: '04', label: 'Why us' },
  { id: 'contact', code: '05', label: 'Contact' },
] as const;

export type SectionId = (typeof SECTIONS)[number]['id'];
