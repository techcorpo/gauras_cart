'use client';
import { useEffect, useState } from 'react';
import FodderShell from '../../../components/FodderShell';
import { useToast } from '../../../components/Toast';
import { Catalog } from '../../../lib/api';

export default function AdminCatalog() {
  const toast = useToast();
  const [tab, setTab] = useState('pending');
  const [rows, setRows] = useState([]);
  const [edit, setEdit] = useState(null);

  async function load(){ try{ setRows((await Catalog.all(tab||undefined)).items); }catch(e){toast(e.message);} }
  useEffect(()=>{ load(); /* eslint-disable-next-line */ },[tab]);

  async function act(id,a){ try{ a==='approve'?await Catalog.approve(id):await Catalog.reject(id); toast('Done'); load(); }catch(e){toast(e.message);} }
  async function del(id){ if(!confirm('Delete?'))return; try{ await Catalog.remove(id); toast('Deleted'); load(); }catch(e){toast(e.message);} }
  async function save(){ const b=edit; if(!b.canonical_name||!b.category){toast('Name & category required');return;} try{ b.id?await Catalog.update(b.id,b):await Catalog.create(b); toast('Saved'); setEdit(null); load(); }catch(e){toast(e.message);} }

  return (
    <FodderShell role="admin" title="Product Catalog" description="Curate canonical products"
      action={<button className="btn btn-primary" onClick={()=>setEdit({ default_unit:'bag' })}>+ Add Item</button>}>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['pending','active','rejected',''].map(s=>(
          <button key={s||'all'} onClick={()=>setTab(s)} className={`px-4 py-2 rounded-lg text-sm font-bold capitalize ${tab===s?'bg-brand text-white':'btn-secondary'}`}>{s||'All'}</button>
        ))}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#fbfdfc] dark:bg-[#101a15] text-slate-500 text-xs uppercase">
            <tr>{['Name','Category','Unit','Synonyms','Status','Requested By','Actions'].map(h=><th key={h} className="text-left p-3">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length===0 && <tr><td colSpan={7} className="p-8 text-center text-slate-400">No items.</td></tr>}
            {rows.map(it=>(
              <tr key={it.id} className="border-t border-[#f0f3f1] dark:border-[#24332b]">
                <td className="p-3 font-semibold">{it.canonical_name}</td><td className="p-3">{it.category}</td><td className="p-3">{it.default_unit}</td>
                <td className="p-3 text-slate-400 text-xs">{it.synonyms||'-'}</td>
                <td className="p-3"><span className={`pill ${it.status==='active'?'bg-[#e5f5eb] text-brand':it.status==='pending'?'bg-[#fff4dc] text-[#9a6a12]':'bg-[#fdecec] text-[#b64b4b]'}`}>{it.status}</span></td>
                <td className="p-3">{it.requested_by_name||'-'}</td>
                <td className="p-3 space-x-1">
                  {it.status==='pending' && <><button className="btn btn-primary h-8 px-2 text-xs" onClick={()=>act(it.id,'approve')}>Approve</button><button className="btn btn-secondary h-8 px-2 text-xs text-rose-600" onClick={()=>act(it.id,'reject')}>Reject</button></>}
                  <button className="btn btn-secondary h-8 px-2 text-xs" onClick={()=>setEdit({...it})}>Edit</button>
                  {it.status!=='pending' && <button className="btn btn-secondary h-8 px-2 text-xs text-rose-600" onClick={()=>del(it.id)}>Delete</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && (
        <div className="fixed inset-0 z-[1000] bg-black/45 grid place-items-center p-4" onClick={()=>setEdit(null)}>
          <div className="card w-full max-w-md" onClick={e=>e.stopPropagation()}>
            <div className="p-4 border-b border-[#eef2ef] dark:border-[#24332b] flex justify-between"><h2 className="font-bold">{edit.id?'Edit':'Add'} Catalog Item</h2><button className="text-2xl text-slate-400" onClick={()=>setEdit(null)}>×</button></div>
            <div className="p-5 space-y-3">
              <div><div className="label">Canonical Name</div><input className="input" value={edit.canonical_name||''} onChange={e=>setEdit({...edit,canonical_name:e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><div className="label">Category</div><input className="input" value={edit.category||''} onChange={e=>setEdit({...edit,category:e.target.value})} /></div>
                <div><div className="label">Default Unit</div><input className="input" value={edit.default_unit||''} onChange={e=>setEdit({...edit,default_unit:e.target.value})} /></div>
              </div>
              <div><div className="label">Synonyms (comma separated)</div><textarea className="input h-20 py-2" value={edit.synonyms||''} onChange={e=>setEdit({...edit,synonyms:e.target.value})} placeholder="wheat, gehu, गेहूँ" /></div>
            </div>
            <div className="p-4 border-t border-[#eef2ef] dark:border-[#24332b] flex justify-end gap-2"><button className="btn btn-secondary" onClick={()=>setEdit(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></div>
          </div>
        </div>
      )}
    </FodderShell>
  );
}
