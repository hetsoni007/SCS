/**
 * The 2D/CSS layer of the HUD. It is always rendered: it is the whole background
 * at tier 0 (phones, tablets, no WebGL) and the loading state everywhere else,
 * then fades out once the WebGL scene has drawn. CSS only: gradients, a
 * perspective grid and two drifting dust layers, all compositor-friendly.
 */
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__glow" />
      <div className="backdrop__floor" />
      <div className="backdrop__dust backdrop__dust--a" />
      <div className="backdrop__dust backdrop__dust--b" />
    </div>
  );
}

/** Scanlines, flicker and vignette over everything (DOM and canvas alike). */
export function Overlays() {
  return (
    <div className="overlays" aria-hidden="true">
      <div className="overlays__scan" />
      <div className="overlays__vignette" />
    </div>
  );
}

/**
 * CSS arc reactor: the hero centrepiece at tier 0, and the placeholder the 3D
 * reactor cross-fades over at tier ≥ 1 (both sit at the same screen position).
 */
export function CssReactor() {
  return (
    <div className="css-reactor" aria-hidden="true">
      <div className="css-reactor__ticks" />
      <div className="css-reactor__arc css-reactor__arc--a" />
      <div className="css-reactor__arc css-reactor__arc--b" />
      <div className="css-reactor__ring" />
      <div className="css-reactor__coils" />
      <div className="css-reactor__hex" />
      <div className="css-reactor__core" />
    </div>
  );
}
