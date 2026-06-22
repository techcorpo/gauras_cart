'use client';
import { useEffect, useState } from 'react';
import FodderShell from '../../../components/FodderShell';
import { useToast } from '../../../components/Toast';
import { Orders } from '../../../lib/api';
import { useUI } from '../../../components/Providers';

const NEXT = { placed:['confirmed','cancelled'], confirmed:['shipped','cancelled'], shipped:['delivered'], delivered:[], cancelled:[] };
const pill = s => ({placed:'bg-[#e8f1fb] text-[#32638f]',confirmed:'bg-[#e5f5eb] text-brand',shipped:'bg-[#fff4dc] text-[#9a6a12]',delivered:'bg-[#e5f5eb] text-brand',cancelled:'bg-[#fdecec] text-[#b64b4b]'}[s]||'');

export default function ManufacturerOrders() {
  const toast = useToast();
  const { t } = useUI();
  const [pos, setPos] = useState([]);
  async function load(){ try{ setPos((await Orders.manufacturerIncoming()).pos); }catch(e){toast(e.message);} }
  useEffect(()=>{ load(); },[]);
  async function setStatus(id,st){ if(st==='cancelled'&&!confirm(t('Cancel this PO?')))return; try{ await Orders.setStatus(id,st); toast(t('Marked')+' '+t(st)); load(); }catch(e){toast(e.message);} }
  async function markPaid(id){ try{ await Orders.setPayment(id,'paid'); toast(t('Marked paid')); load(); }catch(e){toast(e.message);} }

  return (
    <FodderShell role="manufacturer" title="Distributor Purchase Orders" description="Confirm, ship or deliver — status flows down to farmers automatically.">
      {pos.length===0 && <div className="card p-10 text-center text-slate-400">{t('No distributor orders yet.')}</div>}
      <div className="space-y-4">
        {pos.map(po=>(
          <div key={po.id} className="card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#eef2ef] dark:border-[#24332b] flex-wrap gap-2">
              <div>
                <div className="font-extrabold">{po.distributor_name}</div>
                <div className="text-xs text-slate-500">PO #{po.order_number} · {po.season||'—'} · {new Date(po.created_at).toLocaleDateString()}</div>
              </div>
              <div className="flex gap-2">
                <span className={`pill ${pill(po.status)}`}>{t(po.status)}</span>
                <span className={`pill ${po.payment_status==='paid'?'bg-[#e5f5eb] text-brand':'bg-[#fff4dc] text-[#9a6a12]'}`}>{t(po.payment_status)}</span>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[#fbfdfc] dark:bg-[#101a15] text-slate-500 text-xs uppercase"><tr>{['Product','Qty','Unit Price','Subtotal'].map(h=><th key={h} className="text-left p-3">{t(h)}</th>)}</tr></thead>
              <tbody>
                {(po.items||[]).map((it,i)=>(<tr key={i} className="border-t border-[#f0f3f1] dark:border-[#24332b]"><td className="p-3">{it.product_name}</td><td className="p-3">{Number(it.quantity)} {it.unit}</td><td className="p-3">₹{Number(it.unit_price).toFixed(2)}</td><td className="p-3">₹{Number(it.line_total).toFixed(2)}</td></tr>))}
              </tbody>
            </table>
            <div className="flex items-center justify-between p-4 bg-[#fbfdfc] dark:bg-[#101a15] flex-wrap gap-2">
              <span className="font-extrabold text-brand">{t('Total:')} ₹{Number(po.total_amount).toFixed(2)}</span>
              <div className="flex gap-2 flex-wrap">
                {po.payment_status!=='paid' && <button className="btn btn-secondary h-9 px-3 text-xs" onClick={()=>markPaid(po.id)}>{t('Mark Paid')}</button>}
                {(NEXT[po.status]||[]).map(st=>(
                  <button key={st} className={`h-9 px-3 text-xs rounded-lg font-bold ${st==='cancelled'?'btn-secondary text-rose-600':st==='confirmed'?'btn btn-primary':'btn btn-secondary'}`} onClick={()=>setStatus(po.id,st)}>{t(st[0].toUpperCase()+st.slice(1))}</button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </FodderShell>
  );
}
