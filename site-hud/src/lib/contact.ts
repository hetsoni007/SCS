/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SWAP POINT — contact form backend.
 *
 * NO BACKEND HAS BEEN CHOSEN YET. By default the form runs in "dry-run" mode: it
 * validates, animates the transmission, logs the payload to the console and
 * tells the visitor plainly that nothing was sent.
 *
 * To connect a real backend, set these at build time (static export bakes them in):
 *
 *   NEXT_PUBLIC_CONTACT_MODE=endpoint
 *   NEXT_PUBLIC_CONTACT_ENDPOINT=https://…   (receives a JSON POST of `Transmission`)
 *
 * The `endpoint` mode fits any of these, pick one:
 *  a) The studio's existing lead pipeline (API Gateway → Lambda → SES + Supabase)
 *     that the live /contact/ form already posts to. The field names below mirror
 *     that form's payload. Its CORS allow-list would need this site's origin added.
 *  b) A Next.js route handler (src/app/api/contact/route.ts). That needs a Node host,
 *     so remove `output: 'export'` in next.config.mjs.
 *  c) A hosted form service (Formspree, Basin, Web3Forms …) that accepts JSON.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface Transmission {
  kind: 'hud-site';
  name: string;
  email: string;
  message: string;
  budget: string;
  timeline: string;
  /** honeypot. Bots fill it, people never see it. */
  website?: string;
  page?: string;
}

export type TransmissionResult =
  | { ok: true; mode: 'dry-run' | 'endpoint' }
  | { ok: false; error: string };

const MODE = process.env.NEXT_PUBLIC_CONTACT_MODE === 'endpoint' ? 'endpoint' : 'dry-run';
const ENDPOINT = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT ?? '';

export const CONTACT_MODE = MODE;

export async function sendTransmission(payload: Transmission): Promise<TransmissionResult> {
  // Honeypot tripped: pretend success, send nothing.
  if (payload.website) return { ok: true, mode: MODE };

  if (MODE === 'dry-run' || !ENDPOINT) {
    await new Promise((r) => setTimeout(r, 900));
    // eslint-disable-next-line no-console
    console.info('[contact] dry run — nothing was sent. Payload:', payload);
    return { ok: true, mode: 'dry-run' };
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true, mode: 'endpoint' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'network error' };
  }
}

export const BUDGETS = ['Not sure yet', '<$10k', '$10-25k', '$25-60k', '$60k+'];
export const TIMELINES = ['ASAP', '1-3 months', '3-6 months', 'Just exploring'];
