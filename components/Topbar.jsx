'use client';
import { useState } from 'react';
import { useUI } from './Providers';

// Theme + language controls. `fixed` = float top-right (used on auth pages).
// Inside AppShell it's rendered inline within the header bar (fixed={false}).
export default function Topbar({ fixed = true }) {
  const { theme, toggleTheme, lang, changeLang, LANG_NAMES } = useUI();
  const [open, setOpen] = useState(false);

  const wrap = fixed ? 'fixed top-3 right-3 z-50 flex gap-2' : 'flex gap-2';

  return (
    <div className={wrap}>
      <button onClick={toggleTheme} title="Toggle theme"
        className="h-9 w-10 rounded-lg border border-[#dce8e1] dark:border-[#2c4034] bg-white dark:bg-[#15201b] shadow-sm">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <div className="relative">
        <button onClick={() => setOpen(o => !o)} title={LANG_NAMES[lang]}
          className="h-9 px-2.5 rounded-lg border border-[#dce8e1] dark:border-[#2c4034] bg-white dark:bg-[#15201b] shadow-sm text-sm">
          🌐 <span className="text-slate-500">⌄</span>
        </button>
        {open && (
          <div className="absolute right-0 top-11 min-w-[140px] p-2 rounded-xl bg-white dark:bg-[#15201b] border border-[#dce8e1] dark:border-[#2c4034] shadow-xl z-50 text-slate-700 dark:text-slate-200">
            {Object.entries(LANG_NAMES).map(([code, name]) => (
              <button key={code}
                onClick={() => { changeLang(code); setOpen(false); }}
                className={`block w-full text-left px-2.5 h-9 rounded-lg text-sm font-semibold ${lang === code ? 'bg-brand-light text-brand' : 'text-slate-700 dark:text-slate-200 hover:bg-brand-light/60'}`}>
                {name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
