'use client';
import { useEffect, useState } from 'react';
import FodderShell from './FodderShell';
import { useToast } from './Toast';
import { useUI } from './Providers';
import { Admin, Geo } from '../lib/api';

// Shared admin list for manufacturer | distributor | farmer.
// Top: name textbox (works even without district) + district dropdown
// (+ block dropdown, disabled for manufacturer). List shows when name typed
// OR district selected. Right column lets admin edit the controlled value.
export default function StakeholderList({ role, title }) {
  const toast = useToast();
  const { t } = useUI();
  const [q, setQ] = useState('');
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [districtId, setDistrictId] = useState('');
  const [blockId, setBlockId] = useState('');
  const [rows, setRows] = useState([]);
  const [edit, setEdit] = useState(null);

  const blockDisabled = role === 'manufacturer';

  useEffect(() => { Geo.districts().then(d => setDistricts(d.districts || [])).catch(()=>{}); }, []);

  async function onDistrict(id) {
    setDistrictId(id); setBlockId('');
    if (id && !blockDisabled) { try { setBlocks((await Geo.blocks(id)).blocks); } catch { setBlocks([]); } }
    else setBlocks([]);
  }

  async function load() {
    if (!q && !districtId) { setRows([]); return; }
    try {
      const r = await Admin.stakeholders(role, { q: q || undefined, district_id: districtId || undefined, block_id: blockId || undefined });
      setRows(r.rows);
    } catch (e) { toast(e.message); }
  }
  useEffect(() => { const id = setTimeout(load, 250); return () => clearTimeout(id); /* eslint-disable-next-line */ }, [q, districtId, blockId]);

  async function saveCommission() {
    try { await Admin.setCommission(edit.id, edit.commission_kind || 'pct', edit.commission_value || 0); toast(t('Saved')); setEdit(null); load(); }
    catch (e) { toast(e.message); }
  }
  async function toggleMerchant(u) {
    try { await Admin.setMerchantBuying(u.id, !u.allow_merchant_buying); load(); } catch (e) { toast(e.message); }
  }

  return (
    <FodderShell role="admin" title={title} description={t('Select a district (or type a name) to view records.')}>
      <div className="flex flex-wrap gap-3 mb-4">
        <input className="input flex-1 min-w-[200px]" placeholder={t('Search by name…')} value={q} onChange={e=>setQ(e.target.value)} />
        <select className="input w-auto" value={districtId} onChange={e=>onDistrict(e.target.value)}>
          <option value="">{t('Select District')}</option>
          {districts.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
        </select>
        <select className="input w-auto" value={blockId} onChange={e=>setBlockId(e.target.value)} disabled={blockDisabled || !districtId}>
          <option value="">{blockDisabled ? t('— Block N/A —') : t('All Blocks')}</option>
          {blocks.map(b => <option key={b.id} value={String(b.id)}>{b.name}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#fbfdfc] dark:bg-[#101a15] text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left p-3">{t('Name')}</th>
              {role === 'farmer' && <th className="text-left p-3">{t('Phone')}</th>}
              <th className="text-left p-3">{t('District')}</th>
              {role === 'farmer'
                ? <><th className="text-left p-3">{t('Block')}</th><th className="text-left p-3">{t('Direct Buy')}</th></>
                : <><th className="text-left p-3">{t('Commission')}</th><th className="text-left p-3">{t('Actions')}</th></>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-400">{(!q && !districtId) ? t('Select a district (or type a name) to view records.') : t('No records.')}</td></tr>}
            {rows.map(r => (
              <tr key={r.id} className="border-t border-[#f0f3f1] dark:border-[#24332b]">
                <td className="p-3 font-semibold">{r.name}</td>
                {role === 'farmer' && <td className="p-3">{r.phone}</td>}
                <td className="p-3">{r.district_name || '-'}</td>
                {role === 'farmer' ? (
                  <>
                    <td className="p-3">{r.block_name || '-'}</td>
                    <td className="p-3">
                      <button onClick={()=>toggleMerchant(r)} className={`btn h-8 px-3 text-xs ${r.allow_merchant_buying ? 'btn-primary' : 'btn-secondary'}`}>
                        {r.allow_merchant_buying ? t('Direct buy: ON') : t('Direct buy: OFF')}
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3">
                      {r.commission_value != null
                        ? (r.commission_kind === 'pct' ? `${Number(r.commission_value)}%` : `₹${Number(r.commission_value)}`)
                        : <span className="text-slate-400">{t('Not set')}</span>}
                    </td>
                    <td className="p-3">
                      <button className="btn btn-secondary h-8 px-3 text-xs" onClick={()=>setEdit({ id:r.id, name:r.name, commission_kind:r.commission_kind||'pct', commission_value:r.commission_value!=null?r.commission_value:'' })}>{t('Set Commission')}</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && (
        <div className="fixed inset-0 z-[1000] bg-black/45 grid place-items-center p-4" onClick={()=>setEdit(null)}>
          <div className="card w-full max-w-md" onClick={e=>e.stopPropagation()}>
            <div className="p-4 border-b border-[#eef2ef] dark:border-[#24332b] flex justify-between">
              <h2 className="font-bold">{t('Commission')} — {edit.name}</h2>
              <button className="text-2xl text-slate-400" onClick={()=>setEdit(null)}>×</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <div className="label">{t('Type')}</div>
                <select className="input" value={edit.commission_kind} onChange={e=>setEdit({...edit, commission_kind:e.target.value})}>
                  <option value="pct">{t('Percent of order (%)')}</option>
                  <option value="fixed">{t('Fixed per order (₹)')}</option>
                </select>
              </div>
              <div>
                <div className="label">{edit.commission_kind === 'pct' ? t('Percent (%)') : t('Amount (₹)')}</div>
                <input className="input" type="number" min="0" step="0.01" value={edit.commission_value} onChange={e=>setEdit({...edit, commission_value:e.target.value})} placeholder="0" />
              </div>
            </div>
            <div className="p-4 border-t border-[#eef2ef] dark:border-[#24332b] flex justify-end gap-2">
              <button className="btn btn-secondary" onClick={()=>setEdit(null)}>{t('Cancel')}</button>
              <button className="btn btn-primary" onClick={saveCommission}>{t('Save')}</button>
            </div>
          </div>
        </div>
      )}
    </FodderShell>
  );
}
