/// <reference types="vite/client" />

// Allow importing files as raw text strings using ?raw suffix
declare module '*.ts?raw' {
  const content: string;
  export default content;
}

declare module '*.json?raw' {
  const content: string;
  export default content;
}

declare module '*.md?raw' {
  const content: string;
  export default content;
}

declare module '*.toml?raw' {
  const content: string;
  export default content;
}

declare module '*?raw' {
  const content: string;
  export default content;
}
