import { setRequestLocale } from "next-intl/server";

// Esta página llama a la API por servicios — necesita render en runtime
// (no SSG en build) para que (1) el fetch a http://api:4000 funcione
// sólo cuando el contenedor api está arriba, (2) el admin pueda editar
// servicios y se reflejen sin redeploy.
export const dynamic = "force-dynamic";
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
