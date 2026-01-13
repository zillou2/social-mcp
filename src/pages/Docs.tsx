import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  ArrowLeft, 
  Briefcase, 
  Heart, 
  Dumbbell, 
  GraduationCap,
  Code,
  Copy,
  Check,
  MessageSquare,
  UserPlus,
  Search,
  Send,
  Github
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const conversationExamples = [
  {
    title: 'Registration',
    icon: UserPlus,
    messages: [
      { role: 'user', content: 'Register me to Social MCP. My name is Alex, I\'m a software engineer in San Francisco who loves hiking and building side projects.' },
      { role: 'assistant', content: 'I\'ll register you on Social MCP now.\n\n✅ **Registration successful!**\n\nYour profile has been created:\n- **Name:** Alex\n- **Bio:** Software engineer in San Francisco who loves hiking and building side projects\n\nYou\'re now part of the network. Would you like to set an intent to find specific connections?' },
    ],
  },
  {
    title: 'Finding Matches',
    icon: Search,
    messages: [
      { role: 'user', content: 'I want to find a co-founder for my AI startup. Someone technical who\'s interested in developer tools.' },
      { role: 'assistant', content: 'I\'ll set up a professional intent to find co-founders for you.\n\n✅ **Intent created!**\n\nNow searching for matches...\n\n🎯 **Found 2 potential matches:**\n\n**1. Jordan** (Match score: 92%)\n- ML Engineer at a fintech startup\n- Looking for: "Technical co-founder for AI/ML projects"\n- Location: San Francisco\n\n**2. Sam** (Match score: 87%)\n- Full-stack developer, prev. at Stripe\n- Looking for: "Partners for developer tools startup"\n- Location: Remote (PST)\n\nWould you like to connect with either of them?' },
    ],
  },
  {
    title: 'Sending Messages',
    icon: Send,
    messages: [
      { role: 'user', content: 'Yes, let\'s connect with Jordan. Send them a message introducing myself and my startup idea.' },
      { role: 'assistant', content: 'I\'ll accept the match with Jordan and send an introduction.\n\n✅ **Match accepted!** Jordan will be notified.\n\n📨 **Message sent:**\n\n"Hi Jordan! I\'m Alex, a software engineer working on an AI-powered code review tool. I saw you\'re interested in AI/ML projects and looking for a technical co-founder. I\'d love to chat about potentially collaborating. My background is in developer tools and I think there\'s a great opportunity in this space. Would you be up for a call this week?"\n\nI\'ll let you know when Jordan responds!' },
    ],
  },
];

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

export default function Docs() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Users className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-mono">social-mcp</span>
          </Link>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/zillou2/social-mcp/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4">
            Documentation
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Learn how to use Social MCP through natural conversations with your AI assistant.
          </p>
        </motion.div>

        {/* Conversation Examples */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-24"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-medium">Example Conversations</h2>
              <p className="text-muted-foreground text-sm">See how natural it is to use Social MCP</p>
            </div>
          </div>

          <div className="space-y-8">
            {conversationExamples.map((example, exampleIndex) => (
              <motion.div
                key={example.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + exampleIndex * 0.1 }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-muted/30">
                  <example.icon className="w-5 h-5 text-primary" />
                  <h3 className="font-medium">{example.title}</h3>
                </div>
                <div className="p-6 space-y-4">
                  {example.messages.map((message, msgIndex) => (
                    <div
                      key={msgIndex}
                      className={`flex gap-3 ${message.role === 'user' ? '' : ''}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {message.role === 'user' ? 'Y' : 'AI'}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">
                          {message.role === 'user' ? 'You' : 'AI Assistant'}
                        </p>
                        <div className="bg-muted/50 rounded-lg p-4 relative group">
                          <pre className="text-sm whitespace-pre-wrap font-sans">{message.content}</pre>
                          {message.role === 'user' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(message.content, exampleIndex * 10 + msgIndex)}
                              className="absolute top-2 right-2 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {copiedIndex === exampleIndex * 10 + msgIndex ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Usage Examples */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-24"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Code className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-medium">Usage Examples</h2>
              <p className="text-muted-foreground text-sm">Ideas for different types of connections</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {usageExamples.map((category, index) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
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
        </motion.section>

        {/* Technical Docs Link */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <div className="bg-card border border-border rounded-xl p-8">
            <Github className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-serif font-medium mb-2">Technical Documentation</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              For API reference, deployment guides, and contributing information, check out our GitHub repository.
            </p>
            <Button asChild>
              <a
                href="https://github.com/zillou2/social-mcp/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-4 h-4 mr-2" />
                View on GitHub
              </a>
            </Button>
          </div>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Social MCP. Open source and free.
        </div>
      </footer>
    </div>
  );
}
