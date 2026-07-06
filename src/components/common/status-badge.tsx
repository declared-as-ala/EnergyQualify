import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CALL_STATUS_META,
  CAMPAIGN_STATUS_META,
  CONTACT_STATUS_META,
  QUALIFICATION_RESULT_META,
  DOSSIER_STATUS_META,
  TONE_BADGE_CLASSES,
} from "@/lib/status";
import type { CallStatus, CampaignStatus, ContactStatus, DossierStatus, QualificationResult } from "@/lib/types";

export function ContactStatusBadge({ status, className }: { status: ContactStatus; className?: string }) {
  const meta = CONTACT_STATUS_META[status];
  return (
    <Badge variant="outline" className={cn("font-medium", TONE_BADGE_CLASSES[meta.tone], className)}>
      {meta.label}
    </Badge>
  );
}

export function CampaignStatusBadge({ status, className }: { status: CampaignStatus; className?: string }) {
  const meta = CAMPAIGN_STATUS_META[status];
  return (
    <Badge variant="outline" className={cn("font-medium", TONE_BADGE_CLASSES[meta.tone], className)}>
      {meta.label}
    </Badge>
  );
}

export function CallStatusBadge({ status, className }: { status: CallStatus; className?: string }) {
  const meta = CALL_STATUS_META[status];
  return (
    <Badge variant="outline" className={cn("font-medium", TONE_BADGE_CLASSES[meta.tone], className)}>
      {meta.label}
    </Badge>
  );
}

export function QualificationResultBadge({
  result,
  className,
}: {
  result: QualificationResult;
  className?: string;
}) {
  const meta = QUALIFICATION_RESULT_META[result];
  return (
    <Badge variant="outline" className={cn("font-medium", TONE_BADGE_CLASSES[meta.tone], className)}>
      {meta.label}
    </Badge>
  );
}

export function DossierStatusBadge({ status, className }: { status: DossierStatus; className?: string }) {
  const label = DOSSIER_STATUS_META[status].label;
  const tone = {
    NOUVEAU_DOSSIER: "info",
    A_VERIFIER: "warning",
    A_RAPPELER: "orange",
    PRET_POUR_CLOSING: "info",
    CONTRAT_ENVOYE: "orange",
    SIGNE: "success",
    PERDU: "danger",
  }[status];

  return (
    <Badge variant="outline" className={cn("font-medium font-heading tracking-wide uppercase text-[9px]", TONE_BADGE_CLASSES[tone], className)}>
      {label}
    </Badge>
  );
}
