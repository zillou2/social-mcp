import { motion } from 'framer-motion';
import { 
  Shield, 
  Zap, 
  Globe, 
  Lock, 
  Bell,
  Sparkles 
} from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'MCP Native',
    description: 'Built on Model Context Protocol for seamless AI integration. Works with ChatGPT, Claude, Gemini, and more.',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'You control what you share. Granular privacy settings let you decide what\'s visible to matches.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Matching',
    description: 'Hybrid algorithm combining classical matching with LLM intelligence for deeper compatibility.',
  },
  {
    icon: Lock,
    title: 'Double Validation',
    description: 'Both parties must accept before introduction. No unwanted messages or spam.',
  },
  {
    icon: Bell,
    title: 'Push Notifications',
    description: 'Get notified of new matches and messages directly in your LLM chat via MCP subscriptions.',
  },
  {
    icon: Globe,
    title: 'Universal Access',
    description: 'One network, every AI. Your profile and connections work across all MCP-enabled assistants.',
  },
];

export const Features = () => {
  return (
    <section className="relative py-32 px-6 bg-muted/30">
      <div className="container max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Built for the <span className="gradient-text">AI Era</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Privacy-first, AI-native social networking that respects your boundaries.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
