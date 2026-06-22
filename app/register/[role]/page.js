'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Topbar from '../../../components/Topbar';
import { Sprout, ArrowLeft } from 'lucide-react';

// Public geo fetch (registration is pre-login, so call API without auth).
async function geo(path) {
  const r = await fetch('/api' + path);
  if (!r.ok) throw new Error('geo failed');
  return r.json();
}

const TITLES = {
  manufacturer: 'Manufacturer Registration',
  distributor: 'Distributor Registration',
  farmer: 'Farmer Registration',
};

export default function RegisterRole() {
  const router = useRouter();
  const { role } = useParams();
  const [districts, setDistricts] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [allBlocksByDistrict, setAllBlocksByDistrict] = useState([]); // for distributor multi-select
  const [societies, setSocieties] = useState([]); // for distributor 'Is member of' dropdown
  const [form, setForm] = useState({});
  const [selectedBlocks, setSelectedBlocks] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  if (!TITLES[role]) {
    return <div className="min-h-screen grid place-items-center">Unknown role. <Link href="/register" className="text-brand ml-1">Go back</Link></div>;
  }

  useEffect(() => {
    geo('/geo/districts').then(d => setDistricts(d.districts)).catch(() => {});
    if (role === 'distributor') {
      // society codes defined by manufacturers (for 'Is member of')
      geo('/societies').then(d => setSocieties(d.societies || [])).catch(() => {});
      // load all districts with their blocks
      geo('/geo/districts').then(async d => {
        const out = [];
        for (const dist of d.districts) {
          const b = await geo('/geo/blocks?district_id=' + dist.id);
          out.push({ district: dist, blocks: b.blocks });
        }
        setAllBlocksByDistrict(out);
      }).catch(() => {});
    }
  }, [role]);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function onDistrict(did) {
    set('district_id', did);
    if (role === 'farmer') {
      set('block_id', '');
      if (did) { const b = await geo('/geo/blocks?district_id=' + did); setBlocks(b.blocks); }
      else setBlocks([]);
    }
  }

  function toggleBlock(id) {
    setSelectedBlocks(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function submit(e) {
    e.preventDefault(); setErr(''); setMsg('');
    const payload = {
      full_name: (role === 'farmer' ? form.farmerName : form.contactPerson) || form.full_name,
      phone: form.phone, email: form.email || null,
      address: form.address || null,
    };
    if (role === 'farmer') {
      if (!/^[0-9]{4}$/.test(String(form.pin || ''))) { setErr('PIN must be exactly 4 digits'); return; }
      if (form.pin !== form.confirmPin) { setErr('PINs do not match'); return; }
      payload.pin = form.pin;
      payload.block_id = form.block_id || null;
    } else {
      if (form.password !== form.confirm) { setErr('Passwords do not match'); return; }
      payload.password = form.password;
    }
    if (role === 'manufacturer') {
      payload.name = form.companyName;
      payload.district_id = form.district_id || null;
      payload.society_code = form.society_code || null;
      payload.is_exclusive = !!form.is_exclusive;
    }
    if (role === 'distributor') {
      payload.name = form.distributorshipName;
      payload.registration_number = form.registrationNumber || null;
      payload.chairperson_name = form.chairmanName || null;
      payload.block_ids = Array.from(selectedBlocks);
      payload.district_id = form.district_id || null;
      payload.society_code = form.society_code || null;
    }
    const hasSecret = role === 'farmer' ? !!payload.pin : !!payload.password;
    if (!payload.full_name || !payload.phone || !hasSecret) { setErr('Please fill all required fields'); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/auth/register/' + role, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setMsg(d.message || 'Registered! Pending approval.');
      setTimeout(() => router.replace('/sign-in'), 1500);
    } catch (e2) { setErr(e2.message); setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="absolute top-4 right-4 z-20"><Topbar fixed={false} /></div>
      <div className="max-w-3xl mx-auto">
        <Link href="/register" className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to roles
        </Link>
        <div className="bg-white dark:bg-[#15201b] rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-7 bg-gradient-to-r from-brand-deep to-brand-dark text-white flex items-center gap-4">
          <span className="bg-gradient-to-br from-brand to-amber-500 p-2.5 rounded-2xl grid place-items-center shadow-lg shrink-0">
            <Sprout className="w-7 h-7 text-white" />
          </span>
          <div>
            <h1 className="text-xl font-black">Gauras Mart — {TITLES[role]}</h1>
            <p className="text-sm text-white/75">Fill the details below to register.</p>
          </div>
        </div>

        <form onSubmit={submit} className="p-7 space-y-4">
          {role === 'farmer' && (<>
            <Field label="Name"><input className="input" onChange={e=>set('farmerName',e.target.value)} placeholder="Farmer name" /></Field>
            <Field label="Address"><input className="input" onChange={e=>set('address',e.target.value)} placeholder="Address" /></Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Contact Number"><input className="input" onChange={e=>set('phone',e.target.value)} placeholder="Mobile number" /></Field>
              <Field label="Email (optional)"><input className="input" onChange={e=>set('email',e.target.value)} placeholder="you@example.com" /></Field>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="District">
                <select className="input" onChange={e=>onDistrict(e.target.value)}>
                  <option value="">Select District</option>
                  {districts.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Block">
                <select className="input" value={form.block_id||''} onChange={e=>set('block_id',e.target.value)}>
                  <option value="">Select Block</option>
                  {blocks.map(b=> <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
            </div>
          </>)}

          {role === 'manufacturer' && (<>
            <Field label="Company Name"><input className="input" onChange={e=>set('companyName',e.target.value)} placeholder="Company name" /></Field>
            <Field label="Address"><input className="input" onChange={e=>set('address',e.target.value)} placeholder="Address" /></Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Contact Person"><input className="input" onChange={e=>set('contactPerson',e.target.value)} placeholder="Full name" /></Field>
              <Field label="Contact Number"><input className="input" onChange={e=>set('phone',e.target.value)} placeholder="Mobile number" /></Field>
            </div>
            <Field label="District">
              <select className="input" onChange={e=>onDistrict(e.target.value)}>
                <option value="">Select District</option>
                {districts.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <div className="grid md:grid-cols-2 gap-4 items-end">
              <Field label="Society Code (optional)">
                <input className="input" maxLength={10} value={form.society_code||''}
                  onChange={e=>set('society_code', e.target.value.toUpperCase().slice(0,10))}
                  placeholder="e.g. SANCHI" />
              </Field>
              <label className="flex items-center gap-2 text-sm font-medium pb-2">
                <input type="checkbox" checked={!!form.is_exclusive} onChange={e=>set('is_exclusive', e.target.checked)} />
                Exclusive (only this society's distributors can sell my products)
              </label>
            </div>
            <Field label="Email (optional)"><input className="input" onChange={e=>set('email',e.target.value)} placeholder="you@example.com" /></Field>
          </>)}

          {role === 'distributor' && (<>
            <Field label="Distributorship Name"><input className="input" onChange={e=>set('distributorshipName',e.target.value)} placeholder="Distributorship name" /></Field>
            <Field label="Address"><input className="input" onChange={e=>set('address',e.target.value)} placeholder="Address" /></Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Registration Number"><input className="input" onChange={e=>set('registrationNumber',e.target.value)} placeholder="Registration number" /></Field>
              <Field label="Chairman Name"><input className="input" onChange={e=>set('chairmanName',e.target.value)} placeholder="Chairman name" /></Field>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Contact Person"><input className="input" onChange={e=>set('contactPerson',e.target.value)} placeholder="Contact person" /></Field>
              <Field label="Contact Number"><input className="input" onChange={e=>set('phone',e.target.value)} placeholder="Mobile number" /></Field>
            </div>
            <Field label="Email (optional)"><input className="input" onChange={e=>set('email',e.target.value)} placeholder="you@example.com" /></Field>
            <Field label="Is member of">
              <select className="input" value={form.society_code||''} onChange={e=>set('society_code', e.target.value)}>
                <option value="">Select society</option>
                {societies.map(s=> <option key={s.society_code} value={s.society_code}>{s.society_code}{s.is_exclusive ? ' (exclusive)' : ''}</option>)}
              </select>
            </Field>
            <div>
              <div className="label">Service Territory (select blocks)</div>
              <div className="border border-[#e0e8e3] dark:border-[#2c4034] rounded-lg p-3 space-y-3 max-h-64 overflow-y-auto">
                {allBlocksByDistrict.map(g => (
                  <div key={g.district.id}>
                    <div className="text-sm font-bold text-brand-deep dark:text-brand-light mb-1">{g.district.name}</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {g.blocks.map(b => (
                        <label key={b.id} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={selectedBlocks.has(b.id)} onChange={()=>toggleBlock(b.id)} /> {b.name}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {allBlocksByDistrict.length === 0 && <p className="text-sm text-slate-400">Loading blocks…</p>}
              </div>
            </div>
          </>)}

          {role === 'farmer' ? (
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="4-digit PIN">
                <input className="input tracking-[0.5em] text-center font-bold" type="password" inputMode="numeric" maxLength={4}
                  value={form.pin||''} onChange={e=>set('pin', e.target.value.replace(/[^0-9]/g,'').slice(0,4))} placeholder="••••" />
              </Field>
              <Field label="Confirm PIN">
                <input className="input tracking-[0.5em] text-center font-bold" type="password" inputMode="numeric" maxLength={4}
                  value={form.confirmPin||''} onChange={e=>set('confirmPin', e.target.value.replace(/[^0-9]/g,'').slice(0,4))} placeholder="••••" />
              </Field>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Password"><input className="input" type="password" onChange={e=>set('password',e.target.value)} placeholder="Create password" /></Field>
              <Field label="Confirm Password"><input className="input" type="password" onChange={e=>set('confirm',e.target.value)} placeholder="Confirm password" /></Field>
            </div>
          )}

          {err && <p className="text-sm text-rose-600">{err}</p>}
          {msg && <p className="text-sm text-brand">{msg}</p>}

          <div className="flex justify-between items-center pt-2">
            <Link href="/register" className="text-sm text-slate-500">← Back</Link>
            <button className="bg-amber-400 hover:bg-amber-500 disabled:bg-slate-300 text-slate-950 font-black px-6 py-2.5 rounded-xl transition" disabled={busy}>{busy ? 'Submitting…' : 'Register'}</button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div><div className="label">{label}</div>{children}</div>;
}
