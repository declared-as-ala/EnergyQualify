"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORICAL, CHART_INK } from "@/lib/chart-colors";

export interface CampaignPerf {
  id: string;
  name: string;
  qualificationRate: number;
}

// Stable per-campaign color assignment (never remapped when the list is filtered/sorted).
const CAMPAIGN_COLORS: Record<string, string> = {
  "camp-ecofix": CATEGORICAL.blue,
  "camp-clearwatt": CATEGORICAL.aqua,
  "camp-voltia": CATEGORICAL.yellow,
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const colors: Record<string, string> = {
      "camp-ecofix": "var(--chart-1)",
      "camp-clearwatt": "var(--chart-2)",
      "camp-voltia": "var(--chart-3)",
    };
    return (
      <div className="bg-card/90 border border-border/50 backdrop-blur-md px-3 py-2 rounded-xl shadow-md text-xs">
        <p className="font-heading font-semibold text-foreground mb-1">{data.name}</p>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: colors[data.id] ?? "var(--chart-1)" }} />
          <span className="text-muted-foreground">Taux:</span>
          <span className="font-mono font-bold text-foreground">{payload[0].value}%</span>
        </div>
      </div>
    );
  }
  return null;
};

const CAMPAIGN_GRADIENTS: Record<string, string> = {
  "camp-ecofix": "url(#grad-ecofix)",
  "camp-clearwatt": "url(#grad-clearwatt)",
  "camp-voltia": "url(#grad-voltia)",
};

export function CampaignPerformanceChart({ data }: { data: CampaignPerf[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: -16, right: 36, top: 4, bottom: 4 }}>
        <defs>
          <linearGradient id="grad-ecofix" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.8} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={1} />
          </linearGradient>
          <linearGradient id="grad-clearwatt" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.8} />
            <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={1} />
          </linearGradient>
          <linearGradient id="grad-voltia" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.8} />
            <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={1} />
          </linearGradient>
        </defs>
        <CartesianGrid horizontal={false} stroke="var(--border)" strokeOpacity={0.3} strokeDasharray="3 3" />
        <XAxis
          type="number"
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontFamily: "var(--font-plus-jakarta-sans)", fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tick={{ fontSize: 11, fill: "var(--foreground)", fontFamily: "var(--font-plus-jakarta-sans)", fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.15 }}
          content={<CustomTooltip />}
        />
        <Bar dataKey="qualificationRate" radius={[0, 6, 6, 0]} maxBarSize={22}>
          {data.map((d) => (
            <Cell key={d.id} fill={CAMPAIGN_GRADIENTS[d.id] ?? "var(--chart-1)"} />
          ))}
          <LabelList
            dataKey="qualificationRate"
            position="right"
            formatter={(v) => `${v ?? 0}%`}
            style={{ fontSize: 11, fontWeight: 700, fill: "var(--foreground)", fontFamily: "var(--font-geist-mono)", paddingLeft: 8 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
