'use client';
// 4-step visual pipeline matching your order_status enum.
const STEPS = ['placed', 'confirmed', 'shipped', 'delivered'];
const LABELS = { placed: 'Placed', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered' };

export default function OrderPipeline({ status }) {
  if (status === 'cancelled') {
    return <div className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-[#2a1717] inline-block px-2.5 py-1 rounded-full">Cancelled</div>;
  }
  const idx = Math.max(0, STEPS.indexOf(status));
  const pct = STEPS.length > 1 ? (idx / (STEPS.length - 1)) * 100 : 0;
  return (
    <div className="relative grid grid-cols-4 text-center text-[10px] font-bold text-slate-400">
      <div className="absolute top-2.5 left-[12.5%] right-[12.5%] h-0.5 bg-slate-200 dark:bg-[#24332b]" />
      <div className="absolute top-2.5 left-[12.5%] h-0.5 bg-brand transition-all" style={{ width: `${pct * 0.75}%` }} />
      {STEPS.map((s, i) => (
        <div key={s} className="z-10 flex flex-col items-center gap-1">
          <div className={`w-5 h-5 rounded-full grid place-items-center text-[9px] ${i <= idx ? 'bg-brand text-white' : 'bg-slate-200 dark:bg-[#24332b] text-slate-500'}`}>{i + 1}</div>
          <span className={i <= idx ? 'text-slate-600 dark:text-slate-300' : ''}>{LABELS[s]}</span>
        </div>
      ))}
    </div>
  );
}
