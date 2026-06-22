'use client';
import { useEffect, useState } from 'react';

// Registers the service worker and shows an "Install" button when available.
export default function PWA() {
  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }

    const onPrompt = (e) => { e.preventDefault(); setDeferred(e); setShow(true); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', () => setShow(false));

    // iOS Safari has no beforeinstallprompt — show a one-time hint.
    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    if (isiOS && !standalone && !localStorage.getItem('iosInstallHint')) setIosHint(true);

    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  async function install() {
    if (!deferred) return;
    setShow(false);
    deferred.prompt();
    try { await deferred.userChoice; } catch {}
    setDeferred(null);
  }

  return (
    <>
      {show && (
        <button onClick={install}
          className="fixed bottom-3 left-3 lg:left-[252px] z-[9999] px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-medium shadow-md">
          ⬇ Install
        </button>
      )}
      {iosHint && (
        <div className="fixed bottom-3 left-3 right-3 z-[9999] bg-[#163b2b] text-white text-sm px-4 py-3 rounded-xl shadow-xl text-center">
          Install Gauras Mart: tap <b>Share</b> → <b>Add to Home Screen</b>.{' '}
          <span className="underline cursor-pointer" onClick={() => { setIosHint(false); localStorage.setItem('iosInstallHint', '1'); }}>Dismiss</span>
        </div>
      )}
    </>
  );
}
