import { Hero } from '@/components/Hero';
import { WhySection } from '@/components/WhySection';
import { HowItWorks } from '@/components/HowItWorks';
import { UsageExamples } from '@/components/UsageExamples';
import { Features } from '@/components/Features';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <main>
        <Hero />
        <section id="why">
          <WhySection />
        </section>
        <section id="how-it-works">
          <HowItWorks />
        </section>
        <section id="usage-examples">
          <UsageExamples />
        </section>
        <section id="features">
          <Features />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
