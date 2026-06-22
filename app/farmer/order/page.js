'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FodderShell from '../../../components/FodderShell';
import { useToast } from '../../../components/Toast';
import { Orders } from '../../../lib/api';

export default function FarmerOrder() {
  const toast = useToast(); const router = useRouter();
  const [dists, setDists] = useState([]);
  const [did, setDid] = useState('');
  const [season, setSeason] = useState('');
  const [products, setProducts] = useState([]);
  const [qty, setQty] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(()=>{ (async()=>{ try{ setDists((await Orders.farmerDistributors()).distributors); }catch(e){toast(e.message);} })(); },[]);
  async function pick(id){ setDid(id); setProducts([]); setQty({}); if(id){ try{ setProducts((await Orders.farmerProducts(id)).products); }catch(e){toast(e.message);} } }

  const total = products.reduce((s,p)=> s + (Number(qty[p.id])||0)*Number(p.base_price), 0);
  const canPlace = did && Object.values(qty).some(q=>Number(q)>0);

  async function place(){
    const items = products.filter(p=>Number(qty[p.id])>0).map(p=>({ product_id:p.id, quantity:Number(qty[p.id]) }));
    setBusy(true);
    try { const r = await Orders.placeFarmerOrder({ distributor_id:did, season:season||null, items }); toast('Order #'+r.order_number+' placed'); setTimeout(()=>router.replace('/farmer/dashboard'),1200); }
    catch(e){ toast(e.message); setBusy(false); }
  }

  return (
    <FodderShell role="farmer" title="Place a New Order" description="Choose a distributor serving your block, then select products.">

      <div className="card p-5 mb-5 grid md:grid-cols-2 gap-4">
        <div><div className="label">Distributor</div>
          <select className="input" value={did} onChange={e=>pick(e.target.value)}>
            <option value="">Select distributor</option>
            {dists.map(d=><option key={d.id} value={d.id}>{d.name}{d.district_name?` · ${d.district_name}`:''}</option>)}
          </select>
        </div>
        <div><div className="label">Season</div>
          <select className="input" value={season} onChange={e=>setSeason(e.target.value)}>
            <option value="">— Optional —</option>{['kharif','rabi','zaid','annual'].map(s=><option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>
      </div>

      <div className="card overflow-x-auto mb-5">
        <table className="w-full text-sm">
          <thead className="bg-[#fbfdfc] dark:bg-[#101a15] text-slate-500 text-xs uppercase">
            <tr>{['Product','Manufacturer','Unit','Price','Quantity','Subtotal'].map(h=><th key={h} className="text-left p-3">{h}</th>)}</tr>
          </thead>
          <tbody>
            {products.length===0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400">Select a distributor to see products.</td></tr>}
            {products.map(p=>(
              <tr key={p.id} className="border-t border-[#f0f3f1] dark:border-[#24332b]">
                <td className="p-3 font-semibold">{p.name}{p.catalog_name && <span className="pill bg-brand-light text-brand ml-2">{p.catalog_name}</span>}</td>
                <td className="p-3">{p.manufacturer_name}</td><td className="p-3">{p.unit}</td>
                <td className="p-3 text-brand font-bold">₹{Number(p.base_price).toFixed(2)}</td>
                <td className="p-3"><input className="input w-24 h-9 text-right" type="number" min="0" value={qty[p.id]||''} onChange={e=>setQty(q=>({...q,[p.id]:e.target.value}))} /></td>
                <td className="p-3">₹{((Number(qty[p.id])||0)*Number(p.base_price)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between items-center p-4 border-t border-[#eef2ef] dark:border-[#24332b] bg-[#fbfdfc] dark:bg-[#101a15]">
          <span>Order Total</span><span className="text-xl font-extrabold text-brand">₹{total.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-right"><button className="btn btn-primary" disabled={!canPlace||busy} onClick={place}>{busy?'Placing…':'Place Order'}</button></div>
    </FodderShell>
  );
}
