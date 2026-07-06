"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORICAL } from "@/lib/chart-colors";

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

// Stable category -> color mapping, in the palette's validated slot order.
export const QUALIFICATION_DISTRIBUTION_COLORS: Record<string, string> = {
  pas_interesse: CATEGORICAL.blue,
  incomplet: CATEGORICAL.yellow,
  qualifie: CATEGORICAL.green,
  disqualifie_social: CATEGORICAL.violet,
  disqualifie_bruxelles: CATEGORICAL.red,
  autres: CATEGORICAL.magenta,
  rappel: CATEGORICAL.orange,
};

const CustomTooltip = ({ active, payload, total }: any) => {
  if (active && payload && payload.length) {
    const slice = payload[0].payload;
    const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
    return (
      <div className="bg-card/90 border border-border/50 backdrop-blur-md px-3 py-2 rounded-xl shadow-md text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
          <span className="font-heading font-semibold text-foreground">{slice.label}</span>
        </div>
        <p className="text-muted-foreground mt-1">
          Total : <span className="font-mono font-bold text-foreground">{slice.value}</span> ({pct}%)
        </p>
      </div>
    );
  }
  return null;
};

export function QualificationDonut({ slices }: { slices: DonutSlice[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="relative shrink-0">
        <ResponsiveContainer width={170} height={170}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius={56}
              outerRadius={78}
              paddingAngle={2.5}
              stroke="var(--card)"
              strokeWidth={3}
            >
              {slices.map((s) => (
                <Cell key={s.key} fill={s.color} style={{ outline: "none" }} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip total={total} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold font-heading text-foreground tabular-nums tracking-tight leading-none">{total}</span>
          <span className="text-[9px] font-heading font-semibold uppercase tracking-wider text-muted-foreground mt-1">Appelés</span>
        </div>
      </div>
      <ul className="flex-1 min-w-0 grid grid-cols-1 gap-2.5 w-full">
        {slices.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <li key={s.key} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-2 min-w-0 font-heading font-medium text-foreground/80">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="truncate">{s.label}</span>
                </span>
                <span className="font-mono font-bold text-foreground tabular-nums shrink-0">
                  {s.value} <span className="text-[10px] text-muted-foreground font-normal">({pct}%)</span>
                </span>
              </div>
              <div className="h-1 w-full bg-muted/20 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: s.color }} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
