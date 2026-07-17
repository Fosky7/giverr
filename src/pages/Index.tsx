// src/pages/Index.tsx
// The "/" route renders the canonical Rayze landing page. The previous stub
// (display:none) caused the home route to render blank, leaving only the
// Header and Footer visible. Re-export HomePage so a single source of truth
// (src/pages/HomePage.tsx) drives the home experience.
export { default } from "./HomePage";
