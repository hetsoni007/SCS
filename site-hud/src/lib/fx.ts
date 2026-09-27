/** DOM micro-effects shared by several components. */

let shakeTimer = 0;

/** A 2px, 180ms screen jolt on <main>. No-op under reduced motion. */
export function shake() {
  const html = document.documentElement;
  if (html.dataset.motion === 'reduce') return;
  const main = document.getElementById('main');
  if (!main) return;
  main.classList.remove('is-shaking');
  // restart the animation if it is already running
  void main.offsetWidth;
  main.classList.add('is-shaking');
  window.clearTimeout(shakeTimer);
  shakeTimer = window.setTimeout(() => main.classList.remove('is-shaking'), 220);
}
