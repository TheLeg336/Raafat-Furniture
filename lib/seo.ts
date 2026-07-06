import { useEffect } from 'react';
import { SITE, SITE_URL, OG_IMAGE } from './siteConfig';

interface SeoInput {
  title: string;
  description?: string;
  /** Path only, e.g. "/shop". Canonical becomes SITE_URL + path. */
  path?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  /** A JSON-LD object injected as a per-page <script>. */
  jsonLd?: Record<string, unknown> | null;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
  el.setAttribute('href', href);
}

/**
 * Sets title, description, canonical, Open Graph tags and an optional per-page
 * JSON-LD block on navigation. Dependency-free (no react-helmet).
 */
export function useSeo({ title, description, path, image, type = 'website', jsonLd }: SeoInput) {
  const desc = description || SITE.description;
  const url = SITE_URL + (path || (typeof window !== 'undefined' ? window.location.pathname : '/'));
  const img = image || OG_IMAGE;

  useEffect(() => {
    document.title = SITE.name;
    upsertMeta('name', 'description', desc);
    upsertLink('canonical', url);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:image', img);
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', desc);
    upsertMeta('name', 'twitter:image', img);

    const id = 'rf-page-jsonld';
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    if (jsonLd) {
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.id = id;
      s.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(s);
    }
    return () => { document.getElementById(id)?.remove(); };
  }, [title, desc, url, img, type, JSON.stringify(jsonLd)]);
}
