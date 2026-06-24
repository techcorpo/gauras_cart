'use client';
import { useEffect, useState } from 'react';
import FodderShell from '../../../components/FodderShell';
import { useToast } from '../../../components/Toast';
import { Consignments } from '../../../lib/api';
import { useUI } from '../../../components/Providers';

export default function ManufacturerConsignments() {
  const toast = useToast();
  const { t } = useUI();
  const [rows, setRows] = useState([]);
  const [detail, setDetail] = useState(null);
  async function load(){ try{ setRows((await Consignments.list()).consignments); }catch(e){toast(e.message);} }
  useEffect(()=>{ load(); },[]);
  async function view(id){ try{ setDetail(await Consignments.get(id)); }catch(e){toast(e.message);} }

  return (
    <FodderShell role="manufacturer" title="Bilty / Consignments" description="View and print shipment consignments.">
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#fbfdfc] dark:bg-[#101a15] text-slate-500 text-xs uppercase">
            <tr>{['Consignment No','Date','Orders','Driver','Vehicle','Actions'].map(h=><th key={h} className="text-left p-3">{t(h)}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length===0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400">{t('No consignments yet.')}</td></tr>}
            {rows.map(c=>(
              <tr key={c.id} className="border-t border-[#f0f3f1] dark:border-[#24332b]">
                <td className="p-3 font-bold">{c.consignment_no}</td>
                <td className="p-3">{new Date(c.shipped_on).toLocaleDateString()}</td>
                <td className="p-3">{c.order_count}</td>
                <td className="p-3">{c.driver_name||'-'}</td>
                <td className="p-3">{c.vehicle_no||'-'}</td>
                <td className="p-3"><button className="btn btn-secondary h-8 px-3 text-xs" onClick={()=>view(c.id)}>{t('View')}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="fixed inset-0 z-[1000] bg-black/45 grid place-items-center p-4" onClick={()=>setDetail(null)}>
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="p-4 border-b border-[#eef2ef] dark:border-[#24332b] flex justify-between">
              <h2 className="font-bold">{t('Bilty')} #{detail.consignment.consignment_no}</h2>
              <button className="text-2xl text-slate-400" onClick={()=>setDetail(null)}>×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">{t('Manufacturer')}:</span> {detail.consignment.manufacturer_name}</div>
                <div><span className="text-slate-500">{t('Date')}:</span> {new Date(detail.consignment.shipped_on).toLocaleDateString()}</div>
                <div><span className="text-slate-500">{t('Driver')}:</span> {detail.consignment.driver_name||'-'}</div>
                <div><span className="text-slate-500">{t('Vehicle')}:</span> {detail.consignment.vehicle_no||'-'}</div>
              </div>
              {detail.consignment.notes && <div className="text-sm"><span className="text-slate-500">{t('Notes')}:</span> {detail.consignment.notes}</div>}
              <div className="space-y-3">
                {detail.orders.map(o=> (
                  <div key={o.id} className="border border-[#e4ece7] dark:border-[#24332b] rounded-lg p-3">
                    <div className="font-bold text-sm mb-2">PO #{o.order_number} · {o.buyer_name}</div>
                    <table className="w-full text-sm">
                      <thead className="text-slate-500 text-xs uppercase"><tr>{['Product','Qty','Unit Price','Subtotal'].map(h=><th key={h} className="text-left p-2">{t(h)}</th>)}</tr></thead>
                      <tbody>
                        {(o.items||[]).map((it,i)=>(<tr key={i} className="border-t border-[#f0f3f1] dark:border-[#24332b]"><td className="p-2">{it.product_name}</td><td className="p-2">{Number(it.quantity)} {it.unit}</td><td className="p-2">₹{Number(it.unit_price).toFixed(2)}</td><td className="p-2">₹{Number(it.line_total).toFixed(2)}</td></tr>))}
                      </tbody>
                    </table>
                    <div className="text-right text-sm font-bold mt-2">{t('Total:')} ₹{Number(o.total_amount).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-[#eef2ef] dark:border-[#24332b] flex justify-end">
              <button className="btn btn-primary" onClick={()=>window.print()}>{t('Print')}</button>
            </div>
          </div>
        </div>
      )}
    </FodderShell>
  );
}
