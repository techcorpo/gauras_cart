'use client';
import { useState } from 'react';
import { useUI } from './Providers';
import { COLOR_THEMES } from '../lib/colors';

// Modal with 5 preset color swatches + a custom color via the OS color palette.
export default function ColorPicker({ onClose }) {
  const { t, colorPref, setColor } = useUI();
  const [custom, setCustom] = useState(
    colorPref?.kind === 'custom' ? colorPref.value : '#e11d48'
  );

  const isActive = (key) => colorPref?.kind === 'preset' && colorPref.value === key;

  return (
    <div className="fixed inset-0 z-[1100] bg-black/45 grid place-items-center p-4" onClick={onClose}>
      <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-[#eef2ef] dark:border-[#24332b] flex justify-between items-center">
          <h2 className="font-bold">{t('Choose App Color')}</h2>
          <button onClick={onClose} className="text-2xl text-slate-400">×</button>
        </div>

        <div className="p-5">
          <p className="text-sm text-slate-500 mb-4">{t('Pick a theme color for the app.')}</p>

          {/* Preset swatches */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            {Object.entries(COLOR_THEMES).map(([key, th]) => (
              <button key={key} title={th.name}
                onClick={() => setColor({ kind: 'preset', value: key })}
                className="flex flex-col items-center gap-1.5">
                <span className="w-12 h-12 rounded-full border-2 grid place-items-center"
                  style={{ background: th.DEFAULT, borderColor: isActive(key) ? th.deep : 'transparent' }}>
                  {isActive(key) && <span className="text-white text-lg font-bold">✓</span>}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-300">{th.name}</span>
              </button>
            ))}
          </div>

          {/* Custom color */}
          <div className="border-t border-[#eef2ef] dark:border-[#24332b] pt-4">
            <div className="label">{t('Custom color')}</div>
            <div className="flex items-center gap-3">
              <input type="color" value={custom}
                onChange={(e) => setCustom(e.target.value)}
                className="w-12 h-11 rounded-lg border border-[#d6e1db] dark:border-[#2c4034] bg-transparent cursor-pointer" />
              <span className="text-sm font-mono text-slate-500">{custom}</span>
              <button className="btn btn-primary ml-auto"
                onClick={() => setColor({ kind: 'custom', value: custom })}>
                {t('Apply')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
