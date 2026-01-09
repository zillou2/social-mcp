import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Download, Copy, Check, Terminal, Settings, MessageSquare } from 'lucide-react';
import { useState } from 'react';

const MCP_SERVER_URL = 'https://github.com/user/social-mcp/releases/latest/download/social-mcp-server.zip';
const API_URL = 'https://cwaozizmiipxstlwmepk.supabase.co/functions/v1';

const configExample = `{
  "mcpServers": {
    "social-mcp": {
      "command": "node",
      "args": ["./social-mcp-server/dist/index.js"],
      "env": {
        "SOCIAL_MCP_API_URL": "${API_URL}"
      }
    }
  }
}`;

const steps = [
  {
    icon: Download,
    title: 'Download',
    description: 'Get the MCP server package',
  },
  {
    icon: Terminal,
    title: 'Install',
    description: 'Run npm install && npm run build',
  },
  {
    icon: Settings,
    title: 'Configure',
    description: 'Add to your AI client config',
  },
  {
    icon: MessageSquare,
    title: 'Connect',
    description: 'Start chatting with your AI!',
  },
];

export const Installation = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(configExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    // Create a zip file containing the MCP server code
    // For now, we'll link to GitHub - in production this would be a direct download
    window.open('https://github.com', '_blank');
  };

  return (
    <section id="installation" className="relative py-32 px-6">
      <div className="container max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Get Started in <span className="gradient-text">Minutes</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Download, install, and start connecting. It's that simple.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-sm font-medium text-muted-foreground mb-1">Step {index + 1}</div>
              <div className="font-semibold">{step.title}</div>
              <div className="text-sm text-muted-foreground">{step.description}</div>
            </div>
          ))}
        </motion.div>

        {/* Download Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="glass rounded-2xl p-8 border border-border/50 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-display font-semibold mb-2">
                Social MCP Server
              </h3>
              <p className="text-muted-foreground">
                TypeScript/Node.js package • Compatible with Claude, ChatGPT, and more
              </p>
            </div>
            <Button variant="hero" size="lg" onClick={handleDownload} className="group shrink-0">
              <Download className="w-5 h-5" />
              Download Package
            </Button>
          </div>
        </motion.div>

        {/* Configuration Example */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          viewport={{ once: true }}
          className="glass rounded-2xl border border-border/50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <div>
              <h4 className="font-semibold">Configuration Example</h4>
              <p className="text-sm text-muted-foreground">Add this to your MCP client config (e.g., claude_desktop_config.json)</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <pre className="p-6 overflow-x-auto text-sm">
            <code className="text-muted-foreground">{configExample}</code>
          </pre>
        </motion.div>

        {/* Quick commands */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <p className="text-muted-foreground mb-4">After downloading, run these commands:</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 font-mono text-sm">
            <Terminal className="w-4 h-4 text-primary" />
            <span>cd social-mcp-server && npm install && npm run build</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
