import { motion } from 'framer-motion';
import { MessageSquare, UserCheck, Sparkles, ArrowRight, Heart, Briefcase, Users, Gamepad2 } from 'lucide-react';

const steps = [
  {
    icon: MessageSquare,
    title: 'Define Your Intent',
    description: 'Tell your AI what connections you seek: career opportunities, romance, expertise, or friendship.',
  },
  {
    icon: UserCheck,
    title: 'Get Matched',
    description: 'Our algorithm finds compatible people based on mutual interests and intentions.',
  },
  {
    icon: Sparkles,
    title: 'Double Validation',
    description: 'Both people must accept before any introduction. No spam, no unwanted contact.',
  },
  {
    icon: ArrowRight,
    title: 'Connect & Chat',
    description: 'Start meaningful conversations directly through your AI assistant.',
  },
];

const intentTypes = [
  { icon: Briefcase, label: 'Career' },
  { icon: Heart, label: 'Romance' },
  { icon: Users, label: 'Friendship' },
  { icon: Gamepad2, label: 'Hobbies' },
];

export const HowItWorks = () => {
  return (
    <section className="py-24 px-8 lg:px-16">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-serif font-medium mb-4">
            How it works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Your AI becomes a thoughtful matchmaker, connecting you with people who share your intentions.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-5 h-5 text-foreground" />
              </div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Step {index + 1}
              </div>
              <h3 className="font-medium mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Intent types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground mb-4">Find connections for</p>
          <div className="flex flex-wrap justify-center gap-3">
            {intentTypes.map((intent, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm"
              >
                <intent.icon className="w-4 h-4 text-muted-foreground" />
                <span>{intent.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
