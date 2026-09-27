/**
 * Per-frame values shared between the DOM and the WebGL scene.
 *
 * A plain mutable object: writing to it never re-renders React. The DOM side
 * writes (scroll, pointer, hover, clicks), the scene reads it inside useFrame.
 */
export const live = {
  /**
   * Continuous section track. 0 = hero centred in the viewport, 1 = capabilities
   * centred … 5 = contact centred. Fractions in between drive the camera flight.
   */
  track: 0,
  /** Smoothed scroll velocity in px/frame, signed. */
  velocity: 0,
  /** Pointer position, -1..1 on both axes, y up. */
  px: 0,
  py: 0,
  /** Capability module under focus (index into CAPABILITIES), -1 = none. */
  activeModule: -1,
  /** Angle of the DOM module orbit, radians; the 3D nodes follow it. */
  orbitAngle: 0,
  /** 0..1 impulse set by clicks and transmissions; decays inside the scene. */
  ping: 0,
  /** Set by the contact form while a transmission is in flight. */
  transmitting: false,
};

/** Fire a HUD "ping": postprocessing glitch/aberration spike + reactor flare. */
export function ping(strength = 1) {
  live.ping = Math.max(live.ping, Math.min(1, strength));
}
