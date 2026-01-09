import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Copy, Check, Link, MessageSquare } from 'lucide-react';
import { useState } from 'react';

const MCP_URL = 'https://cwaozizmiipxstlwmepk.supabase.co/functions/v1';

const configExample = `{
  "mcpServers": {
    "social-mcp": {
      "url": "${MCP_URL}"
    }
  }
}`;

const steps = [
  {
    icon: Link,
    title: 'Copy URL',
    description: 'Copy the MCP server URL below',
  },
  {
    icon: MessageSquare,
    title: 'Configure',
    description: 'Add to your AI client settings',
  },
];

export const Installation = () => {
  const [copied, setCopied] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(configExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(MCP_URL);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  return (
    <section id="installation" className="py-24 px-6 relative">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get Started in <span className="text-primary">Seconds</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Just add the MCP server URL to your AI client—no installation required
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center gap-8 mb-12"
        >
          {steps.map((step, index) => (
            <div key={step.title} className="flex items-center gap-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{step.title}</h3>
                <p className="text-xs text-muted-foreground max-w-[120px]">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="w-12 h-px bg-border mt-[-20px]" />
              )}
            </div>
          ))}
        </motion.div>

        {/* MCP URL */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">MCP Server URL</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyUrl}
              className="text-xs"
            >
              {urlCopied ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy URL
                </>
              )}
            </Button>
          </div>
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-4 font-mono text-sm break-all">
            {MCP_URL}
          </div>
        </motion.div>

        {/* Config Example */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">
              Example configuration (claude_desktop_config.json)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Config
                </>
              )}
            </Button>
          </div>
          <pre className="text-sm overflow-x-auto">
            <code className="text-foreground/90">{configExample}</code>
          </pre>
        </motion.div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          Works with Claude Desktop, ChatGPT, and any MCP-compatible AI client
        </motion.p>
      </div>
    </section>
  );
};
