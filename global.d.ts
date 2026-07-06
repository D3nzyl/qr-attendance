// Ambient declarations so `tsc --noEmit` accepts CSS side-effect imports.
// (Next.js also provides these via next-env.d.ts during `next dev`/`next build`.)
declare module '*.css';
