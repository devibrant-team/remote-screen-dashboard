import React from "react";

/** Small stat pill */
export function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-slate-700 text-xs font-medium">
      <span className="font-semibold">{label}</span>
      <span className="text-slate-500">{value}</span>
    </span>
  );
}

/** Progress bar (red brand) */
export function ProgressBar({ current, total }: { current: number; total?: number }) {
  const hasTotal = Number.isFinite(total);
  const pct = hasTotal && total ? Math.min(100, Math.round((current / total) * 100)) : 100;
  return (
    <div className="w-full">
      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
        <span>Slides</span>
        <span>{current}{hasTotal ? ` / ${total}` : " / ∞"}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div style={{ width: hasTotal ? `${pct}%` : "100%" }} className="h-full bg-red-600" />
      </div>
    </div>
  );
}

/** Section wrapper */
export function Section({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl p-4 sm:p-5 shadow-sm ring-1 ring-slate-200/70">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}
