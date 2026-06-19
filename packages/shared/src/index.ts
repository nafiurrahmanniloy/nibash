/**
 * @nibash/shared — cross-platform contract layer.
 *
 * Single source of truth consumed by apps/web and apps/mobile:
 *  - tokens   : design.md compiled to TS + a Tailwind preset (+ css-variables.css)
 *  - types    : internal DB row types + enum unions
 *  - schemas  : zod validation + the public DTO shapes returned to clients
 *  - supabase : Database generic + typed client factories (repository seam only)
 *  - api      : the Result/ApiResponse helper services return
 *
 * Import the CSS variables separately as a side-effect:
 *   import "@nibash/shared/tokens/css-variables.css";
 */
export * from './tokens/index.js';
export * from './types/index.js';
export * from './schemas/index.js';
export * from './supabase/index.js';
export * from './api/index.js';
