// =============================================================================
// FILE: components/cms/Markdown.tsx
// Safe Markdown: raw HTML in the source is NOT rendered (no rehype-raw), links
// pass through safeHref (no javascript:), external links open with noopener.
// =============================================================================
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { safeHref } from '@/lib/cms/slug';

export default function Markdown({ children, className = '' }: { children: string; className?: string }) {
  return (
    <div className={`cms-prose ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={(url) => safeHref(url)}
        components={{
          a: ({ href, children }) => {
            const h = safeHref(href);
            const ext = /^https?:/i.test(h);
            return <a href={h} {...(ext ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}>{children}</a>;
          },
          img: ({ src, alt }) => (/^https:\/\/res\.cloudinary\.com\//.test(String(src)) || String(src).startsWith('/')
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={String(src)} alt={alt ?? ''} loading="lazy" />
            : null),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
