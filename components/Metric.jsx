'use client';
// Small reusable metric card.
export default function Metric({ label, value, foot, tone = 'green' }) {
  const tones = {
    green: 'bg-[#e5f5eb] text-brand',
    blue: 'bg-[#e8f1fb] text-[#32638f]',
    amber: 'bg-[#fff4dc] text-[#9a6a12]',
    rose: 'bg-[#fdecec] text-[#b64b4b]',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-slate-500">{label}</span>
        <span className={`w-9 h-9 rounded-lg grid place-items-center ${tones[tone]}`}>●</span>
      </div>
      <div className="text-2xl font-extrabold">{value}</div>
      {foot && <div className="text-xs text-slate-500 mt-1">{foot}</div>}
    </div>
  );
}
