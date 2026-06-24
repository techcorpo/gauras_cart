'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, X, ShoppingBag, Truck, Minus, Plus, ArrowLeft } from 'lucide-react';
import { useCart } from './CartProvider';
import { useToast } from './Toast';
import { useUI } from './Providers';
import { Orders } from '../lib/api';
import { productEmoji, productGradient } from '../lib/placeholder';

export default function CartDrawer() {
  const cart = useCart();
  const toast = useToast();
  const { t } = useUI();
  const router = useRouter();
  const [season, setSeason] = useState('');
  const [busy, setBusy] = useState(false);

  if (!cart.open) return null;

  // Group cart lines by distributor (one order per distributor).
  const groups = {};
  for (const it of cart.items) {
    const sid = it.product.seller_id || it.product.distributor_id || 'unknown';
    const source = it.product.source || 'distributor';
    const name = it.product.seller_name || it.product.distributor_name || 'Seller';
    (groups[sid] = groups[sid] || { name, source, items: [] }).items.push(it);
  }
  const sellerCount = Object.keys(groups).length;

  async function checkout() {
    if (cart.items.length === 0) return;
    setBusy(true);
    try {
      let placed = 0;
      for (const [seller_id, g] of Object.entries(groups)) {
        const items = g.items.map((x) => ({ product_id: x.product.id, quantity: x.quantity }));
        await Orders.placeFarmerOrder({ seller_id, source: g.source, season: season || null, items });
        placed++;
      }
      toast(placed > 1 ? `${placed} orders placed (one per seller)` : 'Order placed');
      cart.clear(); cart.setOpen(false);
      router.push('/farmer/dashboard');
    } catch (e) { toast(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex justify-end bg-slate-950/60 backdrop-blur-sm" onClick={() => cart.setOpen(false)}>
      <div className="bg-white dark:bg-[#15201b] w-full max-w-md h-full flex flex-col shadow-2xl animate-slideLeft" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-amber-400" /><h3 className="font-bold">{t('Shopping Cart')}</h3></div>
          <button onClick={() => cart.setOpen(false)} className="p-1 text-slate-300 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {cart.items.length === 0 ? (
            <div className="text-center py-20 space-y-3 text-slate-400">
              <ShoppingBag className="w-16 h-16 mx-auto text-slate-200" />
              <p className="font-semibold">{t('Your cart is empty')}</p>
              <button onClick={() => { cart.setOpen(false); router.push('/farmer/shop'); }} className="btn btn-primary">{t('Start Shopping')}</button>
            </div>
          ) : (
            Object.entries(groups).map(([did, g]) => (
              <div key={did} className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                  <Truck className="w-3.5 h-3.5 text-brand" /> {g.name}
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${g.source==='manufacturer' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {g.source==='manufacturer' ? 'Direct' : 'Distributor'}
                  </span>
                </div>
                {g.items.map((it) => {
                  const [c1, c2] = productGradient(it.product.name);
                  return (
                    <div key={it.product.id} className="bg-slate-50 dark:bg-[#101a15] p-3 rounded-xl border border-slate-200 dark:border-[#24332b] flex gap-3">
                      <div className="w-14 h-14 rounded-lg grid place-items-center text-2xl shrink-0" style={{ background:`linear-gradient(135deg,${c1},${c2})` }}>
                        {productEmoji(it.product.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs line-clamp-2">{it.product.name}</h4>
                        <p className="text-[10px] text-slate-400">{it.product.unit} · {it.product.manufacturer_name || ''}</p>
                        <div className="flex justify-between items-center pt-1.5">
                          <span className="font-black text-sm">₹{Number(it.product.price ?? it.product.base_price).toFixed(2)}</span>
                          <div className="flex items-center gap-1 bg-white dark:bg-[#15201b] rounded-md border border-slate-200 dark:border-[#2c4034]">
                            <button onClick={() => cart.setQty(it.product.id, it.quantity - 1)} className="px-2 py-1 text-slate-500"><Minus className="w-3 h-3" /></button>
                            <span className="font-bold text-xs px-1">{it.quantity}</span>
                            <button onClick={() => cart.setQty(it.product.id, it.quantity + 1)} className="px-2 py-1 text-slate-500"><Plus className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer / checkout */}
        {cart.items.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-[#24332b] space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal ({cart.count} items)</span><span className="font-bold">₹{cart.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Delivery</span><span className="font-bold text-brand">Included</span></div>
              {sellerCount > 1 && <p className="text-[11px] text-amber-600 dark:text-amber-400">Items from {sellerCount} sellers → {sellerCount} separate orders.</p>}
              <div className="border-t border-slate-200 dark:border-[#24332b] pt-2 flex justify-between text-sm font-black"><span>Total</span><span>₹{cart.subtotal.toFixed(2)}</span></div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Season (optional)</label>
              <select value={season} onChange={(e)=>setSeason(e.target.value)} className="input h-10">
                <option value="">— Optional —</option>
                {['kharif','rabi','zaid','annual'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <button onClick={() => { cart.setOpen(false); router.push('/farmer/shop'); }} className="w-full btn btn-secondary py-3 flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" /> {t('Continue Shopping')}
            </button>
            <button onClick={checkout} disabled={busy}
              className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-slate-300 text-slate-950 font-black py-3 rounded-xl flex items-center justify-center gap-2">
              <ShoppingCart className="w-5 h-5" /> {busy ? t('Placing…') : t('Place Order')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
