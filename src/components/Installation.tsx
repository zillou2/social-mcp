import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Copy, Check, Terminal, MessageSquare, Download, Server } from 'lucide-react';
import { useState } from 'react';

const MCP_URL = 'https://cwaozizmiipxstlwmepk.supabase.co/functions/v1/mcp';

const cliCommand = `claude mcp add -t sse social-mcp ${MCP_URL}`;

const configExample = `{
  "mcpServers": {
    "social-mcp": {
      "transport": "sse",
      "url": "${MCP_URL}"
    }
  }
}`;

const steps = [
  {
    icon: Terminal,
    title: 'Run Command',
    description: 'One command to install',
  },
  {
    icon: MessageSquare,
    title: 'Start Chatting',
    description: 'Ask your AI to connect you',
  },
];

export const Installation = () => {
  const [copied, setCopied] = useState(false);
  const [cmdCopied, setCmdCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(configExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCmd = async () => {
    await navigator.clipboard.writeText(cliCommand);
    setCmdCopied(true);
    setTimeout(() => setCmdCopied(false), 2000);
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
            One command. No downloads. No installation.
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

        {/* CLI Command */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Claude Code CLI</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyCmd}
              className="text-xs"
            >
              {cmdCopied ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Command
                </>
              )}
            </Button>
          </div>
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-4 font-mono text-sm break-all">
            <span className="text-muted-foreground">$ </span>{cliCommand}
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
              Or add to config manually (claude_desktop_config.json)
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

        {/* Self-Hosted Option */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Server className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Self-Hosted Server</h3>
              <p className="text-sm text-muted-foreground">Deploy your own MCP server with real-time push notifications</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              asChild
              variant="outline"
              className="flex-1"
            >
              <a 
                href="https://github.com/AdimisDev/social-mcp/archive/refs/heads/main.zip"
                download
              >
                <Download className="w-4 h-4 mr-2" />
                Download MCP Server
              </a>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="flex-1"
            >
              <a 
                href="https://github.com/AdimisDev/social-mcp/tree/main/mcp-server"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            The mcp-server folder contains everything needed to deploy to Railway, Fly.io, or Render.
          </p>
        </motion.div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          Works with Claude Code, Claude Desktop, and any MCP-compatible AI client
        </motion.p>
      </div>
    </section>
  );
};
