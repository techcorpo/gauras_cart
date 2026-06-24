'use client';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { translate, LANG_NAMES } from '../lib/i18n';
import { ToastProvider } from './Toast';
import { CartProvider } from './CartProvider';
import { PWAProvider } from './PWAContext';
import { resolveTheme, applyColor, DEFAULT_COLOR } from '../lib/colors';

const UIContext = createContext(null);

export function Providers({ children }) {
  const [theme, setTheme] = useState('light');
  const [lang, setLang] = useState('en');
  const [colorPref, setColorPref] = useState({ kind: 'preset', value: DEFAULT_COLOR });

  useEffect(() => {
    const t = localStorage.getItem('theme') || 'light';
    const l = localStorage.getItem('lang') || 'en';
    setTheme(t); setLang(l);
    document.documentElement.classList.toggle('dark', t === 'dark');
    // load saved color
    let pref = { kind: 'preset', value: DEFAULT_COLOR };
    try { const raw = localStorage.getItem('color'); if (raw) pref = JSON.parse(raw); } catch {}
    setColorPref(pref);
    applyColor(resolveTheme(pref));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  }, []);

  const changeLang = useCallback((l) => { setLang(l); localStorage.setItem('lang', l); }, []);
  const t = useCallback((text) => translate(text, lang), [lang]);

  // Set the color theme. pref = { kind:'preset', value:'green' } or { kind:'custom', value:'#aabbcc' }
  const setColor = useCallback((pref) => {
    setColorPref(pref);
    localStorage.setItem('color', JSON.stringify(pref));
    applyColor(resolveTheme(pref));
  }, []);

  return (
    <UIContext.Provider value={{ theme, toggleTheme, lang, changeLang, t, LANG_NAMES, colorPref, setColor }}>
      <ToastProvider><CartProvider><PWAProvider>{children}</PWAProvider></CartProvider></ToastProvider>
    </UIContext.Provider>
  );
}
export const useUI = () => useContext(UIContext);
