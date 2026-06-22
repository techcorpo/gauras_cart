'use client';
import { useEffect, useState } from 'react';
import FodderShell from '../../../components/FodderShell';
import { useToast } from '../../../components/Toast';
import { useUI } from '../../../components/Providers';
import { Admin } from '../../../lib/api';

export default function AdminEarnings() {
  const toast = useToast();
  const { t } = useUI();
  const today = new Date().toISOString().slice(0,10);
  const monthAgo = new Date(Date.now()-30*864e5).toISOString().slice(0,10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [kind, setKind] = useState('both');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  async function load() {
    try { const r = await Admin.earnings({ from, to, kind }); setRows(r.rows); setTotal(r.total); }
    catch (e) { toast(e.message); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [from, to, kind]);

  return (
    <FodderShell role="admin" title="Commission Earnings" description="Platform commission captured on payment receipt.">
      <div className="card p-4 mb-4 flex flex-wrap items-end gap-4">
        <div>
          <div className="label">{t('From')}</div>
          <input type="date" className="input w-auto" value={from} onChange={e=>setFrom(e.target.value)} />
        </div>
        <div>
          <div className="label">{t('To')}</div>
          <input type="date" className="input w-auto" value={to} onChange={e=>setTo(e.target.value)} />
        </div>
        <div className="flex items-center gap-4 pb-2">
          {[['both','Both'],['merchant','Merchant'],['distributor','Distributor']].map(([v,l]) => (
            <label key={v} className="flex items-center gap-1.5 text-sm font-medium">
              <input type="radio" name="kind" checked={kind===v} onChange={()=>setKind(v)} /> {t(l)}
            </label>
          ))}
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-slate-500">{t('Total Commission')}</div>
          <div className="text-2xl font-black text-brand">₹{Number(total).toFixed(2)}</div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#fbfdfc] dark:bg-[#101a15] text-slate-500 text-xs uppercase">
            <tr>{['Name','Type','Order Date','Order Amount','Commission','Receipt Date'].map(h=><th key={h} className="text-left p-3">{t(h)}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400">{t('No records.')}</td></tr>}
            {rows.map((r,i) => (
              <tr key={i} className="border-t border-[#f0f3f1] dark:border-[#24332b]">
                <td className="p-3 font-semibold">{r.name}</td>
                <td className="p-3"><span className={`pill ${r.type==='M'?'bg-[#e8f1fb] text-[#32638f]':'bg-[#f1ebfe] text-[#6b46c1]'}`}>{r.type}</span></td>
                <td className="p-3">{new Date(r.order_date).toLocaleDateString()}</td>
                <td className="p-3">₹{Number(r.order_amount).toFixed(2)}</td>
                <td className="p-3 font-bold text-brand">₹{Number(r.commission).toFixed(2)}</td>
                <td className="p-3">{new Date(r.receipt_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FodderShell>
  );
}
