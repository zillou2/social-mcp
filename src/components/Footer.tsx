import { Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
          Made with <Heart className="w-4 h-4 text-primary" /> for humans who want to stay human
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          © {new Date().getFullYear()} Social MCP. Open source and free.
        </p>
      </div>
    </footer>
  );
};
