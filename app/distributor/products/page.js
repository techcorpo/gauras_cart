'use client';
import { useEffect, useState, useMemo } from 'react';
import FodderShell from '../../../components/FodderShell';
import { useToast } from '../../../components/Toast';
import { Products, Distributor } from '../../../lib/api';
import { useUI } from '../../../components/Providers';

export default function DistributorProducts() {
  const toast = useToast();
  const { t } = useUI();
  const [all, setAll] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [groupBy, setGroupBy] = useState('manufacturer');
  const [edit, setEdit] = useState(null); // { product, price, min_qty }

  async function load(){ try{ setAll((await Products.available()).products); }catch(e){toast(e.message);} }
  useEffect(()=>{ load(); },[]);
  const cats = useMemo(()=>[...new Set(all.map(p=>p.category).filter(Boolean))].sort(),[all]);

  const list = all.filter(p=>{
    if(cat && p.category!==cat) return false;
    if(!q) return true;
    return [p.name,p.catalog_name,p.category,p.sku,p.manufacturer_name].filter(Boolean).join(' ').toLowerCase().includes(q.toLowerCase());
  });
  const groups = {};
  if(groupBy!=='none'){ list.forEach(p=>{ const k=groupBy==='manufacturer'?p.manufacturer_name:(p.catalog_name||p.name); (groups[k]=groups[k]||[]).push(p); }); }

  async function save(){
    try {
      await Distributor.setProductPricing(edit.product.id, edit.price, edit.min_qty);
      toast(t('Saved')); setEdit(null); load();
    } catch(e){ toast(e.message); }
  }

  const Row = (p) => (
    <tr key={p.id} className="border-t border-[#f0f3f1] dark:border-[#24332b]">
      <td className="p-3 font-semibold">{p.name}{p.catalog_name && <span className="pill bg-brand-light text-brand ml-2">{p.catalog_name}</span>}</td>
      <td className="p-3">{p.manufacturer_name}</td><td className="p-3">{p.category||'-'}</td><td className="p-3">{p.unit}</td>
      <td className="p-3"><b className="text-brand">₹{Number(p.your_price).toFixed(2)}</b>{Number(p.your_price)<Number(p.base_price) && <span className="text-slate-400 line-through text-xs ml-2">₹{Number(p.base_price).toFixed(2)}</span>}</td>
      <td className="p-3">{Number(p.min_qty)>0 ? `${Number(p.min_qty)} ${p.unit}` : <span className="text-slate-400">{t('No limit')}</span>}</td>
      <td className="p-3"><button className="btn btn-secondary h-8 px-2 text-xs" onClick={()=>setEdit({ product:p, price:(Number(p.your_price)!==Number(p.base_price)?p.your_price:''), min_qty:(Number(p.min_qty)>0?p.min_qty:'') })}>{t('Set Price / Min')}</button></td>
    </tr>
  );

  return (
    <FodderShell role="distributor" title="Available Products" description="From your partner manufacturers, with your price.">
      <div className="flex flex-wrap gap-3 mb-4">
        <input className="input flex-1 min-w-[200px]" placeholder={t('Search e.g. wheat, gehu, urea')} value={q} onChange={e=>setQ(e.target.value)} />
        <select className="input w-auto" value={cat} onChange={e=>setCat(e.target.value)}><option value="">{t('All categories')}</option>{cats.map(c=><option key={c}>{c}</option>)}</select>
        <select className="input w-auto" value={groupBy} onChange={e=>setGroupBy(e.target.value)}>
          <option value="manufacturer">{t('Group by Manufacturer')}</option><option value="catalog">{t('Group by Product')}</option><option value="none">{t('No grouping')}</option>
        </select>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#fbfdfc] dark:bg-[#101a15] text-slate-500 text-xs uppercase">
            <tr>{['Product','Manufacturer','Category','Unit','Your Price','Min Qty','Actions'].map(h=><th key={h} className="text-left p-3">{t(h)}</th>)}</tr>
          </thead>
          <tbody>
            {list.length===0 && <tr><td colSpan={7} className="p-8 text-center text-slate-400">{t('No products found.')}</td></tr>}
            {groupBy==='none' ? list.map(Row) : Object.keys(groups).sort().map(k=>(
              <>
                <tr key={'g'+k} className="bg-[#f8fbf9] dark:bg-[#101a15]"><td colSpan={7} className="p-2 px-3 font-extrabold text-brand-deep dark:text-brand-light text-xs">{k} <span className="text-slate-400 font-semibold">({groups[k].length})</span></td></tr>
                {groups[k].map(Row)}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {edit && (
        <div className="fixed inset-0 z-[1000] bg-black/45 grid place-items-center p-4" onClick={()=>setEdit(null)}>
          <div className="card w-full max-w-md" onClick={e=>e.stopPropagation()}>
            <div className="p-4 border-b border-[#eef2ef] dark:border-[#24332b] flex justify-between">
              <h2 className="font-bold">{edit.product.name}</h2><button className="text-2xl text-slate-400" onClick={()=>setEdit(null)}>×</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <div className="label">{t('Your Price')} (₹) <span className="font-normal text-slate-400">— {t('blank = use base price')} ₹{Number(edit.product.base_price).toFixed(2)}</span></div>
                <input className="input" type="number" min="0" value={edit.price} onChange={e=>setEdit({...edit,price:e.target.value})} placeholder={`₹${Number(edit.product.base_price).toFixed(2)}`} />
              </div>
              <div>
                <div className="label">{t('Min Qty')} <span className="font-normal text-slate-400">— {t('per farmer order line; 0/blank = no limit')}</span></div>
                <input className="input" type="number" min="0" value={edit.min_qty} onChange={e=>setEdit({...edit,min_qty:e.target.value})} placeholder="0" />
              </div>
            </div>
            <div className="p-4 border-t border-[#eef2ef] dark:border-[#24332b] flex justify-end gap-2">
              <button className="btn btn-secondary" onClick={()=>setEdit(null)}>{t('Cancel')}</button>
              <button className="btn btn-primary" onClick={save}>{t('Save')}</button>
            </div>
          </div>
        </div>
      )}
    </FodderShell>
  );
}
