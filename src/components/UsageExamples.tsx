import { motion } from 'framer-motion';
import { Briefcase, Heart, Dumbbell, GraduationCap } from 'lucide-react';

const usageExamples = [
  {
    category: 'Professional',
    icon: Briefcase,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    examples: [
      'Find a co-founder for my SaaS startup',
      'Connect with mentors in product management',
      'Meet other indie hackers in my city',
      'Find investors interested in climate tech',
      'Network with designers for collaboration',
    ],
  },
  {
    category: 'Friendship',
    icon: Heart,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    examples: [
      'Find friends who enjoy board games',
      'Meet people for weekend hiking trips',
      'Connect with book club enthusiasts',
      'Find travel buddies for solo trips',
      'Meet dog owners in my neighborhood',
    ],
  },
  {
    category: 'Sports',
    icon: Dumbbell,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    examples: [
      'Find a tennis partner at my skill level',
      'Join a recreational soccer team',
      'Meet climbing buddies for weekend trips',
      'Find a gym accountability partner',
      'Connect with runners training for marathons',
    ],
  },
  {
    category: 'Learning',
    icon: GraduationCap,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    examples: [
      'Find a language exchange partner for Spanish',
      'Connect with people learning to code',
      'Meet musicians for jam sessions',
      'Find a study group for data science',
      'Connect with photographers to learn from',
    ],
  },
];

export const UsageExamples = () => {
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
            What will you find?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Just tell your AI what kind of connection you're looking for.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {usageExamples.map((category, index) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full ${category.bgColor} flex items-center justify-center`}>
                  <category.icon className={`w-5 h-5 ${category.color}`} />
                </div>
                <h3 className="font-medium text-lg">{category.category}</h3>
              </div>
              <ul className="space-y-2">
                {category.examples.map((example, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>"{example}"</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
