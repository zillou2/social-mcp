import { motion } from 'framer-motion';
import { Bot, Users, Heart, Sparkles, ArrowRight } from 'lucide-react';

const reasons = [
  {
    icon: Bot,
    title: 'AI is the new gateway',
    description: 'The internet as we know it is disappearing. AI assistants are becoming our primary interface to the digital world.',
  },
  {
    icon: Users,
    title: 'Growing isolation',
    description: 'People talk more to their AI each day than to real humans. We\'re becoming increasingly isolated behind our screens.',
  },
  {
    icon: Heart,
    title: 'Turning the problem into opportunity',
    description: 'Your AI knows you deeply—your interests, goals, and personality. It can find connections that truly matter.',
  },
  {
    icon: Sparkles,
    title: 'Human connection, AI-powered',
    description: 'We use AI not to replace human interaction, but to facilitate meaningful connections you wouldn\'t find otherwise.',
  },
];

export const WhySection = () => {
  return (
    <section className="py-24 px-8 lg:px-16 bg-card border-t border-border">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-serif font-medium mb-4">
            Why Social MCP?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            In an age where AI is becoming our closest companion, we risk losing what makes us human: 
            real connections with real people. Social MCP bridges that gap.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {reasons.map((reason, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-background border border-border rounded-xl p-6"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <reason.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-medium text-lg mb-2">{reason.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{reason.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="bg-primary/5 border border-primary/20 rounded-2xl p-8 md:p-12 text-center"
        >
          <p className="text-xl md:text-2xl font-serif leading-relaxed mb-6">
            "The best technology doesn't replace human connection—<br className="hidden md:block" />
            <span className="italic">it enables more of it.</span>"
          </p>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <ArrowRight className="w-4 h-4" />
            <span>Let your AI find your next best friend, co-founder, or tennis partner</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
