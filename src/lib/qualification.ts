// Canonical qualification rule engine shared by the campaign builder's
// flowchart preview and the "Test the conversation" simulator, so both
// surfaces describe exactly the same decision logic.

export type FlowNodeId =
  | "start"
  | "ask_brussels"
  | "disqualified_brussels"
  | "ask_social_tariff"
  | "disqualified_social_tariff"
  | "ask_interest"
  | "not_interested"
  | "collect_supplier"
  | "collect_identity"
  | "collect_address"
  | "collect_contact_details"
  | "collect_dob"
  | "collect_ean"
  | "offer_callback_or_close"
  | "qualified_dossier"
  | "callback_scheduled";

export interface FlowNode {
  id: FlowNodeId;
  label: string;
  kind: "start" | "question" | "collect" | "outcome-success" | "outcome-fail" | "outcome-warning";
  next?: { onTrue?: FlowNodeId; onFalse?: FlowNodeId; onNext?: FlowNodeId };
}

export const QUALIFICATION_FLOW: FlowNode[] = [
  { id: "start", label: "Début de l'appel", kind: "start", next: { onNext: "ask_brussels" } },
  {
    id: "ask_brussels",
    label: "Habitez-vous à Bruxelles ?",
    kind: "question",
    next: { onTrue: "disqualified_brussels", onFalse: "ask_social_tariff" },
  },
  {
    id: "disqualified_brussels",
    label: "Disqualifié : Bruxelles",
    kind: "outcome-fail",
  },
  {
    id: "ask_social_tariff",
    label: "Bénéficiez-vous du tarif social de l'énergie ?",
    kind: "question",
    next: { onTrue: "disqualified_social_tariff", onFalse: "ask_interest" },
  },
  {
    id: "disqualified_social_tariff",
    label: "Disqualifié : tarif social",
    kind: "outcome-fail",
  },
  {
    id: "ask_interest",
    label: "Êtes-vous intéressé(e) par une comparaison de votre tarif énergie ?",
    kind: "question",
    next: { onTrue: "collect_supplier", onFalse: "not_interested" },
  },
  { id: "not_interested", label: "Pas intéressé", kind: "outcome-warning" },
  {
    id: "collect_supplier",
    label: "Collecter le fournisseur actuel",
    kind: "collect",
    next: { onNext: "collect_identity" },
  },
  {
    id: "collect_identity",
    label: "Collecter nom et prénom",
    kind: "collect",
    next: { onNext: "collect_address" },
  },
  {
    id: "collect_address",
    label: "Collecter l'adresse complète",
    kind: "collect",
    next: { onNext: "collect_contact_details" },
  },
  {
    id: "collect_contact_details",
    label: "Collecter e-mail et confirmer le téléphone",
    kind: "collect",
    next: { onNext: "collect_dob" },
  },
  {
    id: "collect_dob",
    label: "Collecter la date de naissance",
    kind: "collect",
    next: { onNext: "collect_ean" },
  },
  {
    id: "collect_ean",
    label: "Collecter le code EAN",
    kind: "collect",
    next: { onNext: "offer_callback_or_close" },
  },
  {
    id: "offer_callback_or_close",
    label: "Proposer un rappel ou clôturer le dossier",
    kind: "question",
    next: { onTrue: "callback_scheduled", onFalse: "qualified_dossier" },
  },
  { id: "callback_scheduled", label: "Rappel planifié", kind: "outcome-warning" },
  { id: "qualified_dossier", label: "Dossier qualifié envoyé au closer", kind: "outcome-success" },
];

export const REQUIRED_DOSSIER_FIELDS = [
  "firstName",
  "lastName",
  "address",
  "email",
  "phone",
  "dateOfBirth",
  "eanCode",
  "supplier",
  "interestLevel",
  "notes",
] as const;

export const OBJECTIONS: {
  id: string;
  phrase: string;
  aiResponse: string;
  action: string;
}[] = [
  {
    id: "not_interested",
    phrase: "Je ne suis pas intéressé.",
    aiResponse:
      "Je comprends, je ne vais pas insister. Merci pour votre temps et bonne journée.",
    action: "Statut → Pas intéressé",
  },
  {
    id: "busy",
    phrase: "Je suis occupé.",
    aiResponse:
      "Bien sûr, je vous prie de m'excuser. Souhaitez-vous que l'on vous rappelle à un moment plus pratique ?",
    action: "Proposer un rappel",
  },
  {
    id: "send_email",
    phrase: "Envoyez-moi un email.",
    aiResponse:
      "Avec plaisir, pouvez-vous me confirmer votre adresse e-mail afin que notre équipe vous transmette les informations ?",
    action: "Collecter l'e-mail → dossier incomplet",
  },
  {
    id: "no_ean",
    phrase: "Je ne veux pas communiquer mon Code EAN.",
    aiResponse:
      "Aucun souci, ce n'est pas obligatoire pour l'instant. Un conseiller pourra vous le demander plus tard si nécessaire.",
    action: "Poursuivre sans EAN → dossier incomplet",
  },
  {
    id: "social_tariff",
    phrase: "Je bénéficie du tarif social.",
    aiResponse:
      "Je vous remercie de cette précision. Dans ce cas, notre offre ne s'applique malheureusement pas à votre situation.",
    action: "Statut → Disqualifié : tarif social",
  },
  {
    id: "brussels",
    phrase: "J'habite à Bruxelles.",
    aiResponse:
      "Je vous remercie. Notre offre pilote ne couvre pas encore la Région de Bruxelles-Capitale.",
    action: "Statut → Disqualifié : Bruxelles",
  },
];

export const DEFAULT_OPENING_MESSAGE =
  "Bonjour, je suis l'assistant vocal automatisé de [Nom de la société]. Je vous appelle concernant une possibilité de comparaison de tarif énergie. Est-ce que vous avez une minute ?";

export const DEFAULT_COMPLIANCE_NOTICE =
  "Cet appel est passé par un assistant vocal automatisé, jamais présenté comme une personne réelle. Les données collectées (identité, adresse, code EAN, date de naissance) servent uniquement à préparer un dossier de comparaison énergétique et sont traitées conformément à notre politique de confidentialité. Vous pouvez demander à tout moment à ne plus être contacté.";
