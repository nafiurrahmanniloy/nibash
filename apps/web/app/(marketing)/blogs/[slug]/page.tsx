/**
 * Blog post — /blogs/[slug]. Renders a demo post (CMS is a later phase).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { demoBlogBySlug, demoBlogPosts } from '@/lib/demo/data';

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = demoBlogBySlug(slug);
  if (!post) return { title: 'Post not found' };
  return { title: post.title, description: post.excerpt ?? undefined };
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = demoBlogBySlug(slug);
  if (!post) notFound();

  const more = demoBlogPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-sm text-content-muted">
        <Link href="/blogs" className="hover:text-content-primary">
          Blog
        </Link>{' '}
        / <span className="text-content-secondary">{post.category}</span>
      </nav>

      <span className="mt-4 block text-xs font-semibold uppercase tracking-wide text-brand">
        {post.category} · {post.read_minutes} min read
      </span>
      <h1 className="mt-2 font-display text-4xl font-bold leading-tight text-content-primary">
        {post.title}
      </h1>
      <p className="mt-3 text-sm text-content-muted">
        By {post.author} · {formatDate(post.published_at)}
      </p>

      {post.cover_url ? (
        <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-md bg-surface-subtle">
          <Image
            src={post.cover_url}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-4 text-md leading-relaxed text-content-secondary">
        {(post.body ?? '').split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      {more.length > 0 ? (
        <section className="mt-12 border-t border-line-default pt-8">
          <h2 className="font-display text-xl font-bold text-content-primary">
            More from the blog
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {more.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/blogs/${p.slug}`}
                  className="text-content-primary hover:text-brand focus-visible:outline-none focus-visible:underline"
                >
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
