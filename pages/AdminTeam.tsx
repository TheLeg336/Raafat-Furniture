import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { collection, deleteDoc, doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { ShieldCheck, Hammer, Trash2, UserPlus, Code2, Smartphone } from 'lucide-react';
import type { TFunction } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { AdminNav } from '../components/admin/AdminNav';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageSpinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';

interface Props { t: TFunction; }

interface StaffDoc { email: string; role: 'admin' | 'developer' | 'worker'; }

const roleIcon: Record<string, React.ReactNode> = {
  developer: <Code2 size={14} />, admin: <ShieldCheck size={14} />, worker: <Hammer size={14} />,
};

/**
 * Team management: grant admin / worker access by email.
 * Writes to admins/{email}; Firestore rules restrict writes to developers.
 * Workers see only the /staff workshop view (no prices, no customer data).
 */
const AdminTeam: React.FC<Props> = () => {
  const { user, isAdmin, isDeveloper, loading } = useAuth();
  const toast = useToast();
  const [staff, setStaff] = useState<StaffDoc[] | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffDoc['role']>('worker');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!db || !isAdmin) return;
    return onSnapshot(collection(db, 'admins'),
      (snap) => setStaff(snap.docs.map((d) => ({ email: d.id, role: (d.data().role || 'admin') as StaffDoc['role'] }))),
      () => setStaff([]));
  }, [isAdmin]);

  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(em) || !db) return;
    setBusy(true);
    try {
      await setDoc(doc(db, 'admins', em), { role });
      toast.success(`${em} added as ${role}`);
      setEmail('');
    } catch { toast.error('Only developers can manage the team.'); }
    setBusy(false);
  };

  const remove = async (em: string) => {
    if (!db || !confirm(`Remove ${em}'s access?`)) return;
    try { await deleteDoc(doc(db, 'admins', em)); toast.success(`${em} removed`); }
    catch { toast.error('Only developers can manage the team.'); }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <AdminNav />
      <h1 className="font-heading text-3xl font-bold mb-2">Team</h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-8">
        Admins manage the catalog and orders. Workers only see the workshop checklist at <code>/staff</code> — no prices or customer details.
      </p>

      <Card className="p-5 mb-6">
        <form onSubmit={add} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[220px]"><Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="worker@example.com" required /></div>
          <div className="w-40">
            <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as StaffDoc['role'])}>
              <option value="worker">Worker</option>
              <option value="admin">Admin</option>
              {isDeveloper && <option value="developer">Developer</option>}
            </Select>
          </div>
          <Button type="submit" loading={busy} iconLeft={<UserPlus size={16} />}>Add</Button>
        </form>
        {!isDeveloper && <p className="text-xs text-[var(--color-text-secondary)] mt-3">Note: saving requires developer rights.</p>}
      </Card>

      {staff === null ? <PageSpinner /> : (
        <div className="flex flex-col gap-2">
          {staff.map((s) => (
            <Card key={s.email} className="p-4 flex items-center gap-3">
              <Badge tone={s.role === 'worker' ? 'info' : 'gold'}>{roleIcon[s.role]}{s.role}</Badge>
              <span className="flex-1 font-medium truncate">{s.email}</span>
              {s.email !== (user.email || '').toLowerCase() && (
                <button onClick={() => remove(s.email)} aria-label={`Remove ${s.email}`} className="p-2 rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-danger,#dc2626)] hover:bg-[var(--color-surface-2)]"><Trash2 size={16} /></button>
              )}
            </Card>
          ))}
          {staff.length === 0 && <Card className="p-8 text-center text-[var(--color-text-secondary)]">No team members yet — add the first one above.</Card>}
        </div>
      )}

      <PaymentSettings toast={toast} />
    </div>
  );
};

/** InstaPay address + bank details shown to customers paying by transfer. */
const PaymentSettings: React.FC<{ toast: ReturnType<typeof useToast> }> = ({ toast }) => {
  const [instapayAddress, setInstapayAddress] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!db) return;
    getDoc(doc(db, 'settings', 'payments')).then((snap) => {
      if (snap.exists()) {
        setInstapayAddress(snap.data().instapayAddress || '');
        setBankDetails(snap.data().bankDetails || '');
      }
    }).catch(() => {});
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setBusy(true);
    try {
      await setDoc(doc(db, 'settings', 'payments'), { instapayAddress: instapayAddress.trim(), bankDetails: bankDetails.trim() }, { merge: true });
      toast.success('Payment settings saved');
    } catch { toast.error('Could not save (admin rights required).'); }
    setBusy(false);
  };

  return (
    <Card className="p-5 mt-10">
      <div className="flex items-center gap-2 mb-3"><Smartphone size={18} className="text-[var(--color-primary)]" /><h2 className="font-heading text-lg font-bold">Payment settings</h2></div>
      <p className="text-sm text-[var(--color-text-secondary)] mb-4">Shown to customers who choose InstaPay or bank transfer at checkout.</p>
      <form onSubmit={save} className="flex flex-col gap-4">
        <Input label="InstaPay address (IPA)" value={instapayAddress} onChange={(e) => setInstapayAddress(e.target.value)} placeholder="raafatfurniture@instapay" />
        <Textarea label="Bank transfer details" rows={3} value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} placeholder={'Bank name\nAccount name\nIBAN / account number'} />
        <div><Button type="submit" size="sm" loading={busy}>Save payment settings</Button></div>
      </form>
    </Card>
  );
};

export default AdminTeam;
