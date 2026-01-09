import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Check, 
  Send, 
  User, 
  Bot, 
  Heart, 
  Briefcase, 
  Users, 
  Code,
  MessageCircle,
  Sparkles
} from 'lucide-react';

type Step = 'intent' | 'profile' | 'matching' | 'chat';

const intentOptions = [
  { id: 'career', icon: Briefcase, label: 'Career Networking', desc: 'Find jobs, mentors, or collaborators' },
  { id: 'romance', icon: Heart, label: 'Romance', desc: 'Meet someone special' },
  { id: 'friendship', icon: Users, label: 'Friendship', desc: 'Find like-minded friends' },
  { id: 'expertise', icon: Code, label: 'Expertise Exchange', desc: 'Learn from or teach others' },
];

const profileFields = [
  { id: 'name', label: 'Name', value: 'Alex Chen', shared: true },
  { id: 'location', label: 'Location', value: 'San Francisco', shared: true },
  { id: 'interests', label: 'Interests', value: 'AI, Music, Hiking', shared: true },
  { id: 'bio', label: 'Bio', value: 'Building the future of AI', shared: false },
];

const mockMatches = [
  { name: 'Jordan Park', match: 94, status: 'pending' },
  { name: 'Sam Rivera', match: 89, status: 'accepted' },
  { name: 'Taylor Kim', match: 85, status: 'pending' },
];

const chatMessages = [
  { from: 'user', text: 'Hey! I saw we both work in AI. What are you building?' },
  { from: 'match', text: 'Hi! I\'m working on AI-powered education tools. Your work on Social MCP sounds fascinating!' },
  { from: 'user', text: 'Thanks! Would love to chat more. Are you free for a call this week?' },
];

export const DemoFlow = () => {
  const [currentStep, setCurrentStep] = useState<Step>('intent');
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [sharedFields, setSharedFields] = useState<string[]>(['name', 'location', 'interests']);

  const steps: Step[] = ['intent', 'profile', 'matching', 'chat'];
  const stepIndex = steps.indexOf(currentStep);

  const nextStep = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const toggleField = (fieldId: string) => {
    setSharedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  return (
    <section className="relative py-32 px-6 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container max-w-5xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Experience the <span className="gradient-text">Flow</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            See how Social MCP works in your AI chat interface
          </p>
        </motion.div>

        {/* Progress bar */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  i <= stepIndex 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i < stepIndex ? <Check className="w-5 h-5" /> : i + 1}
              </button>
              {i < steps.length - 1 && (
                <div className={`w-16 h-1 mx-2 rounded-full transition-colors ${
                  i < stepIndex ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Demo container - LLM-style interface */}
        <motion.div
          layout
          className="gradient-border overflow-hidden"
        >
          <div className="bg-card rounded-lg">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <div className="font-semibold">Claude</div>
                <div className="text-xs text-muted-foreground">Social MCP enabled</div>
              </div>
              <div className="ml-auto flex items-center gap-2 text-xs text-primary">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Connected
              </div>
            </div>

            {/* Content area */}
            <div className="p-6 min-h-[400px]">
              <AnimatePresence mode="wait">
                {currentStep === 'intent' && (
                  <motion.div
                    key="intent"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="glass rounded-2xl rounded-tl-none p-4 max-w-lg">
                        <p className="text-sm">
                          <Sparkles className="w-4 h-4 text-primary inline mr-2" />
                          Social MCP is ready! What kind of connections are you looking for?
                        </p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 ml-11">
                      {intentOptions.map((option) => (
                        <motion.button
                          key={option.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedIntent(option.id)}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            selectedIntent === option.id
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <option.icon className={`w-6 h-6 mb-2 ${
                            selectedIntent === option.id ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.desc}</div>
                        </motion.button>
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        variant="hero" 
                        onClick={nextStep}
                        disabled={!selectedIntent}
                      >
                        Continue <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="glass rounded-2xl rounded-tl-none p-4 max-w-lg">
                        <p className="text-sm">
                          Great choice! Now, let's set up your profile. Choose what you'd like to share:
                        </p>
                      </div>
                    </div>

                    <div className="ml-11 space-y-3">
                      {profileFields.map((field) => (
                        <motion.div
                          key={field.id}
                          whileHover={{ scale: 1.01 }}
                          className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 transition-colors"
                        >
                          <div>
                            <div className="font-medium">{field.label}</div>
                            <div className="text-sm text-muted-foreground">{field.value}</div>
                          </div>
                          <button
                            onClick={() => toggleField(field.id)}
                            className={`w-12 h-6 rounded-full transition-colors relative ${
                              sharedFields.includes(field.id) ? 'bg-primary' : 'bg-muted'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                              sharedFields.includes(field.id) ? 'translate-x-6' : 'translate-x-0.5'
                            }`} />
                          </button>
                        </motion.div>
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <Button variant="hero" onClick={nextStep}>
                        Start Matching <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 'matching' && (
                  <motion.div
                    key="matching"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="glass rounded-2xl rounded-tl-none p-4 max-w-lg">
                        <p className="text-sm">
                          <Sparkles className="w-4 h-4 text-primary inline mr-2" />
                          I found some great matches for you! Here's who wants to connect:
                        </p>
                      </div>
                    </div>

                    <div className="ml-11 space-y-3">
                      {mockMatches.map((match, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.2 }}
                          className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                              <User className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{match.name}</div>
                              <div className="text-sm text-primary">{match.match}% match</div>
                            </div>
                          </div>
                          <Button 
                            variant={match.status === 'accepted' ? 'default' : 'outline'}
                            size="sm"
                          >
                            {match.status === 'accepted' ? (
                              <>
                                <Check className="w-4 h-4" /> Matched
                              </>
                            ) : (
                              <>
                                <Heart className="w-4 h-4" /> Accept
                              </>
                            )}
                          </Button>
                        </motion.div>
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <Button variant="hero" onClick={nextStep}>
                        Start Chatting <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {currentStep === 'chat' && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3 pb-4 border-b border-border">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">Sam Rivera</div>
                        <div className="text-xs text-muted-foreground">via Social MCP</div>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                      {chatMessages.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.3 }}
                          className={`flex gap-3 ${msg.from === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            msg.from === 'user' 
                              ? 'bg-primary' 
                              : 'bg-gradient-to-br from-primary/20 to-secondary/20'
                          }`}>
                            <User className={`w-4 h-4 ${msg.from === 'user' ? 'text-primary-foreground' : 'text-primary'}`} />
                          </div>
                          <div className={`rounded-2xl p-4 max-w-xs ${
                            msg.from === 'user'
                              ? 'bg-primary text-primary-foreground rounded-tr-none'
                              : 'glass rounded-tl-none'
                          }`}>
                            <p className="text-sm">{msg.text}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-border">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="flex-1 bg-muted rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <Button variant="hero" size="icon" className="rounded-xl">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
