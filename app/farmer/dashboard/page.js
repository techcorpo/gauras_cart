'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ShoppingBag, TrendingUp, Coins, Boxes } from 'lucide-react';
import FodderShell from '../../../components/FodderShell';
import OrderPipeline from '../../../components/OrderPipeline';
import { Orders } from '../../../lib/api';
import { useToast } from '../../../components/Toast';

export default function FarmerDashboard() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, m] = await Promise.all([Orders.statsFarmer(), Orders.farmerMine()]);
        setStats(s.stats); setOrders(m.orders);
      } catch (e) { toast(e.message); } finally { setLoading(false); }
    })();
  }, []);

  return (
    <FodderShell role="farmer">
      {/* Welcome / quick action */}
      <div className="bg-gradient-to-r from-brand to-brand-dark p-6 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black">My Orders &amp; Tracking</h1>
          <p className="text-sm text-white/85">Track your orders and reorder inputs anytime.</p>
        </div>
        <Link href="/farmer/shop" className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-6 py-3 rounded-xl flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" /> Continue Shopping
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon={<Package className="w-5 h-5" />} tone="green" label="Active Orders" value={loading ? '—' : stats?.active_orders ?? 0} />
        <Stat icon={<Boxes className="w-5 h-5" />} tone="blue" label="Quantity Ordered" value={loading ? '—' : Number(stats?.quantity ?? 0)} />
        <Stat icon={<Coins className="w-5 h-5" />} tone="amber" label="Amount Due" value={loading ? '—' : `₹${Number(stats?.due ?? 0).toFixed(2)}`} />
        <Stat icon={<TrendingUp className="w-5 h-5" />} tone="rose" label="Total Orders" value={loading ? '—' : stats?.total_orders ?? 0} />
      </div>

      {/* Orders with pipeline */}
      <div className="card">
        <div className="p-4 border-b border-slate-100 dark:border-[#24332b] flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-500" />
          <h2 className="font-bold">My Shipments</h2>
        </div>
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="text-center py-10 text-slate-400">Loading…</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-200" />
              <p>No orders yet.</p>
              <Link href="/farmer/shop" className="btn btn-primary inline-flex">Start Shopping</Link>
            </div>
          ) : (
            orders.map(o => (
              <div key={o.id} className="bg-slate-50 dark:bg-[#101a15] p-4 rounded-2xl border border-slate-200 dark:border-[#24332b] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold">Order #{o.order_number}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-slate-500">{new Date(o.created_at).toLocaleDateString()}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-slate-500">{o.distributor_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">₹{Number(o.total_amount).toFixed(2)}</span>
                    <span className={`pill ${o.payment_status==='paid'?'bg-[#e5f5eb] text-brand':'bg-[#fff4dc] text-[#9a6a12]'}`}>{o.payment_status}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 pl-2 border-l-2 border-amber-400 space-y-0.5">
                  {(o.items||[]).map((it, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{it.product_name} <strong>×{Number(it.quantity)}</strong></span>
                      <span>₹{Number(it.line_total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <OrderPipeline status={(o.items?.[0]?.alloc_status) || o.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </FodderShell>
  );
}

function Stat({ icon, label, value, tone }) {
  const tones = { green:'bg-[#e5f5eb] text-brand', blue:'bg-[#e8f1fb] text-[#32638f]', amber:'bg-[#fff4dc] text-[#9a6a12]', rose:'bg-[#fdecec] text-[#b64b4b]' };
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <span className={`w-9 h-9 rounded-lg grid place-items-center ${tones[tone]}`}>{icon}</span>
      </div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}
