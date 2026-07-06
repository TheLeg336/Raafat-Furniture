import React, { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { Star, Trash2 } from 'lucide-react';
import type { TFunction } from '../types';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { formatDate } from '../lib/format';

interface Review {
  id: string; // uid — one review per user per product
  rating: number;
  text: string;
  name: string;
  approved: boolean;
  createdAt: string;
}

interface Props { t: TFunction; productId: string; }

/** Customer reviews: created unapproved, shown publicly only after admin approval. */
export const Reviews: React.FC<Props> = ({ t, productId }) => {
  const { user, firstName, lastName, isAdmin } = useAuth();
  const toast = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = async () => {
    if (!db) return;
    try {
      const col = collection(db, 'products', productId, 'reviews');
      // Non-admins may only query approved reviews (rules enforce it).
      const snap = await getDocs(isAdmin ? col : query(col, where('approved', '==', true)));
      setReviews(snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Review))
        .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
    } catch { /* rules or offline */ }
    setLoaded(true);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [productId, isAdmin]);

  const mine = user ? reviews.find((r) => r.id === user.uid) : undefined;
  const approved = reviews.filter((r) => r.approved);
  const avg = approved.length ? approved.reduce((s, r) => s + r.rating, 0) / approved.length : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !text.trim()) return;
    setBusy(true);
    try {
      await setDoc(doc(db, 'products', productId, 'reviews', user.uid), {
        rating,
        text: text.trim().slice(0, 2000),
        name: [firstName, lastName].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'Customer',
        approved: false,
        createdAt: new Date().toISOString(),
      });
      toast.success(t('review_pending') || 'Thanks! Your review will appear after moderation.');
      setText('');
      load();
    } catch (err: any) { toast.error(err?.message || 'Could not submit the review.'); }
    setBusy(false);
  };

  const approve = async (id: string) => {
    if (!db) return;
    try { await updateDoc(doc(db, 'products', productId, 'reviews', id), { approved: true }); load(); }
    catch (err: any) { toast.error(err?.message || 'Approve failed'); }
  };
  const remove = async (id: string) => {
    if (!db || !confirm('Delete this review?')) return;
    try { await deleteDoc(doc(db, 'products', productId, 'reviews', id)); load(); }
    catch (err: any) { toast.error(err?.message || 'Delete failed'); }
  };

  if (!loaded && reviews.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-6 pb-16">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-heading text-2xl font-bold">{t('reviews_title') || 'Reviews'}</h2>
        {approved.length > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
            <Stars value={avg} size={15} /> {avg.toFixed(1)} · {approved.length}
          </span>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-4">
          {(isAdmin ? reviews : approved).length === 0 && (
            <p className="text-[var(--color-text-secondary)] text-sm">{t('no_reviews') || 'No reviews yet — be the first.'}</p>
          )}
          {(isAdmin ? reviews : approved).map((r) => (
            <div key={r.id} className="p-4 rounded-[var(--radius-md)] border border-[var(--color-border)]">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <Stars value={r.rating} size={14} />
                <span className="font-semibold text-sm">{r.name}</span>
                <span className="text-xs text-[var(--color-text-secondary)]">{r.createdAt ? formatDate(r.createdAt) : ''}</span>
                {!r.approved && <Badge tone="gold">{t('review_awaiting') || 'Awaiting approval'}</Badge>}
                {isAdmin && (
                  <span className="ms-auto flex gap-2">
                    {!r.approved && <Button size="sm" variant="secondary" onClick={() => approve(r.id)}>{t('review_approve') || 'Approve'}</Button>}
                    <button onClick={() => remove(r.id)} aria-label="Delete review" className="p-1.5 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]"><Trash2 size={14} /></button>
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>

        <div>
          {user ? (
            <form onSubmit={submit} className="flex flex-col gap-3 p-5 rounded-[var(--radius-md)] border border-[var(--color-border)]">
              <h3 className="font-semibold">{mine ? (t('write_review') || 'Update your review') : (t('write_review') || 'Write a review')}</h3>
              <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`} className="p-0.5">
                    <Star size={22} className={n <= rating ? 'fill-[var(--color-primary)] text-[var(--color-primary)]' : 'text-[var(--color-border-strong)]'} />
                  </button>
                ))}
              </div>
              <Textarea rows={4} required value={text} onChange={(e) => setText(e.target.value)} placeholder={t('review_placeholder') || 'What did you think of this piece?'} />
              <div><Button type="submit" size="sm" loading={busy}>{t('review_submit') || 'Submit review'}</Button></div>
            </form>
          ) : (
            <p className="text-sm text-[var(--color-text-secondary)]">{t('review_login') || 'Sign in to write a review'}</p>
          )}
        </div>
      </div>
    </section>
  );
};

const Stars: React.FC<{ value: number; size?: number }> = ({ value, size = 16 }) => (
  <span className="inline-flex" aria-label={`${value.toFixed(1)} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} size={size} className={n <= Math.round(value) ? 'fill-[var(--color-primary)] text-[var(--color-primary)]' : 'text-[var(--color-border-strong)]'} />
    ))}
  </span>
);

export default Reviews;
