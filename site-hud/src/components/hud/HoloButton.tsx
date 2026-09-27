'use client';

import { useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { ping } from '@/lib/live';
import { shake } from '@/lib/fx';

type Common = {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'amber';
  size?: 'md' | 'sm';
  className?: string;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
};

type AsLink = Common & { href: string; external?: boolean; type?: never; disabled?: never };
type AsButton = Common & { href?: undefined; external?: never; type?: 'button' | 'submit'; disabled?: boolean };

/**
 * Holographic button: chamfered glass, a radial glow that follows the pointer,
 * a ripple from the click point, and a HUD ping (scene flare + a 2px screen
 * shake). All of it collapses to a plain state change under reduced motion.
 */
export function HoloButton(props: AsLink | AsButton) {
  const { children, variant = 'primary', size = 'md', className = '', onClick } = props;
  const ref = useRef<HTMLElement>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const onMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const id = performance.now();
    // keyboard activation has no pointer position: ripple from the centre
    const x = e.clientX ? e.clientX - r.left : r.width / 2;
    const y = e.clientY ? e.clientY - r.top : r.height / 2;
    setRipples((rs) => [...rs.slice(-3), { id, x, y }]);
    window.setTimeout(() => setRipples((rs) => rs.filter((p) => p.id !== id)), 700);
    ping(0.5);
    shake();
    onClick?.(e);
  };

  const cls = `holo-btn holo-btn--${variant} holo-btn--${size} ${className}`;
  const inner = (
    <>
      <span className="holo-btn__glow" aria-hidden="true" />
      <span className="holo-btn__label">{children}</span>
      {ripples.map((p) => (
        <span key={p.id} className="holo-btn__ripple" style={{ left: p.x, top: p.y }} aria-hidden="true" />
      ))}
    </>
  );

  if (props.href !== undefined) {
    return (
      <a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={props.href}
        className={cls}
        onPointerMove={onMove}
        onClick={handleClick}
        {...(props.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {inner}
      </a>
    );
  }
  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type={props.type ?? 'button'}
      disabled={props.disabled}
      className={cls}
      onPointerMove={onMove}
      onClick={handleClick}
    >
      {inner}
    </button>
  );
}
