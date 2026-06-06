import { setRequestLocale } from "next-intl/server";
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

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // setRequestLocale en cada page con `generateStaticParams` activa SSG
  // por locale. Si no lo llamamos, el componente queda en modo dinámico.
  setRequestLocale(locale);
  return (
    <IntroGate>
      <LocalBusinessSchema />
      <Nav />
      <main id="main-content" tabIndex={-1}>
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
