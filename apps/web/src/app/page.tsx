import { IntroGate } from "@/components/intro/IntroGate";
import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Manifiesto } from "@/components/landing/manifiesto";
import { Local } from "@/components/landing/local";
import { Services } from "@/components/landing/services";
import { Visitanos } from "@/components/landing/visitanos";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { LandingEffects } from "@/components/landing/effects";
import { LocalBusinessSchema } from "@/components/seo/local-business-schema";

export default function HomePage() {
  return (
    <IntroGate>
      <LocalBusinessSchema />
      <Nav />
      <main>
        <Hero />
        <Manifiesto />
        <Local />
        <Services />
        <Visitanos />
        <CTA />
        <Footer />
      </main>
      <LandingEffects />
    </IntroGate>
  );
}
