import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Metrics } from "@/components/landing/Metrics";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <Metrics />
        <Features />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

export default Home;
