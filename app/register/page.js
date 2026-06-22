'use client';
import Link from 'next/link';
import { Sprout, Store, Truck, ShoppingBag, ArrowRight } from 'lucide-react';
import Topbar from '../../components/Topbar';
import { useUI } from '../../components/Providers';

const ROLES = [
  { key: 'manufacturer', title: 'Manufacturer', desc: 'Produce and supply agricultural inputs to distributors.', Icon: Store, tone: 'from-blue-500 to-blue-700' },
  { key: 'distributor', title: 'Distributor', desc: 'Aggregate farmer demand and order from manufacturers.', Icon: Truck, tone: 'from-purple-500 to-purple-700' },
  { key: 'farmer', title: 'Farmer', desc: 'Order seeds, fertilizers and inputs from distributors.', Icon: ShoppingBag, tone: 'from-brand to-brand-dark' },
];

export default function Register() {
  const { t } = useUI();
  return (
    <div className="min-h-screen bg-slate-900 text-white py-12 px-4">
      <div className="absolute top-4 right-4 z-20"><Topbar fixed={false} /></div>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-5">
            <span className="bg-gradient-to-br from-brand to-amber-500 p-2.5 rounded-2xl grid place-items-center shadow-lg">
              <Sprout className="w-7 h-7 text-white" />
            </span>
            <span className="text-2xl font-black tracking-tight">Gauras<span className="text-amber-400"> Mart</span></span>
          </div>
          <h1 className="text-3xl font-black">{t('Create your account')}</h1>
          <p className="text-white/70 mt-2">{t('Select how you want to join Gauras Mart.')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {ROLES.map(({ key, title, desc, Icon, tone }) => (
            <Link key={key} href={`/register/${key}`}
              className="group bg-slate-800 border border-slate-700 rounded-3xl p-7 hover:-translate-y-1 hover:border-amber-400/50 transition flex flex-col">
              <div className={`w-16 h-16 rounded-2xl grid place-items-center mb-5 bg-gradient-to-br ${tone} shadow-lg`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-lg font-black">{t(title)}</h2>
              <p className="text-sm text-slate-400 my-3 flex-1">{t(desc)}</p>
              <span className="text-amber-400 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                {t('Register as')} {t(title)} <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          ))}
        </div>

        <p className="text-center text-sm text-slate-400 mt-10">
          {t('Already have an account?')} <Link href="/sign-in" className="text-amber-400 font-bold hover:underline">{t('Sign in')}</Link>
        </p>
      </div>
    </div>
  );
}
