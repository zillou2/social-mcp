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
    title: 'Works with any AI',
    description: 'Built on MCP protocol. Compatible with Claude, ChatGPT, Gemini, and more.',
  },
  {
    icon: Shield,
    title: 'Privacy first',
    description: 'You control exactly what you share. Granular privacy settings for every field.',
  },
  {
    icon: Lock,
    title: 'Mutual consent',
    description: 'Both parties must accept before any introduction. No unwanted contact.',
  },
  {
    icon: Bell,
    title: 'Real-time notifications',
    description: 'Get notified of matches and messages directly in your AI chat.',
  },
  {
    icon: Sparkles,
    title: 'Intelligent matching',
    description: 'AI-powered algorithm that understands context and compatibility.',
  },
  {
    icon: Globe,
    title: 'Open & free',
    description: 'Open source project. No fees, no premium tiers, no hidden costs.',
  },
];

export const Features = () => {
  return (
    <section className="py-24 px-8 lg:px-16 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-serif font-medium mb-4">
            Built for humans
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Technology that serves connection, not isolation.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              viewport={{ once: true }}
            >
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
