'use client';
import { useEffect, useState, useMemo } from 'react';
import FodderShell from '../../../components/FodderShell';
import { useToast } from '../../../components/Toast';
import { Products } from '../../../lib/api';
import { useUI } from '../../../components/Providers';

export default function DistributorProducts() {
  const toast = useToast();
  const { t } = useUI();
  const [all, setAll] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [groupBy, setGroupBy] = useState('manufacturer');

  useEffect(()=>{ (async()=>{ try{ setAll((await Products.available()).products); }catch(e){toast(e.message);} })(); },[]);
  const cats = useMemo(()=>[...new Set(all.map(p=>p.category).filter(Boolean))].sort(),[all]);

  const list = all.filter(p=>{
    if(cat && p.category!==cat) return false;
    if(!q) return true;
    return [p.name,p.catalog_name,p.category,p.sku,p.manufacturer_name].filter(Boolean).join(' ').toLowerCase().includes(q.toLowerCase());
  });
  const groups = {};
  if(groupBy!=='none'){ list.forEach(p=>{ const k=groupBy==='manufacturer'?p.manufacturer_name:(p.catalog_name||p.name); (groups[k]=groups[k]||[]).push(p); }); }

  const Row = (p) => (
    <tr key={p.id} className="border-t border-[#f0f3f1] dark:border-[#24332b]">
      <td className="p-3 font-semibold">{p.name}{p.catalog_name && <span className="pill bg-brand-light text-brand ml-2">{p.catalog_name}</span>}</td>
      <td className="p-3">{p.manufacturer_name}</td><td className="p-3">{p.category||'-'}</td><td className="p-3">{p.unit}</td>
      <td className="p-3"><b className="text-brand">₹{Number(p.your_price).toFixed(2)}</b>{Number(p.your_price)<Number(p.base_price) && <span className="text-slate-400 line-through text-xs ml-2">₹{Number(p.base_price).toFixed(2)}</span>}</td>
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
            <tr>{['Product','Manufacturer','Category','Unit','Your Price'].map(h=><th key={h} className="text-left p-3">{t(h)}</th>)}</tr>
          </thead>
          <tbody>
            {list.length===0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">{t('No products found.')}</td></tr>}
            {groupBy==='none' ? list.map(Row) : Object.keys(groups).sort().map(k=>(
              <>
                <tr key={'g'+k} className="bg-[#f8fbf9] dark:bg-[#101a15]"><td colSpan={5} className="p-2 px-3 font-extrabold text-brand-deep dark:text-brand-light text-xs">{k} <span className="text-slate-400 font-semibold">({groups[k].length})</span></td></tr>
                {groups[k].map(Row)}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </FodderShell>
  );
}
