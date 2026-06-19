/**
 * Blog detail (stub) — server component.
 * Phase 1 will resolve the post via a blog feature service by slug and call
 * notFound() when missing. For now it renders the slug as a placeholder heading so
 * the dynamic route is wired without fabricated content.
 */
import type { Metadata } from 'next';

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const readable = slug.replace(/-/g, ' ');
  return { title: readable, description: `Travela blog — ${readable}.` };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const readable = slug.replace(/-/g, ' ');

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <h1 className="font-display text-3xl font-bold capitalize text-content-primary">
        {readable}
      </h1>
      <p className="mt-6 text-content-secondary">
        This post is not available yet. The blog feature service will render the full
        article here.
      </p>
    </article>
  );
}
