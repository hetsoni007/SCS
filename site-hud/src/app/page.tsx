import { HUDProvider } from '@/components/HUDProvider';
import { SmoothScroll } from '@/components/SmoothScroll';
import { BootSequence } from '@/components/BootSequence';
import { SceneMount } from '@/components/SceneMount';
import { Backdrop, Overlays } from '@/components/Backdrop';
import { Cursor } from '@/components/Cursor';
import { Nav } from '@/components/Nav';
import { ScrollLadder } from '@/components/ScrollLadder';
import { Footer } from '@/components/Footer';
import { Hero } from '@/components/sections/Hero';
import { Capabilities } from '@/components/sections/Capabilities';
import { Process } from '@/components/sections/Process';
import { Proof } from '@/components/sections/Proof';
import { WhyUs } from '@/components/sections/WhyUs';
import { Contact } from '@/components/sections/Contact';

export default function Page() {
  return (
    <HUDProvider>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <BootSequence />
      <Backdrop />
      <SceneMount />
      <SmoothScroll />
      <Cursor />
      <Nav />
      <ScrollLadder />
      <main id="main">
        <Hero />
        <Capabilities />
        <Process />
        <Proof />
        <WhyUs />
        <Contact />
      </main>
      <Footer />
      <Overlays />
    </HUDProvider>
  );
}
