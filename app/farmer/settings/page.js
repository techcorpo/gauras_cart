'use client';
import { useEffect, useState } from 'react';
import FodderShell from '../../../components/FodderShell';
import { useToast } from '../../../components/Toast';
import { Farmer, Geo } from '../../../lib/api';

export default function FarmerSettings() {
  const toast = useToast();
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
      <h1 className="text-2xl font-extrabold mb-1">Settings</h1>
      <p className="text-sm text-slate-500 mb-6">Update your profile and location.</p>

      <div className="card p-6 mb-6">
        <h2 className="font-bold mb-4">Profile</h2>
        <div className="space-y-4">
          <div><div className="label">Name</div><input className="input" value={p.full_name} onChange={e=>setP({...p,full_name:e.target.value})} /></div>
          <div className="grid md:grid-cols-2 gap-4">
            <div><div className="label">Mobile Number</div><input className="input bg-slate-100 dark:bg-[#0e1512]" value={p.phone} disabled /></div>
            <div><div className="label">Email</div><input className="input" value={p.email} onChange={e=>setP({...p,email:e.target.value})} placeholder="you@example.com" /></div>
          </div>
          <div><div className="label">Address</div><input className="input" value={p.address} onChange={e=>setP({...p,address:e.target.value})} /></div>
        </div>
        <div className="mt-4 text-right"><button className="btn btn-primary" onClick={async()=>{ if(!p.full_name.trim()){toast('Name is required');return;} try{ await Farmer.saveProfile(p.full_name,p.email,p.address); toast('Profile saved'); }catch(e){toast(e.message);} }}>Save Profile</button></div>
      </div>

      <div className="card p-6">
        <h2 className="font-bold mb-4">Service Location</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div><div className="label">District</div>
            <select className="input" value={districtId} onChange={e=>onDistrict(e.target.value)}>
              <option value="">Select District</option>{districts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div><div className="label">Block</div>
            <select className="input" value={blockId} onChange={e=>setBlockId(e.target.value)}>
              <option value="">Select Block</option>{blocks.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-4 text-right"><button className="btn btn-primary" onClick={async()=>{ if(!blockId){toast('Select a block');return;} try{ await Farmer.saveBlock(blockId); toast('Location saved'); }catch(e){toast(e.message);} }}>Save Location</button></div>
      </div>
    </FodderShell>
  );
}
