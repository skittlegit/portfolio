// Ambient declarations for the TypeScript language server.
//
// Lets editors accept side-effect stylesheet imports such as
// `import "./globals.css"` without a TS2882 "cannot find module" error.
// Next.js bundles the CSS itself; this only satisfies type resolution.
// (More specific Next types like `*.module.css` still take precedence.)
declare module "*.css";
