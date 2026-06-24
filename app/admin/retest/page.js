'use client';
import { useState } from 'react';
import FodderShell from '../../../components/FodderShell';
import { useToast } from '../../../components/Toast';
import { useUI } from '../../../components/Providers';
import { Admin } from '../../../lib/api';

const STEPS = [
  'Run db/clear-transactions.sql (optional) or use Clear Old Data below to start clean.',
  'Sign in as admin (9000000001 / Test@123) and approve pending manufacturer, distributor, and farmer.',
  'Sign in as manufacturer (9000000002 / Test@123). Settings → set society / delivery territory. Products → add a product.',
  'Sign in as distributor (9000000004 / Test@123). Settings → select service territory blocks and partner with the manufacturer. Products → set your price and min qty.',
  'Sign in as farmer (9000000007 / 1234). Shop → select district → add product to cart. Cart badge should pulse; drawer should NOT auto-open.',
  'Click the cart icon, adjust qty with +/-, then Place Order or Continue Shopping.',
  'Sign in as distributor. Orders → Farmer Orders tab → edit qty if needed → Mark Paid (enter payment method/details). Then select item and Create Purchase Order.',
  'Sign in as manufacturer. Orders → see PO → edit qty if needed → Mark Paid → Ship → create a consignment (can include multiple POs).',
  'Sign in as distributor. Consignments → view bilty → confirm only your own items appear.',
  'Sign in as admin. Earnings → set date range → Both/Merchant/Distributor → verify commission captured.',
];

export default function AdminRetest() {
  const toast = useToast();
  const { t } = useUI();
  const [open, setOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function clearData() {
    setClearing(true);
    try {
      const r = await Admin.clearTransactions();
      toast(r.message || t('Transaction data cleared'));
    } catch (e) { toast(e.message); } finally { setClearing(false); }
  }

  return (
    <FodderShell role="admin" title="Retest" description="Clear transaction data and view the full test flow.">
      <div className="card p-6">
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          Click the button below to see the 10-step test flow and optionally clear old transaction data.
        </p>
        <button onClick={() => setOpen(true)} className="btn btn-primary">
          {t('Retest')}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[1000] bg-black/45 grid place-items-center p-4" onClick={() => setOpen(false)}>
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[#eef2ef] dark:border-[#24332b] flex justify-between items-center">
              <h2 className="font-bold text-lg">{t('Full Test Flow')}</h2>
              <button className="text-2xl text-slate-400" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="p-5 space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {STEPS.map((s, i) => (
                  <li key={i} className="pl-1">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{t('Step')} {i + 1}:</span> {t(s)}
                  </li>
                ))}
              </ol>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200">
                {t('Clearing old data removes orders, order items, allocations, payments, commission ledger, consignments, and refresh tokens. Masters like users, organizations, products, and geography are kept.')}
              </div>
            </div>
            <div className="p-4 border-t border-[#eef2ef] dark:border-[#24332b] flex justify-end gap-3">
              <button onClick={clearData} disabled={clearing} className="btn btn-primary">
                {clearing ? t('Clearing…') : t('Clear Old Data')}
              </button>
              <button onClick={() => setOpen(false)} className="btn btn-secondary">
                {t('Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </FodderShell>
  );
}
