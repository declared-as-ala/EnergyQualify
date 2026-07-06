"use client";

import { motion } from "framer-motion";
import { ORDINAL_BLUE } from "@/lib/chart-colors";

export interface FunnelStage {
  label: string;
  value: number;
}

export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="space-y-2 relative">
      {stages.map((stage, i) => {
        const pct = Math.max((stage.value / max) * 100, 4);
        const prev = stages[i - 1];
        const conversion = prev && prev.value > 0 ? Math.round((stage.value / prev.value) * 100) : null;
        return (
          <div key={stage.label} className="group">
            {/* Conversion connector flow */}
            {conversion !== null && (
              <div className="flex items-center gap-1.5 ml-6 my-1">
                <div className="w-0.5 h-3 bg-border/40 border-dashed" />
                <span className="text-[10px] font-heading font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/30 flex items-center gap-0.5">
                  <span className="text-primary font-bold">↓</span> {conversion}% conversion
                </span>
              </div>
            )}

            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-heading font-semibold text-foreground/80 tracking-wide uppercase">{stage.label}</span>
              <span className="text-xs font-mono font-bold text-foreground bg-muted/40 px-2 py-0.5 rounded-md border border-border/20 tabular-nums">
                {stage.value.toLocaleString("fr-BE")}
              </span>
            </div>
            <div className="h-5 w-full rounded-full bg-muted/20 border border-border/5 shadow-inner overflow-hidden relative">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, oklch(from ${ORDINAL_BLUE[i % ORDINAL_BLUE.length]} l c h / 0.3) 0%, ${ORDINAL_BLUE[i % ORDINAL_BLUE.length]} 100%)`
                }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: i * 0.05 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
