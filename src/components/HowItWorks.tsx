import { motion } from 'framer-motion';
import { MessageSquare, UserCheck, Sparkles, ArrowRight, Heart, Briefcase, Users, Gamepad2 } from 'lucide-react';

const steps = [
  {
    icon: MessageSquare,
    title: 'Enable Social MCP',
    description: 'Simply tell your AI: "Enable Social MCP" or select it from your MCP servers list.',
    gradient: 'from-primary to-primary/50',
  },
  {
    icon: UserCheck,
    title: 'Define Your Intent',
    description: 'Tell your LLM what kind of connections you seek: jobs, romance, expertise, friendship, or more.',
    gradient: 'from-secondary to-secondary/50',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Matching',
    description: 'Our hybrid algorithm combines classical matching with LLM intelligence to find your perfect matches.',
    gradient: 'from-primary to-secondary',
  },
  {
    icon: ArrowRight,
    title: 'Connect & Chat',
    description: 'After mutual validation, start chatting directly in your LLM interface. Messages flow through Social MCP.',
    gradient: 'from-secondary to-primary',
  },
];

const intentTypes = [
  { icon: Briefcase, label: 'Career', color: 'text-primary' },
  { icon: Heart, label: 'Romance', color: 'text-pink-500' },
  { icon: Users, label: 'Friendship', color: 'text-secondary' },
  { icon: Gamepad2, label: 'Gaming', color: 'text-green-500' },
];

export const HowItWorks = () => {
  return (
    <section className="relative py-32 px-6">
      <div className="container max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            How <span className="gradient-text">Social MCP</span> Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to meaningful connections, all within your favorite AI assistant.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="gradient-border h-full">
                <div className="p-6 h-full">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div className="text-sm font-medium text-primary mb-2">Step {index + 1}</div>
                  <h3 className="text-xl font-display font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Intent types showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-8 border border-border/50"
        >
          <h3 className="text-2xl font-display font-semibold mb-6 text-center">
            Find Connections for Any Intent
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {intentTypes.map((intent, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, y: -5 }}
                className="flex items-center gap-3 px-6 py-3 rounded-xl bg-muted/50 border border-border hover:border-primary/50 transition-colors cursor-pointer"
              >
                <intent.icon className={`w-5 h-5 ${intent.color}`} />
                <span className="font-medium">{intent.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
