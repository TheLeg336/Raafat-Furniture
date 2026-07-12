import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Smartphone } from 'lucide-react';
import { db } from '../../lib/firebase';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { useToast } from '../ui/Toast';

/** InstaPay address + bank details + customer note shown to transfer payers.
    Rendered in both the Dev tab (next to the method toggles) and the Team page. */
export const PaymentSettings: React.FC<{ toast: ReturnType<typeof useToast>; className?: string }> = ({ toast, className = 'p-5 mt-10' }) => {
  const [instapayAddress, setInstapayAddress] = useState('');
  const [instapayNotes, setInstapayNotes] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!db) return;
    getDoc(doc(db, 'settings', 'payments')).then((snap) => {
      if (snap.exists()) {
        setInstapayAddress(snap.data().instapayAddress || '');
        setInstapayNotes(snap.data().instapayNotes || '');
        setBankDetails(snap.data().bankDetails || '');
      }
    }).catch(() => {});
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setBusy(true);
    try {
      await setDoc(doc(db, 'settings', 'payments'), {
        instapayAddress: instapayAddress.trim(),
        instapayNotes: instapayNotes.trim(),
        bankDetails: bankDetails.trim(),
      }, { merge: true });
      toast.success('Payment settings saved');
    } catch { toast.error('Could not save (admin rights required).'); }
    setBusy(false);
  };

  return (
    <Card className={className}>
      <div className="flex items-center gap-2 mb-3"><Smartphone size={18} className="text-[var(--color-primary)]" /><h2 className="font-heading text-lg font-bold">Payment settings</h2></div>
      <p className="text-sm text-[var(--color-text-secondary)] mb-4">Shown to customers who choose InstaPay or bank transfer at checkout.</p>
      <form onSubmit={save} className="flex flex-col gap-4">
        <Input
          label="InstaPay address (IPA)"
          hint="Your receiving address from the InstaPay app (Profile → My IPA). Customers transfer to it from any Egyptian bank app."
          value={instapayAddress} onChange={(e) => setInstapayAddress(e.target.value)} placeholder="raafatfurniture@instapay" />
        <Textarea
          label="InstaPay note to customers (optional)"
          hint="Extra line shown with the InstaPay instructions — e.g. transfer checking hours, or a payment link from your InstaPay app."
          rows={2} value={instapayNotes} onChange={(e) => setInstapayNotes(e.target.value)}
          placeholder="Transfers are verified daily 12 PM – 10 PM." />
        <Textarea label="Bank transfer details" rows={3} value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} placeholder={'Bank name\nAccount name\nIBAN / account number'} />
        <div><Button type="submit" size="sm" loading={busy}>Save payment settings</Button></div>
      </form>
    </Card>
  );
};

export default PaymentSettings;
