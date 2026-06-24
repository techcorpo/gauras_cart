'use client';
import { usePWA } from './PWAContext';

export default function PWA() {
  const { iosHint, dismissIos } = usePWA();
  if (!iosHint) return null;
  return (
    <div className="fixed bottom-3 left-3 right-3 z-[9999] bg-[#163b2b] text-white text-sm px-4 py-3 rounded-xl shadow-xl text-center">
      Install Gauras Mart: tap <b>Share</b> → <b>Add to Home Screen</b>.{' '}
      <span className="underline cursor-pointer" onClick={dismissIos}>Dismiss</span>
    </div>
  );
}
