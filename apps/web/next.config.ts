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
  transpilePackages: ['@travela/shared'],
  images: { remotePatterns },
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
