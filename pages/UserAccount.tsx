import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { LogOut, ArrowLeft, User, Package, ChevronRight, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { type TFunction, type Order, type OrderStatus } from '../types';
import { subscribeUserOrders } from '../lib/orders';
import { useStore } from '../contexts/StoreContext';
import { useProducts } from '../hooks/useProducts';
import { localized } from '../lib/format';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageSpinner } from '../components/ui/Spinner';
import { formatMoney, formatDate } from '../lib/format';

interface UserAccountProps { t: TFunction; }

const statusTone: Record<OrderStatus, 'gold' | 'success' | 'navy' | 'danger' | 'info'> = {
  pending_payment: 'gold', payment_verification: 'gold', paid: 'success', confirmed: 'info',
  in_production: 'info', awaiting_approval: 'info', ready: 'info', shipped: 'info',
  completed: 'success', cancelled: 'danger', refunded: 'danger',
};

const UserAccount: React.FC<UserAccountProps> = ({ t }) => {
  const { user, firstName, lastName, isAdmin, loading, logout } = useAuth();
  const navigate = useNavigate();
  const { wishlist } = useStore();
  const { products } = useProducts();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const wishlistProducts = products.filter((p) => wishlist.includes(String(p.id)));

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeUserOrders(user.uid, (o) => { setOrders(o); setOrdersLoading(false); });
    return () => unsub();
  }, [user]);

  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;

  const fullName = firstName && lastName ? `${firstName} ${lastName}` : null;
  const statusLabel = (s: OrderStatus) => t(`order_status_${s}`) || s.replace(/_/g, ' ');

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 md:py-16">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] mb-6">
        <ArrowLeft size={16} /> {t('nav_go_back') || 'Back'}
      </button>

      {/* Profile */}
      <Card className="p-6 md:p-8 flex items-center gap-5 mb-8">
        <div className="w-16 h-16 bg-[hsla(var(--color-primary-hsl-values),0.15)] text-[var(--color-primary)] rounded-full flex items-center justify-center shrink-0 overflow-hidden">
          {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : <User size={30} />}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading text-2xl font-bold truncate">{fullName || t('account_title')}</h1>
          <p className="text-[var(--color-text-secondary)] truncate">{user.email}</p>
        </div>
        <Button variant="ghost" onClick={async () => { await logout(); navigate('/'); }} iconLeft={<LogOut size={18} />} className="text-[var(--color-danger)]">
          <span className="hidden sm:inline">{t('account_signout')}</span>
        </Button>
      </Card>

      {/* Orders */}
      <div className="flex items-center gap-2 mb-4">
        <Package size={20} className="text-[var(--color-primary)]" />
        <h2 className="font-heading text-xl font-bold">{t('my_orders') || 'My orders'}</h2>
      </div>

      {ordersLoading ? (
        <PageSpinner />
      ) : orders.length === 0 ? (
        <Card className="p-10 text-center text-[var(--color-text-secondary)]">
          <Package size={36} className="mx-auto mb-3 opacity-30" />
          <p className="mb-5">{t('no_orders') || 'You have no orders yet.'}</p>
          <Link to="/shop"><Button>{t('continue_shopping') || 'Continue shopping'}</Button></Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o, i) => (
            <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link to={`/order/confirmation?order=${o.orderNumber}`}>
                <Card hover className="p-5 flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {o.items.slice(0, 3).map((it, j) => (
                      <div key={j} className="w-12 h-12 rounded-[var(--radius-sm)] overflow-hidden bg-[var(--color-secondary)] border-2 border-[var(--color-surface)]">
                        {it.imageUrl && <img src={it.imageUrl} alt="" className="w-full h-full object-cover" />}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-bold tracking-wider">{o.orderNumber}</span>
                      <Badge tone={statusTone[o.status]}>{statusLabel(o.status)}</Badge>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
                      {formatDate(o.createdAt)} · {o.items.reduce((n, it) => n + it.quantity, 0)} {t('items') || 'items'} · {formatMoney(o.total, { currency: o.currency })}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-[var(--color-text-secondary)] rtl:rotate-180" />
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Wishlist */}
      {wishlistProducts.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-4 mt-10">
            <Heart size={20} className="text-[var(--color-primary)]" />
            <h2 className="font-heading text-xl font-bold">{t('wishlist_title') || 'Saved items'}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {wishlistProducts.map((p) => (
              <Link key={p.id} to={`/product/${p.id}`}>
                <Card hover className="overflow-hidden">
                  <div className="aspect-square bg-[var(--color-secondary)]">
                    {p.imageUrl && <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold truncate">{p.name ? localized(p.name) : t(p.nameKey || '')}</p>
                    {p.price != null && <p className="text-xs text-[var(--color-text-secondary)]">{formatMoney(p.price)}</p>}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UserAccount;
