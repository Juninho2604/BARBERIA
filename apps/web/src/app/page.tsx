import { Hero } from "@/components/landing/hero";
import { Services } from "@/components/landing/services";
import { Footer } from "@/components/landing/footer";
import { IntroGate } from "@/components/intro/IntroGate";

export default function HomePage() {
  return (
    <IntroGate>
      <main>
        <Hero />
        <Services />
        <Footer />
      </main>
    </IntroGate>
  );
}
