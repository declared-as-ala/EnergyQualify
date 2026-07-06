"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MaskedField({
  label,
  value,
  masked,
  className,
}: {
  label: string;
  value: string;
  masked: string;
  className?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className={cn("flex items-center justify-between gap-3 py-1.5", className)}>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium tabular-nums truncate">{revealed ? value : masked}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={() => setRevealed((r) => !r)}
        aria-label={revealed ? "Masquer" : "Afficher"}
      >
        {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}
