import { useState } from 'react';
import { NetworkBackground } from '@/components/NetworkBackground';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { HowItWorks } from '@/components/HowItWorks';
import { DemoFlow } from '@/components/DemoFlow';
import { Features } from '@/components/Features';
import { Installation } from '@/components/Installation';
import { CTA } from '@/components/CTA';
import { Footer } from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();

  const handleGetStarted = () => {
    toast({
      title: "Social MCP Activation",
      description: "Tell your AI assistant: 'Enable Social MCP' to get started!",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <NetworkBackground />
      <Navbar onGetStarted={handleGetStarted} />
      
      <main className="relative z-10">
        <Hero onGetStarted={handleGetStarted} />
        <section id="how-it-works">
          <HowItWorks />
        </section>
        <section id="demo">
          <DemoFlow />
        </section>
        <section id="features">
          <Features />
        </section>
        <Installation />
        <CTA onGetStarted={handleGetStarted} />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
