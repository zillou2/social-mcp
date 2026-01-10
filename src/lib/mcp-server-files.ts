// Auto-sync: These imports use Vite's ?raw feature to import the actual file contents
// This ensures the downloadable zip is ALWAYS in sync with the source files
import httpServerTs from '../../mcp-server/src/http-server.ts?raw';
import indexTs from '../../mcp-server/src/index.ts?raw';
import packageJson from '../../mcp-server/package.json?raw';
import dockerfile from '../../mcp-server/Dockerfile?raw';
import readme from '../../mcp-server/README.md?raw';
import flyToml from '../../mcp-server/fly.toml?raw';
import tsconfig from '../../mcp-server/tsconfig.json?raw';
import deployMd from '../../mcp-server/DEPLOY.md?raw';

// Export the files as a structured object for the zip download
export const MCP_SERVER_FILES: Record<string, string> = {
  'package.json': packageJson,
  'tsconfig.json': tsconfig,
  'Dockerfile': dockerfile,
  'README.md': readme,
  'fly.toml': flyToml,
  'DEPLOY.md': deployMd,
  'src/index.ts': indexTs,
  'src/http-server.ts': httpServerTs,
};

// Export individual files for direct access if needed
export {
  httpServerTs,
  indexTs,
  packageJson,
  dockerfile,
  readme,
  flyToml,
  tsconfig,
  deployMd,
};
