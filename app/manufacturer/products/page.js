'use client';
import { useEffect, useState } from 'react';
import FodderShell from '../../../components/FodderShell';
import { useToast } from '../../../components/Toast';
import { Products, Catalog } from '../../../lib/api';

export default function ManufacturerProducts() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [edit, setEdit] = useState(null);   // product being edited or {} for new
  const [pricing, setPricing] = useState(null); // { product, list }
  const [catQ, setCatQ] = useState('');
  const [catResults, setCatResults] = useState([]);

  async function load(){ try { setRows((await Products.mine()).products); } catch(e){ toast(e.message); } }
  useEffect(()=>{ load(); }, []);

  async function searchCat(q){ setCatQ(q); if(!q){setCatResults([]);return;} try { setCatResults((await Catalog.search(q)).items); } catch{} }

  async function save(){
    const b = edit;
    if(!b.sku || !b.name || b.base_price===''||b.base_price==null){ toast('SKU, name, base price required'); return; }
    try { if(b.id) await Products.update(b.id,b); else await Products.create(b); toast('Saved'); setEdit(null); load(); }
    catch(e){ toast(e.message); }
  }
  async function del(id){ if(!confirm('Delete product?'))return; try{ await Products.remove(id); toast('Deleted'); load(); }catch(e){toast(e.message);} }

  async function openPricing(p){ try { const d = await Products.pricing(p.id); setPricing({ product:d.product, list:d.pricing }); }catch(e){toast(e.message);} }
  async function savePricing(){
    const prices = pricing.list.map(r=>({ distributor_id:r.distributor_id, price:(r.price===''||r.price==null)?null:Number(r.price) }));
    try { await Products.savePricing(pricing.product.id, prices); toast('Pricing saved'); setPricing(null);}catch(e){toast(e.message);}
  }

  return (
    <FodderShell role="manufacturer" title="Products" description="Your products and per-distributor pricing"
      action={<button className="btn btn-primary" onClick={()=>{setEdit({ unit:'bag', is_active:true });setCatResults([]);setCatQ('');}}>+ Add Product</button>}>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#fbfdfc] dark:bg-[#101a15] text-slate-500 text-xs uppercase">
            <tr>{['SKU','Name','Category','Unit','Base Price','Status','Actions'].map(h=><th key={h} className="text-left p-3">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length===0 && <tr><td colSpan={7} className="p-8 text-center text-slate-400">No products yet.</td></tr>}
            {rows.map(p=>(
              <tr key={p.id} className="border-t border-[#f0f3f1] dark:border-[#24332b]">
                <td className="p-3">{p.sku}</td>
                <td className="p-3 font-semibold">{p.name}{p.catalog_name && <span className="pill bg-brand-light text-brand ml-2">{p.catalog_name}</span>}</td>
                <td className="p-3">{p.category||'-'}</td><td className="p-3">{p.unit}</td>
                <td className="p-3">₹{Number(p.base_price).toFixed(2)}</td>
                <td className="p-3"><span className={`pill ${p.is_active?'bg-[#e5f5eb] text-brand':'bg-[#fdecec] text-[#b64b4b]'}`}>{p.is_active?'Active':'Inactive'}</span></td>
                <td className="p-3 space-x-1">
                  <button className="btn btn-secondary h-8 px-2 text-xs" onClick={()=>{setEdit({...p});setCatResults([]);setCatQ('');}}>Edit</button>
                  <button className="btn btn-secondary h-8 px-2 text-xs" onClick={()=>openPricing(p)}>Pricing</button>
                  <button className="btn btn-secondary h-8 px-2 text-xs text-rose-600 border-rose-200" onClick={()=>del(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && (
        <Modal title={edit.id?'Edit Product':'Add Product'} onClose={()=>setEdit(null)} onSave={save}>
          <div className="space-y-3">
            <div>
              <div className="label">Catalog Product <span className="font-normal text-slate-400">(standardizes search)</span></div>
              <input className="input" placeholder="Search e.g. wheat, gehu, urea" value={catQ} onChange={e=>searchCat(e.target.value)} />
              {edit.catalog_name && <p className="text-xs text-brand mt-1">Linked: {edit.catalog_name}</p>}
              {catResults.length>0 && (
                <div className="border border-[#e0e8e3] dark:border-[#2c4034] rounded-lg mt-1 max-h-40 overflow-y-auto">
                  {catResults.map(it=>(
                    <button key={it.id} type="button" className="block w-full text-left px-3 py-2 text-sm hover:bg-brand-light/60"
                      onClick={()=>{ setEdit(e=>({...e, catalog_product_id:it.id, catalog_name:it.canonical_name, category:e.category||it.category, unit:e.unit||it.default_unit })); setCatResults([]); setCatQ(''); }}>
                      <b>{it.canonical_name}</b> <span className="text-slate-400">· {it.category}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Inp label="SKU" v={edit.sku} on={v=>setEdit({...edit,sku:v})} />
              <Inp label="Unit" v={edit.unit} on={v=>setEdit({...edit,unit:v})} />
            </div>
            <Inp label="Name" v={edit.name} on={v=>setEdit({...edit,name:v})} />
            <div className="grid grid-cols-2 gap-3">
              <Inp label="Category" v={edit.category} on={v=>setEdit({...edit,category:v})} />
              <Inp label="Base Price (₹)" type="number" v={edit.base_price} on={v=>setEdit({...edit,base_price:v})} />
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!edit.is_active} onChange={e=>setEdit({...edit,is_active:e.target.checked})} /> Active (visible to distributors)</label>
          </div>
        </Modal>
      )}

      {pricing && (
        <Modal title={'Pricing — '+pricing.product.name} onClose={()=>setPricing(null)} onSave={savePricing}>
          <p className="text-xs text-slate-500 mb-3">Leave blank to use base price (₹{Number(pricing.product.base_price).toFixed(2)}).</p>
          {pricing.list.length===0 && <p className="text-sm text-slate-400">No partner distributors yet.</p>}
          <div className="space-y-3">
            {pricing.list.map((r,i)=>(
              <div key={r.distributor_id}>
                <div className="label">{r.distributor_name}</div>
                <input className="input" type="number" min="0" placeholder={'Base ₹'+Number(pricing.product.base_price).toFixed(2)}
                  value={r.price==null?'':r.price}
                  onChange={e=>{ const v=e.target.value; setPricing(p=>{ const list=[...p.list]; list[i]={...list[i],price:v}; return {...p,list}; }); }} />
              </div>
            ))}
          </div>
        </Modal>
      )}
    </FodderShell>
  );
}
function Inp({label,v,on,type='text'}){ return <div><div className="label">{label}</div><input className="input" type={type} value={v??''} onChange={e=>on(e.target.value)} /></div>; }
function Modal({title,children,onClose,onSave}){
  return (
    <div className="fixed inset-0 z-[1000] bg-black/45 grid place-items-center p-4" onClick={onClose}>
      <div className="card w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="p-4 border-b border-[#eef2ef] dark:border-[#24332b] flex justify-between items-center">
          <h2 className="font-bold">{title}</h2><button onClick={onClose} className="text-2xl text-slate-400">×</button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
        <div className="p-4 border-t border-[#eef2ef] dark:border-[#24332b] flex justify-end gap-2">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
