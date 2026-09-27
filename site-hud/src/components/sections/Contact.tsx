'use client';

import { useRef, useState, type FormEvent } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { SITE } from '@/data/site';
import { EASE } from '@/lib/animation';
import { BUDGETS, CONTACT_MODE, TIMELINES, sendTransmission, type Transmission } from '@/lib/contact';
import { live, ping } from '@/lib/live';
import { shake } from '@/lib/fx';
import { useHUD } from '../HUDProvider';
import { HUDFrame } from '../hud/HUDFrame';
import { SectionHeader } from '../hud/SectionHeader';

type Status = 'idle' | 'charging' | 'sending' | 'sent' | 'error';
type Errors = Partial<Record<'name' | 'email' | 'message', string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(v: { name: string; email: string; message: string }): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = 'Callsign required — who are we talking to?';
  if (!EMAIL_RE.test(v.email.trim())) e.email = 'A valid work email is needed for the reply.';
  if (v.message.trim().length < 8) e.message = 'One line is plenty, but give us something to go on.';
  return e;
}

function Field({
  ch,
  label,
  error,
  children,
}: {
  ch: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`tx-field${error ? ' has-error' : ''}`}>
      <span className="tx-field__label" aria-hidden="true">
        <b>{ch}</b> {label}
      </span>
      {children}
      <span className="tx-field__scan" aria-hidden="true" />
      {error && (
        <span className="tx-field__error" role="alert">
          ⚠ {error}
        </span>
      )}
    </div>
  );
}

/**
 * 05 — Contact. The "transmission" form: each field runs a scan line while it has
 * focus, and the submit button charges up before it sends. The beacon in the 3D
 * scene pulses faster while a transmission is in flight and flares when it lands.
 *
 * The backend is a swap point: see src/lib/contact.ts. Until one is chosen the
 * form runs as a dry run and says so.
 */
export function Contact() {
  const { reduced } = useHUD();
  const form = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Errors>({});
  const [result, setResult] = useState<{ mode: string; name: string } | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === 'charging' || status === 'sending') return;
    const fd = new FormData(e.currentTarget);
    const payload: Transmission = {
      kind: 'hud-site',
      name: String(fd.get('name') ?? ''),
      email: String(fd.get('email') ?? ''),
      message: String(fd.get('message') ?? ''),
      budget: String(fd.get('budget') ?? ''),
      timeline: String(fd.get('timeline') ?? ''),
      website: String(fd.get('website') ?? ''),
      page: window.location.href,
    };
    const errs = validate(payload);
    setErrors(errs);
    if (Object.keys(errs).length) {
      shake();
      const first = Object.keys(errs)[0];
      (e.currentTarget.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }

    setStatus('charging');
    live.transmitting = true;
    await new Promise((r) => setTimeout(r, reduced ? 0 : 950)); // power-up
    setStatus('sending');
    const res = await sendTransmission(payload);
    live.transmitting = false;
    if (res.ok) {
      ping(1);
      setResult({ mode: res.mode, name: payload.name.trim().split(/\s+/)[0] });
      setStatus('sent');
    } else {
      setStatus('error');
    }
  };

  const busy = status === 'charging' || status === 'sending';
  const label = { idle: 'Transmit', charging: 'Charging', sending: 'Transmitting', sent: 'Sent', error: 'Retry transmission' }[status];

  return (
    <section id="contact" data-hud-section className="contact" aria-labelledby="contact-title">
      <div className="contact__grid">
        <div className="contact__intro">
          <SectionHeader
            code="05"
            eyebrow="Open channel"
            id="contact-title"
            title={
              <>
                Transmit
                <br />
                your brief.
              </>
            }
            lead="Tell us what you're building. You get a straight answer on scope and a fixed price within 48 hours — or an honest no if it isn't a fit."
          />
          <ul className="channels">
            <li>
              <span>Call</span>
              <a className="laser" href={SITE.calendly} target="_blank" rel="noopener noreferrer">
                Book a free 30-min call
              </a>
            </li>
            <li>
              <span>Email</span>
              <a className="laser" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
            </li>
            <li>
              <span>WhatsApp</span>
              <a className="laser" href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">
                {SITE.phone}
              </a>
            </li>
          </ul>
        </div>

        <HUDFrame className="tx" label="Uplink · CH-05" amount={0.15}>
          <AnimatePresence mode="wait" initial={false}>
            {status === 'sent' && result ? (
              <m.div
                key="done"
                className="tx__done"
                role="status"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: EASE.hud }}
              >
                <p className="tx__done-head">▮ Transmission logged</p>
                {result.mode === 'dry-run' ? (
                  <p className="tx__done-body">
                    Thanks{result.name ? `, ${result.name}` : ''}. <strong>This is a dry run</strong>: the form backend
                    isn&apos;t connected yet, so nothing was sent. Please use one of the channels on the left, or email{' '}
                    <a className="laser" href={`mailto:${SITE.email}`}>
                      {SITE.email}
                    </a>
                    .
                  </p>
                ) : (
                  <p className="tx__done-body">
                    Thanks{result.name ? `, ${result.name}` : ''}. Your brief is in. You&apos;ll hear back with a straight
                    answer on scope and price within 48 hours.
                  </p>
                )}
                <button
                  type="button"
                  className="laser tx__again"
                  onClick={() => {
                    form.current?.reset();
                    setStatus('idle');
                  }}
                >
                  Send another →
                </button>
              </m.div>
            ) : (
              <m.form key="form" ref={form} className="tx__form" onSubmit={onSubmit} noValidate exit={{ opacity: 0 }}>
                <Field ch="CH.01" label="Your name" error={errors.name}>
                  <input name="name" autoComplete="name" placeholder="Jane Doe" aria-label="Your name" aria-invalid={!!errors.name} />
                </Field>
                <Field ch="CH.02" label="Work email" error={errors.email}>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="jane@company.com"
                    aria-label="Work email"
                    aria-invalid={!!errors.email}
                  />
                </Field>
                <Field ch="CH.03" label="What are you building?" error={errors.message}>
                  <textarea
                    name="message"
                    rows={3}
                    placeholder="One line is plenty — e.g. a patient booking app for 3 clinics"
                    aria-label="What are you building?"
                    aria-invalid={!!errors.message}
                  />
                </Field>
                <div className="tx__row">
                  <Field ch="CH.04" label="Budget">
                    <select name="budget" aria-label="Budget" defaultValue={BUDGETS[0]}>
                      {BUDGETS.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </Field>
                  <Field ch="CH.05" label="Timeline">
                    <select name="timeline" aria-label="Timeline" defaultValue={TIMELINES[1]}>
                      {TIMELINES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                {/* honeypot */}
                <input className="hp" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />

                <button type="submit" className={`tx-btn tx-btn--${status}`} disabled={busy} data-lock>
                  <span className="tx-btn__charge" aria-hidden="true" />
                  <span className="tx-btn__label">
                    {label}
                    {busy && <span className="tx-btn__dots" aria-hidden="true" />}
                  </span>
                  <span className="tx-btn__glyph" aria-hidden="true">
                    ▸
                  </span>
                </button>
                <p className="tx__note" aria-live="polite">
                  {status === 'error'
                    ? `Link failed. Nothing was lost — try again, or email ${SITE.email}.`
                    : CONTACT_MODE === 'dry-run'
                      ? 'Dry run · form backend not connected yet — nothing is sent.'
                      : 'You own all code & IP · NDA on request · Free intro call, no upfront fee'}
                </p>
              </m.form>
            )}
          </AnimatePresence>
        </HUDFrame>
      </div>
    </section>
  );
}
