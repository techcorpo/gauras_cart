'use client';
import { useEffect, useState } from 'react';
import FodderShell from '../../../components/FodderShell';
import { useToast } from '../../../components/Toast';
import { Distributor, Geo } from '../../../lib/api';

export default function DistributorSettings() {
  const toast = useToast();
  const [districts, setDistricts] = useState([]);
  const [mfrs, setMfrs] = useState([]);
  const [selB, setSelB] = useState(new Set());
  const [selM, setSelM] = useState(new Set());
  const [society, setSociety] = useState(null);
  const [exclusive, setExclusive] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await Distributor.settings();
        setSelB(new Set(s.blockIds||[])); setSelM(new Set(s.manufacturerIds||[])); setMfrs(s.manufacturers||[]);
        setSociety(s.society_code||null); setExclusive(!!s.exclusive);
      } catch {}
      try {
        const { districts } = await Geo.districts();
        const out=[]; for (const d of districts){ const b=await Geo.blocks(d.id); out.push({ d, blocks:b.blocks }); }
        setDistricts(out);
      } catch {}
    })();
  }, []);
  const tog = (set,fn)=>(id)=>fn(p=>{const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n;});

  return (
    <FodderShell role="distributor" title="Settings" description="Service territory and manufacturer partners.">

      <div className="card p-6 mb-6">
        <h2 className="font-bold mb-4">Service Territory</h2>
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {districts.map(g => (
            <div key={g.d.id}>
              <div className="text-sm font-bold text-brand-deep dark:text-brand-light mb-1">{g.d.name}</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {g.blocks.map(b => <label key={b.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selB.has(b.id)} onChange={()=>tog(selB,setSelB)(b.id)} /> {b.name}</label>)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right"><button className="btn btn-primary" onClick={async()=>{try{await Distributor.saveBlocks(Array.from(selB));toast('Territory saved');}catch(e){toast(e.message);}}}>Save Territory</button></div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <h2 className="font-bold">Manufacturer Partners</h2>
          {society && <span className="text-xs font-semibold bg-brand-light dark:bg-[#1c2a22] text-brand px-2.5 py-1 rounded-full">Society: {society}</span>}
        </div>
        {exclusive ? (
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
            Your society <strong>{society}</strong> is exclusive — you can only partner with <strong>{society}</strong> manufacturers, shown below.
          </p>
        ) : (
          <p className="text-sm text-slate-500 mb-4">Select the manufacturers you buy from.</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {mfrs.map(m => <label key={m.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selM.has(m.id)} onChange={()=>tog(selM,setSelM)(m.id)} /> {m.name} {m.district_name && <span className="text-slate-400">· {m.district_name}</span>}</label>)}
          {mfrs.length===0 && <p className="text-sm text-slate-400">No manufacturers available.</p>}
        </div>
        <div className="mt-4 text-right"><button className="btn btn-primary" onClick={async()=>{try{await Distributor.saveManufacturers(Array.from(selM));toast('Partners saved');}catch(e){toast(e.message);}}}>Save Partners</button></div>
      </div>
    </FodderShell>
  );
}
