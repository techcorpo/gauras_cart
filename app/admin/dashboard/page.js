'use client';
import { useEffect, useState } from 'react';
import FodderShell from '../../../components/FodderShell';
import Metric from '../../../components/Metric';
import { useUI } from '../../../components/Providers';
import { apiFetch } from '../../../lib/api';

export default function AdminDashboard() {
  const { t } = useUI();
  const [stats, setStats] = useState({ pending: 0, active: 0, suspended: 0 });
  const [rows, setRows] = useState([]);
  const [tab, setTab] = useState('pending');

  async function load() {
    try { setStats((await apiFetch('/admin/stats', { auth: true })).stats); } catch {}
    try { setRows((await apiFetch('/admin/users?status=' + tab, { auth: true })).users); } catch {}
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  async function act(id, action) {
    await apiFetch(`/admin/users/${id}/${action}`, { method: 'POST', auth: true });
    load();
  }

  return (
    <FodderShell role="admin" title="Admin Dashboard" description="Review and approve registrations.">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Metric label={t('Pending')} value={stats.pending} tone="amber" />
        <Metric label={t('Active')} value={stats.active} tone="green" />
        <Metric label={t('Suspended')} value={stats.suspended} tone="rose" />
      </div>
      <div className="flex gap-2 mb-4">
        {['pending','active','suspended'].map(s => (
          <button key={s} onClick={() => setTab(s)}
            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize ${tab===s?'bg-brand text-white':'btn-secondary'}`}>{t(s.charAt(0).toUpperCase()+s.slice(1))}</button>
        ))}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#fbfdfc] dark:bg-[#101a15] text-slate-500 text-xs uppercase">
            <tr><th className="text-left p-3">{t('Name')}</th><th className="text-left p-3">{t('Role')}</th><th className="text-left p-3">{t('Phone')}</th><th className="text-left p-3">{t('Org/Location')}</th><th className="text-left p-3">{t('Actions')}</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">{t('No users.')}</td></tr>}
            {rows.map(u => (
              <tr key={u.id} className="border-t border-[#f0f3f1] dark:border-[#24332b]">
                <td className="p-3 font-semibold">{u.full_name}</td>
                <td className="p-3"><span className="pill bg-[#e8f1fb] text-[#32638f]">{u.role}</span></td>
                <td className="p-3">{u.phone}</td>
                <td className="p-3">{u.org_name || [u.block_name,u.district_name].filter(Boolean).join(', ') || '-'}</td>
                <td className="p-3 space-x-2">
                  {tab==='pending' && <>
                    <button onClick={()=>act(u.id,'approve')} className="btn btn-primary h-8 px-3 text-xs">{t('Approve')}</button>
                    <button onClick={()=>act(u.id,'reject')} className="btn btn-secondary h-8 px-3 text-xs">{t('Reject')}</button>
                  </>}
                  {tab==='active' && <button onClick={()=>act(u.id,'reject')} className="btn btn-secondary h-8 px-3 text-xs">{t('Suspend')}</button>}
                  {tab==='suspended' && <button onClick={()=>act(u.id,'approve')} className="btn btn-primary h-8 px-3 text-xs">{t('Re-activate')}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FodderShell>
  );
}
