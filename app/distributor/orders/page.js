'use client';
import { useEffect, useState } from 'react';
import FodderShell from '../../../components/FodderShell';
import { useToast } from '../../../components/Toast';
import { Orders } from '../../../lib/api';

const pill = s => ({placed:'bg-[#e8f1fb] text-[#32638f]',confirmed:'bg-[#e5f5eb] text-brand',shipped:'bg-[#fff4dc] text-[#9a6a12]',delivered:'bg-[#e5f5eb] text-brand',cancelled:'bg-[#fdecec] text-[#b64b4b]'}[s]||'bg-slate-100 text-slate-600');

export default function DistributorOrders() {
  const toast = useToast();
  const [tab, setTab] = useState('incoming');
  const [items, setItems] = useState([]);
  const [pos, setPos] = useState([]);
  const [sel, setSel] = useState(new Set());

  async function loadIncoming(){ try{ setItems((await Orders.incoming()).items); setSel(new Set()); }catch(e){toast(e.message);} }
  async function loadPos(){ try{ setPos((await Orders.distributorPos()).pos); }catch(e){toast(e.message);} }
  useEffect(()=>{ tab==='incoming'?loadIncoming():loadPos(); /* eslint-disable-next-line */ },[tab]);

  const selArr = [...sel].map(id=>items.find(i=>i.order_item_id===id)).filter(Boolean);
  const mfrs = new Set(selArr.map(i=>i.manufacturer_id));
  const canAgg = sel.size>0 && mfrs.size===1;

  function toggle(it){ if(it.aggregated_into) return; setSel(p=>{const n=new Set(p); n.has(it.order_item_id)?n.delete(it.order_item_id):n.add(it.order_item_id); return n;}); }

  async function aggregate(){
    const mfr=[...mfrs][0]; const ids=[...sel];
    try{ const r=await Orders.aggregate({ manufacturer_id:mfr, order_item_ids:ids }); toast('PO #'+r.order_number+' created'); loadIncoming(); }catch(e){toast(e.message);}
  }
  async function markPaid(orderId){ try{ await Orders.setPayment(orderId,'paid'); toast('Marked paid'); loadIncoming(); }catch(e){toast(e.message);} }

  return (
    <FodderShell role="distributor" title="Orders" description="Aggregate farmer demand into purchase orders.">
      <div className="flex gap-2 mb-4">
        {[['incoming','Farmer Orders'],['pos','My Purchase Orders']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} className={`px-4 py-2 rounded-lg text-sm font-bold ${tab===k?'bg-brand text-white':'btn-secondary'}`}>{l}</button>
        ))}
      </div>

      {tab==='incoming' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#fbfdfc] dark:bg-[#101a15] text-slate-500 text-xs uppercase">
              <tr>{['','Farmer','Block','Product','Manufacturer','Qty','Status','Farmer Payment'].map((h,i)=><th key={i} className="text-left p-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {items.length===0 && <tr><td colSpan={8} className="p-8 text-center text-slate-400">No farmer orders yet.</td></tr>}
              {items.map(it=>(
                <tr key={it.order_item_id} className="border-t border-[#f0f3f1] dark:border-[#24332b]">
                  <td className="p-3">{it.aggregated_into ? <span className="pill bg-[#e5f5eb] text-brand">in PO</span> : <input type="checkbox" checked={sel.has(it.order_item_id)} onChange={()=>toggle(it)} />}</td>
                  <td className="p-3">{it.farmer_name}</td><td className="p-3">{it.block_name||'-'}</td>
                  <td className="p-3 font-semibold">{it.product_name}</td><td className="p-3">{it.manufacturer_name}</td>
                  <td className="p-3">{Number(it.quantity)} {it.unit}</td>
                  <td className="p-3">{it.aggregated_into?<span className="pill bg-[#e5f5eb] text-brand">aggregated</span>:<span className="pill bg-[#fff4dc] text-[#9a6a12]">pending</span>}</td>
                  <td className="p-3">{it.order_payment==='paid'?<span className="pill bg-[#e5f5eb] text-brand">paid</span>:<><span className="pill bg-[#fff4dc] text-[#9a6a12] mr-2">pending</span><button className="btn btn-secondary h-7 px-2 text-xs" onClick={()=>markPaid(it.order_id)}>Mark Paid</button></>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-3 p-4 border-t border-[#eef2ef] dark:border-[#24332b] bg-[#fbfdfc] dark:bg-[#101a15] flex-wrap">
            <span className="text-xs text-slate-500">Select items from <b>one manufacturer</b>, then:</span>
            <button className="btn btn-primary" disabled={!canAgg} onClick={aggregate}>Create Purchase Order →</button>
            {sel.size>0 && <span className={`text-xs font-bold ${mfrs.size>1?'text-rose-600':'text-brand'}`}>{mfrs.size>1?'⚠ One manufacturer only':sel.size+' selected'}</span>}
          </div>
        </div>
      )}

      {tab==='pos' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#fbfdfc] dark:bg-[#101a15] text-slate-500 text-xs uppercase">
              <tr>{['PO #','Manufacturer','Season','Total','Status','Payment','Date'].map(h=><th key={h} className="text-left p-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {pos.length===0 && <tr><td colSpan={7} className="p-8 text-center text-slate-400">No purchase orders yet.</td></tr>}
              {pos.map(p=>(
                <tr key={p.id} className="border-t border-[#f0f3f1] dark:border-[#24332b]">
                  <td className="p-3">#{p.order_number}</td><td className="p-3">{p.manufacturer_name}</td><td className="p-3">{p.season||'-'}</td>
                  <td className="p-3">₹{Number(p.total_amount).toFixed(2)}</td>
                  <td className="p-3"><span className={`pill ${pill(p.status)}`}>{p.status}</span></td>
                  <td className="p-3"><span className={`pill ${p.payment_status==='paid'?'bg-[#e5f5eb] text-brand':'bg-[#fff4dc] text-[#9a6a12]'}`}>{p.payment_status}</span></td>
                  <td className="p-3">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </FodderShell>
  );
}
