'use client';
import { useState } from 'react';
import { useUI } from './Providers';

const METHODS = ['cash','online','upi','cheque','neft','rtgs','bank_deposit'];
const METHOD_LABEL = { cash:'Cash', online:'Online', upi:'UPI', cheque:'Cheque', neft:'NEFT', rtgs:'RTGS', bank_deposit:'Bank Deposit' };

export default function PaymentModal({ order, onClose, onSubmit }) {
  const { t } = useUI();
  const [form, setForm] = useState({ method: 'cash', bank_name: '', cheque_no: '', reference_no: '', account_no: '', paid_on: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const needsBank = ['cheque','neft','rtgs','bank_deposit'].includes(form.method);
  const needsRef = ['online','upi','neft','rtgs','bank_deposit'].includes(form.method);
  const needsCheque = form.method === 'cheque';

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try { await onSubmit(form); onClose(); } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/45 grid place-items-center p-4" onClick={onClose}>
      <div className="card w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-[#eef2ef] dark:border-[#24332b] flex justify-between">
          <h2 className="font-bold">{t('Mark Paid')}</h2>
          <button className="text-2xl text-slate-400" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div>
            <div className="label">{t('Method')}</div>
            <select className="input" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
              {METHODS.map(m => <option key={m} value={m}>{t(METHOD_LABEL[m])}</option>)}
            </select>
          </div>
          {needsBank && (
            <div>
              <div className="label">{t('Bank Name')}</div>
              <input className="input" value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} placeholder={t('Bank Name')} />
            </div>
          )}
          {needsCheque && (
            <div>
              <div className="label">{t('Cheque No')}</div>
              <input className="input" value={form.cheque_no} onChange={e => setForm({ ...form, cheque_no: e.target.value })} placeholder={t('Cheque No')} />
            </div>
          )}
          {needsRef && (
            <div>
              <div className="label">{t('Reference No / UTR')}</div>
              <input className="input" value={form.reference_no} onChange={e => setForm({ ...form, reference_no: e.target.value })} placeholder={t('Reference No / UTR')} />
            </div>
          )}
          {needsRef && (
            <div>
              <div className="label">{t('Account No')}</div>
              <input className="input" value={form.account_no} onChange={e => setForm({ ...form, account_no: e.target.value })} placeholder={t('Account No')} />
            </div>
          )}
          <div>
            <div className="label">{t('Paid On')}</div>
            <input className="input" type="date" value={form.paid_on} onChange={e => setForm({ ...form, paid_on: e.target.value })} />
          </div>
          <div>
            <div className="label">{t('Notes')}</div>
            <textarea className="input h-20 py-2" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder={t('Notes')} />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('Cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t('Saving…') : t('Mark Paid')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
