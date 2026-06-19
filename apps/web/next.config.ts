import type { NextConfig } from 'next';
import type { RemotePattern } from 'next/dist/shared/lib/image-config';

/**
 * next.config.ts — web app configuration.
 * - transpilePackages: compile the workspace shared package from source.
 * - images.remotePatterns: allow Supabase Storage public assets + Google Static Maps.
 *   The Supabase host is derived from NEXT_PUBLIC_SUPABASE_URL at build time; no
 *   hardcoded project ref. Maps tiles come from a fixed Google host.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const remotePatterns: RemotePattern[] = [
  {
    protocol: 'https',
    hostname: 'maps.googleapis.com',
    pathname: '/maps/api/staticmap**',
  },
  // Demo-mode placeholder photos (lib/demo fixtures).
  { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
  { protocol: 'https', hostname: 'fastly.picsum.photos', pathname: '/**' },
];

if (supabaseHost) {
  remotePatterns.unshift({
    protocol: 'https',
    hostname: supabaseHost,
    pathname: '/storage/v1/object/public/**',
  });
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@nibash/shared'],
  images: { remotePatterns },
  // typedRoutes graduated out of `experimental` in Next 15.
  typedRoutes: true,
  /**
   * The shared package and feature barrels use explicit `.js` extensions on relative
   * imports (NodeNext/ESM-correct). Tell webpack to resolve a `.js` specifier to the
   * `.ts`/`.tsx` source so those imports work without rewriting every barrel.
   */
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default nextConfig;
