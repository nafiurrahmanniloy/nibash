/**
 * metro.config.js — Metro bundler config for an Expo app inside a pnpm/Turborepo.
 *
 * In a monorepo, Metro must (1) watch the repo root so changes to @travela/shared are
 * picked up, and (2) resolve modules from both the app's and the root node_modules.
 * This is the standard Expo monorepo recipe; without it, `@travela/shared` (a
 * workspace dependency) won't resolve. No app logic here — purely build wiring.
 */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo (so shared package edits hot-reload).
config.watchFolders = [workspaceRoot];

// 2. Resolve modules from app-local then workspace-root node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. pnpm uses symlinks; let Metro follow them.
config.resolver.unstable_enableSymlinks = true;
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
