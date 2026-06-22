'use client';
import { createContext, useContext, useState, useCallback } from 'react';

const ToastCtx = createContext(null);
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState('');
  const show = useCallback((m) => { setMsg(m); setTimeout(() => setMsg(''), 2600); }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-5 z-[2000] bg-[#163b2b] text-white px-4 py-3 rounded-lg text-sm shadow-xl">
          {msg}
        </div>
      )}
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);
