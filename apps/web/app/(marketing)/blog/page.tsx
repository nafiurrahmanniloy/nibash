/**
 * Blog index (stub) — server component.
 * Phase 1 will wire a blog feature service (`blog_posts` table, build plan §3).
 * For now this renders an empty-state placeholder rather than hardcoded post data,
 * so the route exists and the layout is correct without shipping fake content.
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Travel guides, host tips, and stories from across Bangladesh.',
};

export default function BlogIndexPage() {
  // Placeholder until the blog feature service lands (returns BlogPostDTO[]).
  const posts: { slug: string; title: string; excerpt: string }[] = [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <h1 className="font-display text-3xl font-bold text-content-primary">Blog</h1>
      <p className="mt-2 text-content-secondary">
        Guides, host tips, and stories from across Bangladesh.
      </p>

      {posts.length === 0 ? (
        <p className="mt-8 rounded-md border border-line-default bg-surface-raised p-6 text-sm text-content-secondary">
          No posts published yet. Check back soon.
        </p>
      ) : (
        <ul className="mt-8 space-y-6">
          {posts.map((post) => (
            <li key={post.slug}>
              <h2 className="text-lg font-semibold text-content-primary">
                {post.title}
              </h2>
              <p className="mt-1 text-sm text-content-secondary">{post.excerpt}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
