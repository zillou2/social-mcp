import { Link } from 'react-router-dom';
import { Heart, Github } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-6">
            <Link to="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Documentation
            </Link>
            <a
              href="https://github.com/zillou2/social-mcp/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
            Made with <Heart className="w-4 h-4 text-primary" /> for humans who want to stay human
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            © {new Date().getFullYear()} Social MCP. Open source and free.
          </p>
        </div>
      </div>
    </footer>
  );
};
