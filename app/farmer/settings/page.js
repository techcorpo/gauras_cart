'use client';
import { useEffect, useState } from 'react';
import FodderShell from '../../../components/FodderShell';
import { useToast } from '../../../components/Toast';
import { Farmer, Geo } from '../../../lib/api';
import { useUI } from '../../../components/Providers';

export default function FarmerSettings() {
  const toast = useToast();
  const { t } = useUI();
  const [p, setP] = useState({ full_name:'', phone:'', email:'', address:'' });
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [districtId, setDistrictId] = useState('');
  const [blockId, setBlockId] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { profile } = await Farmer.settings();
        setP({ full_name:profile.full_name||'', phone:profile.phone||'', email:profile.email||'', address:profile.address||'' });
        setDistrictId(profile.district_id||''); setBlockId(profile.block_id||'');
        const { districts } = await Geo.districts(); setDistricts(districts);
        if (profile.district_id) { const b = await Geo.blocks(profile.district_id); setBlocks(b.blocks); }
      } catch {}
    })();
  }, []);

  async function onDistrict(id){ setDistrictId(id); setBlockId(''); if(id){ const b=await Geo.blocks(id); setBlocks(b.blocks);} else setBlocks([]); }

  return (
    <FodderShell role="farmer">
      <h1 className="text-2xl font-extrabold mb-1">{t('Settings')}</h1>
      <p className="text-sm text-slate-500 mb-6">{t('Update your profile and location.')}</p>

      <div className="card p-6 mb-6">
        <h2 className="font-bold mb-4">{t('Profile')}</h2>
        <div className="space-y-4">
          <div><div className="label">{t('Name')}</div><input className="input" value={p.full_name} onChange={e=>setP({...p,full_name:e.target.value})} /></div>
          <div className="grid md:grid-cols-2 gap-4">
            <div><div className="label">{t('Mobile Number')}</div><input className="input bg-slate-100 dark:bg-[#0e1512]" value={p.phone} disabled /></div>
            <div><div className="label">{t('Email')}</div><input className="input" value={p.email} onChange={e=>setP({...p,email:e.target.value})} placeholder="you@example.com" /></div>
          </div>
          <div><div className="label">{t('Address')}</div><input className="input" value={p.address} onChange={e=>setP({...p,address:e.target.value})} /></div>
        </div>
        <div className="mt-4 text-right"><button className="btn btn-primary" onClick={async()=>{ if(!p.full_name.trim()){toast(t('Name is required'));return;} try{ await Farmer.saveProfile(p.full_name,p.email,p.address); toast(t('Profile saved')); }catch(e){toast(e.message);} }}>{t('Save Profile')}</button></div>
      </div>

      <div className="card p-6">
        <h2 className="font-bold mb-4">{t('Service Location')}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div><div className="label">{t('District')}</div>
            <select className="input" value={districtId} onChange={e=>onDistrict(e.target.value)}>
              <option value="">{t('Select District')}</option>{districts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div><div className="label">{t('Block')}</div>
            <select className="input" value={blockId} onChange={e=>setBlockId(e.target.value)}>
              <option value="">{t('Select Block')}</option>{blocks.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4 text-right"><button className="btn btn-primary" onClick={async()=>{ if(!blockId){toast(t('Select a block'));return;} try{ await Farmer.saveBlock(blockId); toast(t('Location saved')); }catch(e){toast(e.message);} }}>{t('Save Location')}</button></div>
      </div>
    </FodderShell>
  );
}
