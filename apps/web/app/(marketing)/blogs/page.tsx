/**
 * Blogs index — /blogs. Travel guides and city tips.
 *
 * Posts are demo content (the blog CMS is a later phase — BUILD-PLAN Phase 6); a real
 * build routes through a content feature/repository. Static route.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { demoBlogPosts } from '@/lib/demo/data';

export const metadata: Metadata = {
  title: 'Nibash blog — travel guides for Bangladesh',
  description: 'Guides, city tips, and where-to-stay advice for trips across Bangladesh.',
};

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function BlogsPage() {
  const posts = demoBlogPosts();
  const [featured, ...rest] = posts;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="font-display text-3xl font-bold text-content-primary">The Nibash blog</h1>
      <p className="mt-1 text-content-secondary">
        Travel guides, city tips, and where to stay across Bangladesh.
      </p>

      {featured ? (
        <Link
          href={`/blogs/${featured.slug}`}
          className="group mt-6 grid grid-cols-1 gap-5 overflow-hidden rounded-md border border-line-default bg-surface-raised shadow-soft-sm transition-shadow duration-instant hover:shadow-soft-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 md:grid-cols-2"
        >
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-subtle md:aspect-auto">
            {featured.cover_url ? (
              <Image
                src={featured.cover_url}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="flex flex-col justify-center p-5">
            <span className="text-xs font-semibold uppercase tracking-wide text-brand">
              {featured.category} · {featured.read_minutes} min read
            </span>
            <h2 className="mt-2 font-display text-2xl font-bold text-content-primary">
              {featured.title}
            </h2>
            <p className="mt-2 text-content-secondary">{featured.excerpt}</p>
            <span className="mt-3 text-sm text-content-muted">
              {featured.author} · {formatDate(featured.published_at)}
            </span>
          </div>
        </Link>
      ) : null}

      <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blogs/${post.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-md border border-line-default bg-surface-raised shadow-soft-sm transition-shadow duration-instant hover:shadow-soft-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-subtle">
                {post.cover_url ? (
                  <Image
                    src={post.cover_url}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand">
                  {post.category} · {post.read_minutes} min
                </span>
                <h3 className="mt-1 font-display text-lg font-bold text-content-primary">
                  {post.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-content-secondary">
                  {post.excerpt}
                </p>
                <span className="mt-3 text-xs text-content-muted">
                  {formatDate(post.published_at)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
