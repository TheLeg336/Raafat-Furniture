import React, { useEffect, useState } from 'react';
import {
  collection, collectionGroup, deleteDoc, doc, getDocs, query, updateDoc, where,
} from 'firebase/firestore';
import { Star, Trash2, Check } from 'lucide-react';
import type { TFunction } from '../types';
import { db } from '../lib/firebase';
import { AdminPageHeader } from '../components/admin/AdminPageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageSpinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { formatDate } from '../lib/format';
import { Link } from 'react-router-dom';

interface Props { t: TFunction; }

interface PendingReview {
  id: string;
  productId: string;
  rating: number;
  text: string;
  name: string;
  createdAt: string;
}

/** Central moderation queue for unapproved product reviews. */
const AdminReviews: React.FC<Props> = ({ t }) => {
  const toast = useToast();
  const [rows, setRows] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    if (!db) { setLoading(false); return; }
    setLoading(true);
    try {
      // Prefer collectionGroup; fall back to scanning products if index missing.
      let list: PendingReview[] = [];
      try {
        const snap = await getDocs(query(collectionGroup(db, 'reviews'), where('approved', '==', false)));
        list = snap.docs.map((d) => {
          const productId = d.ref.parent.parent?.id || '';
          return { id: d.id, productId, ...(d.data() as any) };
        });
      } catch {
        const products = await getDocs(collection(db, 'products'));
        for (const p of products.docs) {
          const snap = await getDocs(query(collection(db, 'products', p.id, 'reviews'), where('approved', '==', false)));
          snap.docs.forEach((d) => {
            list.push({ id: d.id, productId: p.id, ...(d.data() as any) });
          });
        }
      }
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setRows(list);
    } catch (e: any) {
      toast.error(e?.message || 'Could not load reviews');
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const approve = async (r: PendingReview) => {
    if (!db) return;
    setBusyId(r.id);
    try {
      await updateDoc(doc(db, 'products', r.productId, 'reviews', r.id), { approved: true });
      toast.success('Review approved');
      setRows((prev) => prev.filter((x) => !(x.id === r.id && x.productId === r.productId)));
    } catch (e: any) {
      toast.error(e?.message || 'Approve failed');
    }
    setBusyId(null);
  };

  const remove = async (r: PendingReview) => {
    if (!db || !confirm('Delete this review?')) return;
    setBusyId(r.id);
    try {
      await deleteDoc(doc(db, 'products', r.productId, 'reviews', r.id));
      toast.success('Review deleted');
      setRows((prev) => prev.filter((x) => !(x.id === r.id && x.productId === r.productId)));
    } catch (e: any) {
      toast.error(e?.message || 'Delete failed');
    }
    setBusyId(null);
  };

  return (
    <>
      <AdminPageHeader title={t('admin_reviews') || 'Reviews'} />
      {loading ? (
        <PageSpinner />
      ) : rows.length === 0 ? (
        <Card className="p-12 text-center text-[var(--color-text-secondary)]">
          No pending reviews. Customer reviews stay hidden until approved.
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <Card key={`${r.productId}-${r.id}`} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold">{r.name}</span>
                    <Badge tone="gold">Pending</Badge>
                    <span className="inline-flex items-center gap-0.5 text-[var(--color-primary)] text-sm">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={14} className={i < r.rating ? 'fill-current' : 'opacity-30'} />
                      ))}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{r.text}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                    {formatDate(r.createdAt)} ·{' '}
                    <Link to={`/product/${r.productId}`} className="text-[var(--color-primary)] hover:underline">
                      View product
                    </Link>
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" loading={busyId === r.id} iconLeft={<Check size={14} />} onClick={() => approve(r)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="secondary" loading={busyId === r.id} iconLeft={<Trash2 size={14} />} onClick={() => remove(r)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
};

export default AdminReviews;
