import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, ExternalLink, Apple, Monitor, Users, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import heroPeople from '@/assets/hero-people.jpg';

const MCP_URL = 'https://cwaozizmiipxstlwmepk.supabase.co/functions/v1/mcp';

type ClaudeMode = 'web' | 'desktop';
type Platform = 'macos' | 'windows';

const macConfig = `{
  "mcpServers": {
    "social-mcp": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "${MCP_URL}"]
    }
  }
}`;

const windowsConfig = `{
  "mcpServers": {
    "social-mcp": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "mcp-remote", "${MCP_URL}"]
    }
  }
}`;

const configPaths = {
  macos: '~/Library/Application Support/Claude/claude_desktop_config.json',
  windows: '%APPDATA%\\Claude\\claude_desktop_config.json',
};

const detectPlatform = (): Platform => {
  const platform = navigator.platform.toLowerCase();
  if (platform.includes('win')) return 'windows';
  return 'macos';
};

export const Hero = () => {
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSettingsUrl, setCopiedSettingsUrl] = useState(false);
  const [claudeMode, setClaudeMode] = useState<ClaudeMode>('web');
  const [platform, setPlatform] = useState<Platform>('macos');

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const currentConfig = platform === 'macos' ? macConfig : windowsConfig;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentConfig);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(MCP_URL);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopySettingsUrl = async () => {
    await navigator.clipboard.writeText('claude.ai/settings/connectors');
    setCopiedSettingsUrl(true);
    setTimeout(() => setCopiedSettingsUrl(false), 2000);
  };

  return (
    <section className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Content */}
      <div className="lg:w-1/2 xl:w-[45%] flex flex-col justify-center px-8 lg:px-12 xl:px-16 py-16 lg:py-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-lg"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2.5 mb-6"
          >
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-mono tracking-tight">social-mcp</span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-serif font-medium leading-tight mb-6"
          >
            Meet real people
            <br />
            <span className="italic">through your AI</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg text-muted-foreground mb-10 leading-relaxed"
          >
            In a world where AI isolates us behind screens, Social MCP creates genuine human connections. 
            Your assistant finds people you should actually meet.
          </motion.p>

          {/* Mode Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg">
              <Button
                variant={claudeMode === 'web' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setClaudeMode('web')}
                className="h-8 px-3 text-sm"
              >
                <Globe className="w-4 h-4 mr-1.5" />
                Claude Web
              </Button>
              <Button
                variant={claudeMode === 'desktop' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setClaudeMode('desktop')}
                className="h-8 px-3 text-sm"
              >
                <Monitor className="w-4 h-4 mr-1.5" />
                Claude Desktop
              </Button>
            </div>
  {claudeMode === 'web' && (
    <p className="text-xs text-muted-foreground mt-2">Requires Claude Pro, Max, Team, or Enterprise</p>
  )}
          </motion.div>

          {/* Installation Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="space-y-6"
          >
            {claudeMode === 'web' ? (
              <>
                {/* Web Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Go to Claude Settings → Connectors</p>
                  </div>
                </div>

                {/* Web Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium mb-3">Add a new integration with these details:</p>
                    <div className="space-y-3">
                      <div className="bg-card border border-border rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Name</p>
                        <p className="font-mono text-sm">social-mcp</p>
                      </div>
                      <div className="bg-card border border-border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-muted-foreground">URL</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopyUrl}
                            className="h-6 text-xs -mr-2"
                          >
                            {copiedUrl ? (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="font-mono text-xs break-all">{MCP_URL}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Web Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium mb-2">Tell Claude:</p>
                    <div className="bg-card border border-border rounded-lg p-4">
                      <p className="font-serif text-lg italic text-foreground">
                        "Register me to Social MCP!"
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Desktop Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium mb-2">Install Claude Desktop</p>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="text-sm"
                    >
                      <a href="https://claude.ai/download" target="_blank" rel="noopener noreferrer">
                        Download Claude Desktop
                        <ExternalLink className="w-3.5 h-3.5 ml-2" />
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Desktop Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">Add this to your config</p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant={platform === 'macos' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setPlatform('macos')}
                          className="h-7 px-2 text-xs"
                        >
                          <Apple className="w-3 h-3 mr-1" />
                          Mac
                        </Button>
                        <Button
                          variant={platform === 'windows' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setPlatform('windows')}
                          className="h-7 px-2 text-xs"
                        >
                          <Monitor className="w-3 h-3 mr-1" />
                          Win
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 font-mono">
                      {configPaths[platform]}
                    </p>
                    <div className="relative bg-card border border-border rounded-lg">
                      <pre className="p-4 pr-16 text-xs overflow-x-auto whitespace-pre-wrap break-all">
                        <code>{currentConfig}</code>
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopy}
                        className="absolute top-2 right-2 h-7 text-xs bg-card"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Desktop Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium mb-2">Tell Claude:</p>
                    <div className="bg-card border border-border rounded-lg p-4">
                      <p className="font-serif text-lg italic text-foreground">
                        "Register me to Social MCP!"
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Right side - Image */}
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="lg:w-1/2 xl:w-[55%] relative min-h-[50vh] lg:min-h-screen"
      >
        <img
          src={heroPeople}
          alt="People connecting over coffee"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent lg:bg-gradient-to-r lg:from-background lg:via-transparent lg:to-transparent" />
      </motion.div>
    </section>
  );
};
