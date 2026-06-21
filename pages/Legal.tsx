import React, { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { TFunction } from '../types';
import { LEGAL_DOCS, type LegalDoc } from '../lib/legalContent';

interface Props { t: TFunction; }

const Legal: React.FC<Props> = ({ t }) => {
  const { slug } = useParams<{ slug: string }>();
  const doc = (slug && LEGAL_DOCS[slug as LegalDoc['slug']]) || null;

  useEffect(() => { window.scrollTo({ top: 0 }); }, [slug]);

  if (!doc) return <Navigate to="/legal/privacy" replace />;

  return (
    <article className="max-w-3xl mx-auto px-6 py-12 md:py-20">
      <nav className="flex flex-wrap gap-2 mb-8 text-sm">
        {Object.values(LEGAL_DOCS).map((d) => (
          <Link
            key={d.slug}
            to={`/legal/${d.slug}`}
            className={`px-4 py-1.5 rounded-[var(--radius-pill)] border transition-colors ${
              d.slug === doc.slug
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]'
            }`}
          >
            {d.title}
          </Link>
        ))}
      </nav>

      <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-balance">{doc.title}</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-2">{t('last_updated') || 'Last updated'}: {doc.updated}</p>
        <p className="text-[var(--color-text-secondary)] leading-relaxed mt-6 measure">{doc.intro}</p>
      </motion.header>

      <hr className="rule-gold my-10" />

      <div className="flex flex-col gap-9">
        {doc.sections.map((s, i) => (
          <section key={i}>
            <h2 className="font-heading text-2xl font-bold mb-3">{s.heading}</h2>
            <div className="flex flex-col gap-2.5">
              {s.body.map((p, j) => (
                <p key={j} className="text-[var(--color-text-secondary)] leading-relaxed measure" style={{ textWrap: 'pretty' as any }}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <hr className="rule-gold my-10" />
      <Link to="/" className="text-sm text-[var(--color-primary)] hover:underline">← {t('product_return_home') || 'Return home'}</Link>
    </article>
  );
};

export default Legal;
