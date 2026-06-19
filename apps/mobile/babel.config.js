/**
 * babel.config.js — Expo + expo-router preset.
 *
 * `babel-preset-expo` includes the React Native + Reanimated-safe transforms and,
 * with `expo-router`, wires the file-based routing entry. Keep this lean: no custom
 * module-resolver aliases — path aliases (@nibash/shared, @/*) are resolved by
 * tsconfig + Metro's workspace + tsconfig-paths support.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'react' }]],
  };
};
