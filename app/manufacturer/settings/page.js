'use client';
import { useEffect, useState } from 'react';
import FodderShell from '../../../components/FodderShell';
import { useToast } from '../../../components/Toast';
import { Manufacturer, Geo } from '../../../lib/api';

const SEASONS = ['kharif','rabi','zaid','annual'];
export default function ManufacturerSettings() {
  const toast = useToast();
  const year = new Date().getFullYear();
  const [cap, setCap] = useState({ kharif:0, rabi:0, zaid:0, annual:0 });
  const [districts, setDistricts] = useState([]);
  const [sel, setSel] = useState(new Set());
  const [societyCode, setSocietyCode] = useState('');
  const [isExclusive, setIsExclusive] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await Manufacturer.settings(year);
        setCap({ ...{ kharif:0,rabi:0,zaid:0,annual:0 }, ...s.capacity });
        setSel(new Set(s.blockIds||[]));
        setSocietyCode(s.society_code || '');
        setIsExclusive(!!s.is_exclusive);
      } catch {}
      try {
        const { districts } = await Geo.districts();
        const out = [];
        for (const d of districts) { const b = await Geo.blocks(d.id); out.push({ d, blocks: b.blocks }); }
        setDistricts(out);
      } catch {}
    })();
  }, []);

  function toggle(id){ setSel(p=>{const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n;}); }

  return (
    <FodderShell role="manufacturer" title="Settings" description="Society, production capacity and delivery territory.">

      <div className="card p-6 mb-6">
        <h2 className="font-bold mb-1">Society</h2>
        <p className="text-sm text-slate-500 mb-4">Your society code and whether only its distributors may sell your products.</p>
        <div className="grid md:grid-cols-2 gap-4 items-end">
          <div>
            <div className="label">Society Code</div>
            <input className="input" maxLength={10} value={societyCode}
              onChange={e=>setSocietyCode(e.target.value.toUpperCase().slice(0,10))}
              placeholder="e.g. SANCHI" />
            <p className="text-xs text-slate-400 mt-1">Up to 10 characters. Leave blank if not part of a society.</p>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={isExclusive} onChange={e=>setIsExclusive(e.target.checked)} />
              Exclusive (only this society's distributors can sell my products)
            </label>
          </div>
        </div>
        <div className="mt-4 text-right">
          <button className="btn btn-primary" onClick={async()=>{ try{ await Manufacturer.saveSociety(societyCode, isExclusive); toast('Society saved'); }catch(e){toast(e.message);} }}>Save Society</button>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-bold mb-4">Production Capacity ({year}) — tonnes</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SEASONS.map(s => (
            <div key={s}>
              <div className="label capitalize">{s}</div>
              <input className="input text-right" type="number" min="0" value={cap[s]}
                onChange={e=>setCap(c=>({ ...c, [s]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div className="mt-4 text-right">
          <button className="btn btn-primary" onClick={async()=>{ try{ await Manufacturer.saveCapacity(year, cap); toast('Capacity saved'); }catch(e){toast(e.message);} }}>Save Capacity</button>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-bold mb-4">Delivery Territory</h2>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {districts.map(g => (
            <div key={g.d.id}>
              <div className="text-sm font-bold text-brand-deep dark:text-brand-light mb-1">{g.d.name}</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {g.blocks.map(b => (
                  <label key={b.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={sel.has(b.id)} onChange={()=>toggle(b.id)} /> {b.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right">
          <button className="btn btn-primary" onClick={async()=>{ try{ await Manufacturer.saveBlocks(Array.from(sel)); toast('Territory saved'); }catch(e){toast(e.message);} }}>Save Territory</button>
        </div>
      </div>
    </FodderShell>
  );
}
