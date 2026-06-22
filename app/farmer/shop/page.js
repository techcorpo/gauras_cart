'use client';
import { useEffect, useState, useMemo } from 'react';
import { Filter, Star, ShoppingCart, ChevronRight, AlertTriangle, Truck, Factory } from 'lucide-react';
import FodderShell from '../../../components/FodderShell';
import { useCart } from '../../../components/CartProvider';
import { useToast } from '../../../components/Toast';
import { useUI } from '../../../components/Providers';
import { Orders, Geo, Auth } from '../../../lib/api';
import { productEmoji, productGradient } from '../../../lib/placeholder';

export default function FarmerShop() {
  const cart = useCart();
  const toast = useToast();
  const { t } = useUI();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [seller, setSeller] = useState('all');
  const [sort, setSort] = useState('name');
  const [districts, setDistricts] = useState([]);
  const [districtId, setDistrictId] = useState('');
  const [allowDirect, setAllowDirect] = useState(false);

  // Load districts + the farmer's own district as default.
  useEffect(() => {
    (async () => {
      try {
        const [{ districts }, { user }] = await Promise.all([Geo.districts(), Auth.me()]);
        setDistricts(districts || []);
        if (user?.district_id) setDistrictId(String(user.district_id));
      } catch (e) { /* fall through */ }
    })();
  }, []);

  // Load products for the chosen district (re-runs when district changes).
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await Orders.farmerShop(districtId || undefined);
        setAll(r.products); setAllowDirect(!!r.allow_merchant_buying);
      } catch (e) { toast(e.message); } finally { setLoading(false); }
    })();
  }, [districtId]);

  const categories = useMemo(() => [...new Set(all.map(p => p.category).filter(Boolean))].sort(), [all]);
  const sellers = useMemo(() => {
    const m = {}; all.forEach(p => { if (p.seller_id) m[p.seller_id] = p.seller_name; });
    return Object.entries(m);
  }, [all]);

  const list = useMemo(() => {
    let r = all.filter(p => {
      if (category !== 'all' && p.category !== category) return false;
      if (seller !== 'all' && String(p.seller_id) !== seller) return false;
      if (q) {
        const hay = [p.name, p.catalog_name, p.category, p.manufacturer_name, p.seller_name].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    const price = (x) => Number(x.price ?? x.base_price);
    r = [...r].sort((a, b) =>
      sort === 'price-asc' ? price(a) - price(b) :
      sort === 'price-desc' ? price(b) - price(a) :
      a.name.localeCompare(b.name));
    return r;
  }, [all, q, category, seller, sort]);

  return (
    <FodderShell role="farmer" search={q} onSearch={setQ} category={category} onCategory={setCategory}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <aside className="lg:col-span-1 card p-5 h-fit space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#24332b]">
            <h3 className="font-black text-sm flex items-center gap-2"><Filter className="w-4 h-4 text-brand" /> {t('FILTERS')}</h3>
            <button onClick={()=>{setCategory('all');setSeller('all');setQ('');}} className="text-xs text-brand font-bold hover:underline">{t('Clear')}</button>
          </div>

          <div>
            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2">{t('District')}</h4>
            <select value={districtId} onChange={(e)=>{setDistrictId(e.target.value); setSeller('all');}} className="input h-10 text-xs">
              <option value="">{t('Select District')}</option>
              {districts.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
            </select>
          </div>

          <div>
            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2">{t('Category')}</h4>
            <div className="space-y-1.5">
              <FilterBtn active={category==='all'} onClick={()=>setCategory('all')} label={t('All Categories')} />
              {categories.map(c => <FilterBtn key={c} active={category===c} onClick={()=>setCategory(c)} label={c} />)}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2">{t('Seller')}</h4>
            <div className="space-y-1.5">
              <FilterBtn active={seller==='all'} onClick={()=>setSeller('all')} label={t('All Sellers')} />
              {sellers.map(([id,name]) => <FilterBtn key={id} active={seller===String(id)} onClick={()=>setSeller(String(id))} label={name} />)}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2">{t('Sort')}</h4>
            <select value={sort} onChange={(e)=>setSort(e.target.value)} className="input h-10 text-xs">
              <option value="name">{t('Name (A–Z)')}</option>
              <option value="price-asc">{t('Price: Low to High')}</option>
              <option value="price-desc">{t('Price: High to Low')}</option>
            </select>
          </div>

          {allowDirect && (
            <div className="text-[11px] space-y-1.5">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> {t('via Distributor')}</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> {t('Direct from Manufacturer')}</div>
            </div>
          )}
        </aside>

        {/* Product grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Hero */}
          <div className="bg-gradient-to-r from-brand to-brand-dark p-6 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-1.5 text-center md:text-left">
              <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">{t('Direct from Distributors')}</span>
              <h2 className="text-2xl font-black">{t('Shop Agricultural Inputs')}</h2>
              <p className="text-sm text-white/85 max-w-lg">{t("Seeds, fertilizers and more — delivered through your block's distributors.")}</p>
            </div>
            <div className="bg-white/10 backdrop-blur px-6 py-4 rounded-2xl text-center border border-white/10">
              <p className="text-xs uppercase tracking-wider text-white/80">{t('Products')}</p>
              <p className="text-4xl font-black text-amber-400">{all.length}</p>
            </div>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-[#24332b]">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t('Showing')} <span className="font-bold">{list.length}</span> {t('products')}</p>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400">{t('Loading products…')}</div>
          ) : list.length === 0 ? (
            <div className="card p-12 text-center space-y-3">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="font-bold text-lg">{t('No products found')}</h3>
              <p className="text-sm text-slate-500">{t('Try clearing filters or a different search.')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {list.map(p => {
                const [c1, c2] = productGradient(p.name);
                const direct = p.source === 'manufacturer';
                return (
                  <div key={p.source + '_' + p.seller_id + '_' + p.id} className={`card overflow-hidden flex flex-col group border-t-4 ${direct ? 'border-t-blue-500' : 'border-t-emerald-500'}`}>
                    <div className="relative h-40 grid place-items-center text-6xl" style={{ background:`linear-gradient(135deg,${c1},${c2})` }}>
                      {productEmoji(p.category)}
                      <span className={`absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ${direct ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                        {direct ? t('Direct from Manufacturer') : t('via Distributor')}
                      </span>
                      {p.catalog_name && <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">{p.catalog_name}</span>}
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{t('Unit:')} <strong className="text-slate-700 dark:text-slate-300">{p.unit}</strong></span>
                          <span className="capitalize">{p.category || '-'}</span>
                        </div>
                        <h3 className="font-bold text-sm line-clamp-2 min-h-[40px] leading-tight">{p.name}</h3>
                        {Number(p.min_order_qty) > 1 && <p className="text-[10px] text-amber-600 font-semibold">{t('Min order')}: {Number(p.min_order_qty)} {p.unit}</p>}
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          {direct ? <Factory className="w-3 h-3 text-blue-500" /> : <Truck className="w-3 h-3 text-brand" />} {p.seller_name}
                        </p>
                      </div>
                      <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-[#24332b]">
                        <div className="flex items-baseline justify-between">
                          <span className="text-2xl font-black">₹{Number(p.price ?? p.base_price).toFixed(2)}</span>
                          <span className="text-[10px] text-brand font-bold bg-brand-light dark:bg-[#1c2a22] px-2 py-0.5 rounded">{t('Free Delivery')}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">{t('By')} <span className="font-bold text-slate-600 dark:text-slate-300">{p.manufacturer_name}</span></p>
                        <button onClick={()=>{cart.add({ ...p, base_price: p.price ?? p.base_price }, Number(p.min_order_qty) || 1); toast(t('Added to cart'));}}
                          className="w-full bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs py-2 rounded-xl flex items-center justify-center gap-1.5">
                          <ShoppingCart className="w-3.5 h-3.5" /> {t('Add to Cart')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </FodderShell>
  );
}

function FilterBtn({ active, onClick, label }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left px-2 py-1.5 rounded-lg text-sm font-medium flex items-center justify-between capitalize ${active ? 'bg-brand-light dark:bg-[#1c2a22] text-brand font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#101a15]'}`}>
      <span>{label}</span><ChevronRight className="w-3 h-3" />
    </button>
  );
}
