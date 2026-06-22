'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sprout, Search, ShoppingCart, User, LogOut, Sparkles } from 'lucide-react';
import { Auth, Session } from '../lib/api';
import { useUI } from './Providers';
import { useCart } from './CartProvider';
import Topbar from './Topbar';
import CartDrawer from './CartDrawer';

// Amazon/FodderZon-style shell: dark sticky header + search + department bar + cart.
// `search`, `onSearch`, `category`, `onCategory` are optional (storefront uses them).
export default function FodderShell({ role, search, onSearch, category, onCategory, title, description, action, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useUI();
  const cart = useCart();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      if (!Session.access) { router.replace('/sign-in'); return; }
      try {
        const { user } = await Auth.me();
        if (role && user.role !== role) {
          const home = { admin:'/admin/dashboard', manufacturer:'/manufacturer/dashboard', distributor:'/distributor/dashboard', farmer:'/farmer/dashboard' }[user.role];
          router.replace(home || '/sign-in'); return;
        }
        setUser(user); setChecking(false);
      } catch { Session.clear(); router.replace('/sign-in'); }
    })();
  }, [role, router]);

  if (checking) return <div className="min-h-screen grid place-items-center text-slate-400">Loading…</div>;

  const name = user.org_name || user.full_name || 'User';
  async function logout() { if (confirm('Log out?')) { await Auth.logout(); router.replace('/sign-in'); } }

  const NAV = {
    farmer: [['Shop','/farmer/shop'],['My Orders','/farmer/dashboard'],['Settings','/farmer/settings']],
    manufacturer: [['Dashboard','/manufacturer/dashboard'],['Products','/manufacturer/products'],['Orders','/manufacturer/orders'],['Settings','/manufacturer/settings']],
    distributor: [['Dashboard','/distributor/dashboard'],['Products','/distributor/products'],['Orders','/distributor/orders'],['Settings','/distributor/settings']],
    admin: [['Dashboard','/admin/dashboard'],['Manufacturers','/admin/manufacturers'],['Distributors','/admin/distributors'],['Farmers','/admin/farmers'],['Catalog','/admin/catalog'],['Earnings','/admin/earnings'],['Geography','/admin/geography']],
  }[user.role] || [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-[#0e1512]">
      {/* PWA strip */}
      <div className="bg-amber-400 text-slate-950 text-xs py-1.5 px-4 font-semibold text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">Gauras Mart — add to Home Screen for fast ordering &amp; offline access 📲</span>
      </div>

      {/* Main dark header */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center gap-3">
          {/* Logo */}
          <Link href={NAV[0]?.[1] || '/'} className="flex items-center gap-2 shrink-0">
            <span className="bg-gradient-to-br from-brand to-amber-500 p-2 rounded-xl grid place-items-center shadow">
              <Sprout className="w-6 h-6 text-white" />
            </span>
            <div>
              <span className="text-xl font-black tracking-tight">Gauras<span className="text-amber-400"> Mart</span></span>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Agri Marketplace</p>
            </div>
          </Link>

          {/* Search (only when storefront passes handlers) */}
          {onSearch ? (
            <div className="flex-1 w-full flex rounded-lg overflow-hidden border border-slate-700 bg-white focus-within:ring-2 focus-within:ring-amber-400">
              {onCategory && (
                <select value={category} onChange={(e)=>onCategory(e.target.value)}
                  className="bg-slate-100 text-slate-700 text-sm px-3 border-r border-slate-300 outline-none hidden sm:block">
                  <option value="all">All</option>
                  <option value="seeds">Seeds</option>
                  <option value="fertilizer">Fertilizer</option>
                </select>
              )}
              <input value={search} onChange={(e)=>onSearch(e.target.value)}
                placeholder="Search products…"
                className="flex-1 px-4 py-2 text-slate-900 outline-none text-sm" />
              <button className="bg-amber-400 hover:bg-amber-500 text-slate-950 px-5 grid place-items-center"><Search className="w-5 h-5" /></button>
            </div>
          ) : <div className="flex-1 hidden md:block" />}

          {/* Right side: theme/lang, user, cart */}
          <div className="flex items-center gap-3 shrink-0">
            <Topbar fixed={false} />
            <div className="hidden md:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <User className="w-4 h-4 text-brand" />
              <div className="text-left leading-none">
                <span className="text-[10px] text-slate-400 block">Signed in</span>
                <span className="text-xs font-bold truncate max-w-[120px] inline-block">{name}</span>
              </div>
            </div>
            <button onClick={logout} title="Logout" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"><LogOut className="w-4 h-4" /></button>
            {user.role === 'farmer' && (
              <button onClick={()=>cart.setOpen(true)} className="relative p-2 bg-slate-800 hover:bg-slate-700 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-amber-400" />
                {cart.count > 0 && <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 font-black text-[10px] w-5 h-5 rounded-full grid place-items-center">{cart.count}</span>}
              </button>
            )}
          </div>
        </div>

        {/* Department / nav bar */}
        <div className="bg-slate-800 text-xs text-slate-300 border-t border-slate-700">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-5 overflow-x-auto whitespace-nowrap">
            {NAV.map(([label, href]) => {
              const active = pathname === href;
              return (
                <Link key={href} href={href}
                  className={`font-semibold hover:text-white ${active ? 'text-amber-400 border-b-2 border-amber-400 pb-0.5' : ''}`}>
                  {t(label)}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {(title || action) && (
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <div className="min-w-0">
              {title && <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-slate-100 truncate">{t(title)}</h1>}
              {description && <p className="text-xs text-slate-500">{t(description)}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-8 border-t-4 border-brand">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] text-slate-400">
          <span>© {new Date().getFullYear()} Gauras Mart — Agri Marketplace</span>
          <span>Manufacturer → Distributor → Farmer</span>
        </div>
      </footer>

      {user.role === 'farmer' && <CartDrawer />}
    </div>
  );
}
