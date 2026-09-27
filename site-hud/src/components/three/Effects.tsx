'use client';

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, Noise, Scanline, Vignette } from '@react-three/postprocessing';
import { ChromaticAberrationEffect, GlitchEffect, GlitchMode } from 'postprocessing';
import { Vector2 } from 'three';
import { live } from '@/lib/live';

/**
 * Tier-2 postprocessing stack: bloom → chromatic aberration → glitch → scanlines,
 * grain and vignette. Aberration breathes with scroll speed and spikes on ping.
 * The glitch only fires on strong pings (transmission sent, boot complete).
 * Never mounted at tier 1 or under reduced motion.
 */
export function Effects({ multisampling }: { multisampling: number }) {
  const fx = useMemo(
    () => ({
      aberration: new ChromaticAberrationEffect({
        offset: new Vector2(0.0005, 0.0003),
        radialModulation: true,
        modulationOffset: 0.3,
      }),
      glitch: new GlitchEffect({
        delay: new Vector2(0.4, 1),
        duration: new Vector2(0.1, 0.25),
        strength: new Vector2(0.04, 0.14),
        columns: 0.03,
        ratio: 0.9,
      }),
    }),
    [],
  );

  useEffect(() => {
    fx.glitch.mode = GlitchMode.DISABLED;
    return () => {
      fx.aberration.dispose();
      fx.glitch.dispose();
    };
  }, [fx]);

  useFrame(() => {
    const speed = Math.min(1, Math.abs(live.velocity) / 60);
    const o = 0.0005 + live.ping * 0.004 + speed * 0.0016;
    fx.aberration.offset.set(o, o * 0.6);
    fx.glitch.mode = live.ping > 0.62 ? GlitchMode.CONSTANT_MILD : GlitchMode.DISABLED;
  });

  return (
    <EffectComposer multisampling={multisampling} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={1.05} luminanceThreshold={0.22} luminanceSmoothing={0.3} radius={0.72} />
      {/* no dispose={null} here: R3F would assign it onto the effect and wipe its dispose() */}
      <primitive object={fx.aberration} />
      <primitive object={fx.glitch} />
      <Scanline density={1.5} opacity={0.06} />
      <Noise premultiply opacity={0.4} />
      <Vignette offset={0.22} darkness={0.62} />
    </EffectComposer>
  );
}
