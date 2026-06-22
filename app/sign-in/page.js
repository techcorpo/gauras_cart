'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sprout, ShoppingBag, Truck, Store, ShieldCheck } from 'lucide-react';
import { Auth, Session, DASHBOARD_BY_ROLE } from '../../lib/api';
import { useUI } from '../../components/Providers';
import Topbar from '../../components/Topbar';

export default function SignIn() {
  const router = useRouter();
  const { t } = useUI();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (Session.access && Session.user) {
      const d = DASHBOARD_BY_ROLE[Session.user.role];
      if (d) router.replace(d);
    }
  }, [router]);

  async function submit(e) {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const data = await Auth.login(phone.trim(), password);
      Session.save(data);
      router.replace(DASHBOARD_BY_ROLE[data.user.role] || '/sign-in');
    } catch (e2) { setErr(e2.message); setBusy(false); }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-900 text-white">
      {/* Theme / language controls */}
      <div className="absolute top-4 right-4 z-20"><Topbar fixed={false} /></div>

      {/* Left: brand hero */}
      <div className="lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-brand-deep via-brand-dark to-brand p-10 lg:p-14 flex flex-col justify-between">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="bg-gradient-to-br from-brand to-amber-500 p-2.5 rounded-2xl grid place-items-center shadow-lg">
            <Sprout className="w-7 h-7 text-white" />
          </span>
          <div>
            <div className="text-2xl font-black tracking-tight">Gauras<span className="text-amber-400"> Mart</span></div>
            <div className="text-[11px] text-white/70 uppercase tracking-widest">{t('Marketplace Access Portal')}</div>
          </div>
        </div>

        <div className="relative space-y-5 my-10">
          <h2 className="text-3xl lg:text-4xl font-black leading-tight">
            {t('Agricultural inputs')},<br /><span className="text-amber-400">{t('delivered simply')}.</span>
          </h2>
          <p className="text-white/80 max-w-md text-sm">
            {t('Connecting manufacturers, distributors and farmers in one trusted marketplace.')}
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-md pt-2">
            {[[Store,'Manufacturers'],[Truck,'Distributors'],[ShoppingBag,'Farmers'],[ShieldCheck,'Verified & Secure']].map(([Icon,label]) => (
              <div key={label} className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-xl px-3 py-2.5 border border-white/10">
                <Icon className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-semibold">{t(label)}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[11px] text-white/50">© {new Date().getFullYear()} Gauras Mart</p>
      </div>

      {/* Right: form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-slate-50 dark:bg-[#0e1512]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="bg-gradient-to-br from-brand to-amber-500 p-2 rounded-xl grid place-items-center">
              <Sprout className="w-6 h-6 text-white" />
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white">Gauras<span className="text-amber-500"> Mart</span></span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{t('Sign in')}</h1>
          <p className="text-sm text-slate-500 mb-7">{t('Enter your mobile number and password (farmers: 4-digit PIN) to continue.')}</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label text-slate-700 dark:text-slate-300">{t('Mobile Number')}</label>
              <input className="input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('Enter mobile number')} />
            </div>
            <div>
              <label className="label text-slate-700 dark:text-slate-300">{t('Password / PIN')}</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('Password or 4-digit PIN')} />
            </div>
            {err && <p className="text-sm text-rose-600 bg-rose-50 dark:bg-[#2a1717] rounded-lg px-3 py-2">{err}</p>}
            <button className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-slate-300 text-slate-950 font-black py-3 rounded-xl transition" disabled={busy}>
              {busy ? 'Signing in…' : t('Sign In')}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-500">
            {t('New user?')} <Link href="/register" className="text-brand font-bold hover:underline">{t('Create an account')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
