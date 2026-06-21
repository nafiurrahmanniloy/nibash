/**
 * Legal document page — server component.
 * Renders a known legal document by its `doc` slug (terms / privacy / cancellation).
 * Unknown slugs 404. Body copy is intentionally a short placeholder; the final legal
 * text is client-supplied content (build plan §0) and will be loaded from a content
 * source later — this keeps the route + metadata correct now.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Params = { doc: string };

const DOCS: Record<string, { title: string; intro: string }> = {
  terms: {
    title: 'Terms of Service',
    intro: 'The terms that govern your use of Nibash as a guest or host.',
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'How Nibash collects, uses, and protects your personal data.',
  },
  cancellation: {
    title: 'Cancellation Policy',
    intro: 'When and how a booking can be cancelled, and how refunds are handled.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { doc } = await params;
  const entry = DOCS[doc];
  if (!entry) return { title: 'Legal' };
  return { title: entry.title, description: entry.intro };
}

export default async function LegalDocPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { doc } = await params;
  const entry = DOCS[doc];
  if (!entry) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-content-primary">
        {entry.title}
      </h1>
      <p className="mt-3 text-content-secondary">{entry.intro}</p>
      <p className="mt-6 text-sm text-content-muted">
        Full document text is being finalized and will appear here.
      </p>
    </article>
  );
}
