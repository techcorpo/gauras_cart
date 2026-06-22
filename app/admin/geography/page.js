'use client';
import { useEffect, useState } from 'react';
import FodderShell from '../../../components/FodderShell';
import { useToast } from '../../../components/Toast';
import { useUI } from '../../../components/Providers';
import { apiFetch } from '../../../lib/api';

export default function AdminGeography() {
  const toast = useToast();
  const { t } = useUI();
  const [tab, setTab] = useState('states');
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [stateId, setStateId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [edit, setEdit] = useState(null);
  const [loading, setLoading] = useState(false);

  async function loadStates() { try { setStates((await apiFetch('/admin/geo/states', { auth: true })).states); } catch (e) { toast(e.message); } }
  async function loadDistricts() { try { setDistricts((await apiFetch('/admin/geo/districts', { auth: true })).districts); } catch (e) { toast(e.message); } }
  async function loadBlocks() { try { setBlocks((await apiFetch('/admin/geo/blocks', { auth: true })).blocks); } catch (e) { toast(e.message); } }

  async function load() { setLoading(true); await loadStates(); await loadDistricts(); await loadBlocks(); setLoading(false); }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function startAdd() {
    if (tab === 'states') setEdit({ kind: 'state', name: '', code: '' });
    if (tab === 'districts') setEdit({ kind: 'district', name: '', state_id: stateId || '' });
    if (tab === 'blocks') setEdit({ kind: 'block', name: '', district_id: districtId || '' });
  }

  function startEdit(item) {
    if (tab === 'states') setEdit({ kind: 'state', id: item.id, name: item.name, code: item.code || '' });
    if (tab === 'districts') setEdit({ kind: 'district', id: item.id, name: item.name, state_id: item.state_id });
    if (tab === 'blocks') setEdit({ kind: 'block', id: item.id, name: item.name, district_id: item.district_id });
  }

  async function save() {
    if (!edit?.name?.trim()) { toast(t('Name is required')); return; }
    try {
      const path = `/admin/geo/${edit.kind}s`;
      const method = edit.id ? 'PUT' : 'POST';
      const body = { ...edit };
      await apiFetch(path, { method, auth: true, body });
      toast(t(edit.id ? 'Saved' : 'Added'));
      setEdit(null);
      load();
    } catch (e) { toast(e.message); }
  }

  async function remove(id, label) {
    if (!confirm(t('Delete?') + ' ' + label)) return;
    try {
      await apiFetch(`/admin/geo/${tab.slice(0, -1)}s?id=${id}`, { method: 'DELETE', auth: true });
      toast(t('Deleted'));
      load();
    } catch (e) { toast(e.message); }
  }

  const filteredDistricts = stateId ? districts.filter(d => String(d.state_id) === String(stateId)) : districts;
  const filteredBlocks = districtId ? blocks.filter(b => String(b.district_id) === String(districtId)) : blocks;

  return (
    <FodderShell role="admin" title="Geography" description="Manage states, districts and blocks." action={<button className="btn btn-primary" onClick={startAdd}>{t('Add')}</button>}>
      <div className="flex gap-2 mb-4 flex-wrap">
        {['states','districts','blocks'].map(s => (
          <button key={s} onClick={() => setTab(s)} className={`px-4 py-2 rounded-lg text-sm font-bold capitalize ${tab===s ? 'bg-brand text-white' : 'btn-secondary'}`}>
            {t(s.charAt(0).toUpperCase() + s.slice(1))}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        {tab !== 'states' && (
          <select className="input w-auto" value={stateId} onChange={e => { setStateId(e.target.value); setDistrictId(''); }}>
            <option value="">{t('All States')}</option>
            {states.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
          </select>
        )}
        {tab === 'blocks' && (
          <select className="input w-auto" value={districtId} onChange={e => setDistrictId(e.target.value)}>
            <option value="">{t('All Districts')}</option>
            {filteredDistricts.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
          </select>
        )}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#fbfdfc] dark:bg-[#101a15] text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left p-3">{t('Name')}</th>
              {tab === 'states' && <th className="text-left p-3">{t('Code')}</th>}
              {tab === 'districts' && <th className="text-left p-3">{t('State')}</th>}
              {tab === 'blocks' && <><th className="text-left p-3">{t('District')}</th><th className="text-left p-3">{t('State')}</th></>}
              <th className="text-left p-3">{t('Used')}</th>
              <th className="text-left p-3">{t('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="p-8 text-center text-slate-400">{t('Loading…')}</td></tr>}
            {!loading && tab === 'states' && (stateId ? states.filter(s => String(s.id) === String(stateId)) : states).map(s => (
              <tr key={s.id} className="border-t border-[#f0f3f1] dark:border-[#24332b]">
                <td className="p-3 font-semibold">{s.name}</td>
                <td className="p-3">{s.code || '-'}</td>
                <td className="p-3">{(s.district_count || 0) + (s.org_count || 0)}</td>
                <td className="p-3 space-x-1">
                  <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => startEdit(s)}>{t('Edit')}</button>
                  <button className="btn btn-secondary h-8 px-2 text-xs text-rose-600" onClick={() => remove(s.id, s.name)}>{t('Delete')}</button>
                </td>
              </tr>
            ))}
            {!loading && tab === 'districts' && filteredDistricts.map(d => (
              <tr key={d.id} className="border-t border-[#f0f3f1] dark:border-[#24332b]">
                <td className="p-3 font-semibold">{d.name}</td>
                <td className="p-3">{d.state_name || '-'}</td>
                <td className="p-3">{(d.block_count || 0) + (d.org_count || 0)}</td>
                <td className="p-3 space-x-1">
                  <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => startEdit(d)}>{t('Edit')}</button>
                  <button className="btn btn-secondary h-8 px-2 text-xs text-rose-600" onClick={() => remove(d.id, d.name)}>{t('Delete')}</button>
                </td>
              </tr>
            ))}
            {!loading && tab === 'blocks' && filteredBlocks.map(b => (
              <tr key={b.id} className="border-t border-[#f0f3f1] dark:border-[#24332b]">
                <td className="p-3 font-semibold">{b.name}</td>
                <td className="p-3">{b.district_name || '-'}</td>
                <td className="p-3">{b.state_name || '-'}</td>
                <td className="p-3">{b.user_count || 0}</td>
                <td className="p-3 space-x-1">
                  <button className="btn btn-secondary h-8 px-2 text-xs" onClick={() => startEdit(b)}>{t('Edit')}</button>
                  <button className="btn btn-secondary h-8 px-2 text-xs text-rose-600" onClick={() => remove(b.id, b.name)}>{t('Delete')}</button>
                </td>
              </tr>
            ))}
            {!loading && ((tab === 'states' && states.length === 0) || (tab === 'districts' && filteredDistricts.length === 0) || (tab === 'blocks' && filteredBlocks.length === 0)) && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">{t('No records.')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {edit && (
        <div className="fixed inset-0 z-[1000] bg-black/45 grid place-items-center p-4" onClick={() => setEdit(null)}>
          <div className="card w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[#eef2ef] dark:border-[#24332b] flex justify-between">
              <h2 className="font-bold">{edit.id ? t('Edit') : t('Add')} {t(edit.kind === 'state' ? 'State' : edit.kind === 'district' ? 'District' : 'Block')}</h2>
              <button className="text-2xl text-slate-400" onClick={() => setEdit(null)}>×</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <div className="label">{t('Name')}</div>
                <input className="input" value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} />
              </div>
              {edit.kind === 'state' && (
                <div>
                  <div className="label">{t('Code')}</div>
                  <input className="input" value={edit.code} onChange={e => setEdit({ ...edit, code: e.target.value })} placeholder="e.g. MH" />
                </div>
              )}
              {edit.kind === 'district' && (
                <div>
                  <div className="label">{t('State')}</div>
                  <select className="input" value={edit.state_id} onChange={e => setEdit({ ...edit, state_id: e.target.value })}>
                    <option value="">{t('Select State')}</option>
                    {states.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                  </select>
                </div>
              )}
              {edit.kind === 'block' && (
                <div>
                  <div className="label">{t('District')}</div>
                  <select className="input" value={edit.district_id} onChange={e => setEdit({ ...edit, district_id: e.target.value })}>
                    <option value="">{t('Select District')}</option>
                    {filteredDistricts.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-[#eef2ef] dark:border-[#24332b] flex justify-end gap-2">
              <button className="btn btn-secondary" onClick={() => setEdit(null)}>{t('Cancel')}</button>
              <button className="btn btn-primary" onClick={save}>{t('Save')}</button>
            </div>
          </div>
        </div>
      )}
    </FodderShell>
  );
}
