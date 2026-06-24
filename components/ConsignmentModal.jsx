'use client';
import { useState, useEffect } from 'react';
import { useUI } from './Providers';

export default function ConsignmentModal({ orders, selectedId, onClose, onSubmit }) {
  const { t } = useUI();
  const [selected, setSelected] = useState(new Set(selectedId ? [selectedId] : []));
  const [driver, setDriver] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setSelected(new Set(selectedId ? [selectedId] : [])); }, [selectedId]);

  function toggle(id) { setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  async function submit(e) {
    e.preventDefault();
    if (selected.size === 0) return;
    setSaving(true);
    try {
      await onSubmit({ order_ids: [...selected], driver_name: driver, vehicle_no: vehicle, notes });
      onClose();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-black/45 grid place-items-center p-4" onClick={onClose}>
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-[#eef2ef] dark:border-[#24332b] flex justify-between">
          <h2 className="font-bold">{t('Create Consignment')}</h2>
          <button className="text-2xl text-slate-400" onClick={onClose}>×</button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="space-y-2 max-h-60 overflow-y-auto border border-[#e4ece7] dark:border-[#24332b] rounded-lg p-2">
            {orders.length === 0 && <div className="text-sm text-slate-400">{t('No confirmed orders.')}</div>}
            {orders.map(o => (
              <label key={o.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-[#101a15] rounded cursor-pointer">
                <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggle(o.id)} />
                <div className="text-sm">
                  <div className="font-semibold">PO #{o.order_number} · {o.distributor_name}</div>
                  <div className="text-xs text-slate-500">₹{Number(o.total_amount).toFixed(2)} · {new Date(o.created_at).toLocaleDateString()}</div>
                </div>
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="label">{t('Driver Name')}</div>
              <input className="input" value={driver} onChange={e => setDriver(e.target.value)} placeholder={t('Driver Name')} />
            </div>
            <div>
              <div className="label">{t('Vehicle No')}</div>
              <input className="input" value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder={t('Vehicle No')} />
            </div>
          </div>
          <div>
            <div className="label">{t('Notes')}</div>
            <textarea className="input h-20 py-2" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('Notes')} />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>{t('Cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving || selected.size === 0}>{saving ? t('Saving…') : t('Create Consignment')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
