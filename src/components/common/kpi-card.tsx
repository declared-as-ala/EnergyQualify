import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: { value: number; label?: string };
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClasses: Record<string, string> = {
    default: "text-primary bg-primary/10",
    success: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950",
    warning: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950",
    danger: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950",
  };

  return (
    <Card className={cn(
      "relative overflow-hidden border-border/50 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300",
      "before:absolute before:left-0 before:top-4 before:bottom-4 before:w-[3px] before:rounded-r-full",
      tone === "default" && "before:bg-primary/80",
      tone === "success" && "before:bg-emerald-500/80",
      tone === "warning" && "before:bg-orange-500/80",
      tone === "danger" && "before:bg-red-500/80"
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          {Icon && (
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shadow-2xs", toneClasses[tone])}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
        <p className="mt-2 text-2xl font-bold tracking-tight font-heading tabular-nums">{value}</p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-heading font-bold",
                trend.value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
              )}
            >
              {trend.value >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(trend.value)}%
            </span>
          )}
          {hint && <span>{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
