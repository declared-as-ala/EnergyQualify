import seedRows from "./seed-rows.json";
import { createRng, pick, pickWeighted, randomInt, shuffle, type Rng } from "./rng";
import { BRUSSELS_LOCATIONS, BRUSSELS_STREETS, CLOSERS, SUPPLIERS, isoDaysAgo, isoDaysFromNow } from "./constants";
import type {
  AgentConfiguration,
  AuditLogEntry,
  Call,
  Callback,
  Campaign,
  Contact,
  ContactImportSummary,
  ContactStatus,
  DoNotContactRecord,
  DossierStatus,
  QualificationResult,
  QualifiedDossier,
  TranscriptTurn,
  User,
} from "@/lib/types";
import { DEFAULT_COMPLIANCE_NOTICE, DEFAULT_OPENING_MESSAGE, OBJECTIONS } from "@/lib/qualification";

interface SeedRow {
  civility: string | null;
  lastName: string;
  firstName: string;
  postalCode: string;
  city: string;
  address: string;
  phone: string;
  ageRange: string | null;
}

const rows = seedRows as SeedRow[];

function emailFor(firstName: string, lastName: string, rng: Rng): string {
  const domains = ["gmail.com", "outlook.com", "skynet.be", "hotmail.com", "proximus.be"];
  const normalized = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z]/g, "");
  return `${normalized(firstName)}.${normalized(lastName)}@${pick(rng, domains)}`;
}

function eanFor(rng: Rng): string {
  let ean = "541";
  for (let i = 0; i < 15; i++) ean += Math.floor(rng() * 10);
  return ean;
}

function dobFor(ageRange: string | null, rng: Rng): string {
  let min = 30;
  let max = 65;
  if (ageRange === "30-50") {
    min = 1975;
    max = 1995;
  } else if (ageRange === "50-70") {
    min = 1955;
    max = 1975;
  } else {
    min = 1960;
    max = 1998;
  }
  const year = randomInt(rng, min, max);
  const month = randomInt(rng, 1, 12);
  const day = randomInt(rng, 1, 28);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

function buildBrusselsRow(rng: Rng): SeedRow {
  const base = pick(rng, rows);
  const loc = pick(rng, BRUSSELS_LOCATIONS);
  const street = pick(rng, BRUSSELS_STREETS);
  return {
    civility: base.civility,
    firstName: base.firstName,
    lastName: base.lastName,
    postalCode: loc.postalCode,
    city: loc.city,
    address: `${street} ${randomInt(rng, 2, 240)}`,
    phone: `04${randomInt(rng, 60, 99)}${String(randomInt(rng, 0, 999999)).padStart(6, "0")}`,
    ageRange: pick(rng, ["30-50", "50-70", null]),
  };
}

function transcriptFor(
  contact: Pick<Contact, "firstName" | "lastName" | "city">,
  outcome: QualificationResult,
  supplier: string,
  rng: Rng,
): TranscriptTurn[] {
  const t0 = 0;
  const turn = (speaker: "agent" | "contact", text: string, offset: number): TranscriptTurn => ({
    speaker,
    text,
    timestamp: `00:${String(offset).padStart(2, "0")}`,
  });
  const opener = [
    turn("agent", DEFAULT_OPENING_MESSAGE.replace("[Nom de la société]", "EnergyQualify"), t0),
    turn("contact", "Oui, allez-y, je vous écoute.", 8),
    turn("agent", "Merci. Puis-je confirmer que vous habitez bien à " + contact.city + " et non à Bruxelles ?", 14),
  ];

  if (outcome === "DISQUALIFIED_BRUSSELS") {
    return [
      ...opener.slice(0, 2),
      turn("agent", "Puis-je confirmer votre commune de résidence ?", 12),
      turn("contact", "J'habite à " + contact.city + ", en Région bruxelloise.", 20),
      turn(
        "agent",
        "Je vous remercie. Notre offre pilote ne couvre pas encore la Région de Bruxelles-Capitale, je ne vais donc pas poursuivre l'appel. Bonne journée.",
        28,
      ),
    ];
  }
  if (outcome === "DISQUALIFIED_SOCIAL_TARIFF") {
    return [
      ...opener,
      turn("contact", "Non, je n'habite pas à Bruxelles.", 22),
      turn("agent", "Parfait. Bénéficiez-vous actuellement du tarif social de l'énergie ?", 28),
      turn("contact", "Oui, je suis au tarif social.", 35),
      turn(
        "agent",
        "Je vous remercie pour cette précision. Dans ce cas notre offre ne s'applique pas à votre situation actuelle. Bonne journée à vous.",
        40,
      ),
    ];
  }
  if (outcome === "NOT_INTERESTED") {
    return [
      ...opener,
      turn("contact", "Non, je suis dans le Namurois, pas à Bruxelles.", 22),
      turn("agent", "Merci. Êtes-vous intéressé(e) par une comparaison de votre tarif énergie actuel ?", 28),
      turn("contact", "Non merci, ça ne m'intéresse pas.", 34),
      turn("agent", "Je comprends, je ne vais pas insister. Merci pour votre temps et bonne journée.", 40),
    ];
  }
  if (outcome === "CALLBACK_REQUESTED") {
    return [
      ...opener,
      turn("contact", "Non, je suis dans le Namurois.", 22),
      turn("agent", "Merci. Seriez-vous intéressé(e) par une comparaison de votre tarif énergie ?", 28),
      turn("contact", "Peut-être, mais je suis un peu occupé là, pouvez-vous rappeler ?", 35),
      turn("agent", "Bien sûr, je note votre demande de rappel à un moment plus pratique. Merci et à bientôt.", 42),
    ];
  }
  if (outcome === "INCOMPLETE_DOSSIER") {
    return [
      ...opener,
      turn("contact", "Non, je suis dans le coin de " + contact.city + ".", 22),
      turn("agent", "Merci. Êtes-vous intéressé(e) par une comparaison de votre tarif énergie actuel, fourni par " + supplier + " ?", 28),
      turn("contact", "Oui pourquoi pas, ça m'intéresse.", 35),
      turn("agent", "Excellent. Pouvez-vous me communiquer votre code EAN ?", 40),
      turn("contact", "Je préfère ne pas vous le donner par téléphone.", 46),
      turn("agent", "Aucun souci, un conseiller pourra vous le redemander plus tard. Je transmets votre dossier pour vérification.", 52),
    ];
  }
  // QUALIFIED
  return [
    ...opener,
    turn("contact", "Non, je suis dans le Namurois.", 22),
    turn("agent", "Merci. Êtes-vous intéressé(e) par une comparaison de votre tarif énergie actuel, fourni par " + supplier + " ?", 28),
    turn("contact", "Oui, ça m'intéresse, allez-y.", 34),
    turn("agent", "Parfait, je vais collecter quelques informations. Pouvez-vous confirmer votre nom complet et votre adresse ?", 40),
    turn("contact", contact.firstName + " " + contact.lastName + ", à " + contact.city + ".", 48),
    turn("agent", "Merci. Et votre adresse e-mail, pour le suivi de votre dossier ?", 54),
    turn("contact", "Oui, bien sûr, je vous la donne.", 60),
    turn("agent", "Parfait, merci pour toutes ces informations. Votre dossier est transmis à notre équipe pour le closing.", 66),
  ];
}

function summaryFor(outcome: QualificationResult, name: string): string {
  switch (outcome) {
    case "DISQUALIFIED_BRUSSELS":
      return `${name} réside en Région bruxelloise, hors périmètre du pilote. Appel clôturé poliment.`;
    case "DISQUALIFIED_SOCIAL_TARIFF":
      return `${name} bénéficie du tarif social de l'énergie et n'est donc pas éligible à l'offre.`;
    case "NOT_INTERESTED":
      return `${name} n'est pas intéressé(e) par une comparaison de tarif énergie actuellement.`;
    case "CALLBACK_REQUESTED":
      return `${name} semble intéressé(e) mais était occupé(e). Un rappel a été planifié.`;
    case "INCOMPLETE_DOSSIER":
      return `${name} est intéressé(e) mais le dossier reste incomplet (donnée manquante). À compléter avant transmission.`;
    case "QUALIFIED":
      return `${name} est éligible et intéressé(e). Dossier complet transmis au closer pour prise de contact.`;
    default:
      return `Appel sans issue déterminée pour ${name}.`;
  }
}

export interface MockDataset {
  users: User[];
  campaigns: Campaign[];
  contacts: Contact[];
  calls: Call[];
  dossiers: QualifiedDossier[];
  callbacks: Callback[];
  doNotContact: DoNotContactRecord[];
  auditLog: AuditLogEntry[];
  agentConfig: AgentConfiguration;
  imports: ContactImportSummary[];
}

export function generateMockDataset(): MockDataset {
  const rng = createRng(1337);

  const brusselsRows = Array.from({ length: 16 }, () => buildBrusselsRow(rng));
  const pool = shuffle(rng, [...rows, ...brusselsRows]).slice(0, 250);

  const users: User[] = [
    { id: "user-admin", name: "Simon Lefèvre", email: "simon@energyqualify.be", role: "ADMIN" },
    { id: "user-cm", name: "Camille Dubuisson", email: "camille@energyqualify.be", role: "CAMPAIGN_MANAGER" },
    { id: "closer-1", name: "Camille Dubuisson", email: "camille@energyqualify.be", role: "CLOSER" },
    { id: "closer-2", name: "Yanis Bertrand", email: "yanis@energyqualify.be", role: "CLOSER" },
    { id: "closer-3", name: "Sophie Lambert", email: "sophie@energyqualify.be", role: "CLOSER" },
    { id: "user-viewer", name: "Marc Reynders", email: "marc@energyqualify.be", role: "VIEWER" },
  ];

  const campaigns: Campaign[] = [
    {
      id: "camp-ecofix",
      name: "Ecofix – Pilot Énergie Juillet",
      offer: "Comparaison tarif énergie résidentiel",
      targetSegment: "Particuliers, région de Namur/Gembloux",
      status: "RUNNING",
      voiceProvider: "MOCK",
      callHoursStart: "09:00",
      callHoursEnd: "20:00",
      callDaysOfWeek: [1, 2, 3, 4, 5],
      pilotSize: 100,
      rules: {
        excludeBrussels: true,
        excludeSocialTariff: true,
        requireInterest: true,
        requiredFields: ["firstName", "lastName", "address", "email", "phone", "dateOfBirth", "eanCode", "supplier"],
      },
      checklist: {
        contactListReviewed: true,
        doNotContactApplied: true,
        callHoursConfigured: true,
        scriptReviewed: true,
        dataFieldsApproved: true,
        pilotScopeConfirmed: true,
      },
      createdAt: isoDaysAgo(20),
      startedAt: isoDaysAgo(14),
    },
    {
      id: "camp-clearwatt",
      name: "ClearWatt – Suivi Andenne-Ciney",
      offer: "Comparaison tarif énergie + relance clientèle",
      targetSegment: "Particuliers, région d'Andenne/Ciney/Dinant",
      status: "PAUSED",
      voiceProvider: "MOCK",
      callHoursStart: "10:00",
      callHoursEnd: "18:00",
      callDaysOfWeek: [1, 2, 3, 4, 5],
      pilotSize: 70,
      rules: {
        excludeBrussels: true,
        excludeSocialTariff: true,
        requireInterest: true,
        requiredFields: ["firstName", "lastName", "address", "email", "phone", "dateOfBirth", "eanCode", "supplier"],
      },
      checklist: {
        contactListReviewed: true,
        doNotContactApplied: true,
        callHoursConfigured: true,
        scriptReviewed: true,
        dataFieldsApproved: false,
        pilotScopeConfirmed: true,
      },
      createdAt: isoDaysAgo(30),
      startedAt: isoDaysAgo(25),
      pausedAt: isoDaysAgo(3),
    },
    {
      id: "camp-voltia",
      name: "Voltia – Test initial Namur",
      offer: "Comparaison tarif énergie (test initial)",
      targetSegment: "Particuliers, Namur et périphérie",
      status: "COMPLETED",
      voiceProvider: "MOCK",
      callHoursStart: "09:00",
      callHoursEnd: "19:00",
      callDaysOfWeek: [1, 2, 3, 4, 5],
      pilotSize: 50,
      rules: {
        excludeBrussels: true,
        excludeSocialTariff: true,
        requireInterest: true,
        requiredFields: ["firstName", "lastName", "address", "email", "phone", "dateOfBirth", "eanCode", "supplier"],
      },
      checklist: {
        contactListReviewed: true,
        doNotContactApplied: true,
        callHoursConfigured: true,
        scriptReviewed: true,
        dataFieldsApproved: true,
        pilotScopeConfirmed: true,
      },
      createdAt: isoDaysAgo(45),
      startedAt: isoDaysAgo(40),
      completedAt: isoDaysAgo(10),
    },
  ];

  const contacts: Contact[] = [];
  const calls: Call[] = [];
  const dossiers: QualifiedDossier[] = [];
  const callbacks: Callback[] = [];
  const doNotContact: DoNotContactRecord[] = [];
  const auditLog: AuditLogEntry[] = [];

  let poolIdx = 0;
  const nextRow = () => pool[poolIdx++ % pool.length];

  let qualifiedBudget = 8;
  let dncBudget = 6;

  // campaign assignment plan: [campaignId, count, processedCount]
  const plan: { campaignId: string | undefined; count: number; processed: number }[] = [
    { campaignId: "camp-ecofix", count: 100, processed: 62 },
    { campaignId: "camp-clearwatt", count: 70, processed: 34 },
    { campaignId: "camp-voltia", count: 50, processed: 28 },
    { campaignId: undefined, count: 30, processed: 0 },
  ];

  for (const group of plan) {
    for (let i = 0; i < group.count; i++) {
      const row = nextRow();
      const isBrusselsGuess = BRUSSELS_LOCATIONS.some((b) => b.postalCode === row.postalCode);
      const id = `contact-${contacts.length + 1}`;
      const createdAt = isoDaysAgo(randomInt(rng, 5, 60));
      const contact: Contact = {
        id,
        civility: row.civility ?? undefined,
        firstName: row.firstName,
        lastName: row.lastName,
        address: row.address,
        postalCode: row.postalCode,
        city: row.city,
        phone: row.phone,
        ageRange: row.ageRange ?? undefined,
        status: group.campaignId ? "READY_TO_CALL" : "IMPORTED",
        interestLevel: "INCONNU",
        score: 0,
        isDuplicate: false,
        isBrusselsGuess,
        campaignId: group.campaignId,
        createdAt,
      };
      contacts.push(contact);

      const isProcessed = i < group.processed;
      if (!group.campaignId || !isProcessed) continue;

      // Determine outcome
      let outcome: QualificationResult;
      let contactStatus: ContactStatus;
      const callStartedAt = isoDaysAgo(randomInt(rng, 0, 13), randomInt(rng, 0, 8));

      if (isBrusselsGuess) {
        outcome = "DISQUALIFIED_BRUSSELS";
        contactStatus = "DISQUALIFIED_BRUSSELS";
      } else {
        const roll = pickWeighted<ContactStatus>(rng, [
          ["NO_ANSWER", 26],
          ["FAILED_CALL", 5],
          ["NOT_INTERESTED", 22],
          ["DISQUALIFIED_SOCIAL_TARIFF", 12],
          ["CALLBACK_REQUESTED", 13],
          ["INTERESTED_INCOMPLETE_DOSSIER", 11],
          ["QUALIFIED_DOSSIER", qualifiedBudget > 0 ? 11 : 0],
        ]);
        contactStatus = roll;
        outcome =
          roll === "QUALIFIED_DOSSIER"
            ? "QUALIFIED"
            : roll === "INTERESTED_INCOMPLETE_DOSSIER"
              ? "INCOMPLETE_DOSSIER"
              : roll === "CALLBACK_REQUESTED"
                ? "CALLBACK_REQUESTED"
                : roll === "DISQUALIFIED_SOCIAL_TARIFF"
                  ? "DISQUALIFIED_SOCIAL_TARIFF"
                  : roll === "NOT_INTERESTED"
                    ? "NOT_INTERESTED"
                    : "UNDETERMINED";
        if (roll === "QUALIFIED_DOSSIER") qualifiedBudget--;
      }

      contact.status = contactStatus;

      if (["NO_ANSWER", "FAILED_CALL"].includes(contactStatus)) {
        // brief unanswered attempt — light call record, no transcript.
        calls.push({
          id: `call-${calls.length + 1}`,
          contactId: contact.id,
          campaignId: group.campaignId,
          provider: "MOCK",
          status: contactStatus === "NO_ANSWER" ? "NO_ANSWER" : "FAILED",
          startedAt: callStartedAt,
          durationSec: contactStatus === "NO_ANSWER" ? 0 : randomInt(rng, 3, 15),
          detectedObjections: [],
          qualificationResult: "UNDETERMINED",
        });
        continue;
      }

      const supplier = pick(rng, SUPPLIERS);
      const durationSec = randomInt(rng, 45, 210);
      const objections =
        outcome === "DISQUALIFIED_SOCIAL_TARIFF"
          ? ["Je bénéficie du tarif social."]
          : outcome === "DISQUALIFIED_BRUSSELS"
            ? ["J'habite à Bruxelles."]
            : outcome === "NOT_INTERESTED"
              ? ["Je ne suis pas intéressé."]
              : outcome === "CALLBACK_REQUESTED"
                ? ["Je suis occupé."]
                : outcome === "INCOMPLETE_DOSSIER"
                  ? ["Je ne veux pas communiquer mon Code EAN."]
                  : [];

      const call: Call = {
        id: `call-${calls.length + 1}`,
        contactId: contact.id,
        campaignId: group.campaignId,
        provider: "MOCK",
        status: "COMPLETED",
        startedAt: callStartedAt,
        endedAt: new Date(new Date(callStartedAt).getTime() + durationSec * 1000).toISOString(),
        durationSec,
        transcript: transcriptFor(contact, outcome, supplier, rng),
        summary: summaryFor(outcome, `${contact.firstName} ${contact.lastName}`),
        aiConfidence: Math.round((0.7 + rng() * 0.29) * 100) / 100,
        detectedObjections: objections,
        assignedCloserId: outcome === "QUALIFIED" ? pick(rng, CLOSERS).id : undefined,
        qualificationResult: outcome,
      };
      calls.push(call);

      if (outcome === "QUALIFIED" || outcome === "INCOMPLETE_DOSSIER") {
        contact.supplier = supplier;
        contact.email = emailFor(contact.firstName, contact.lastName, rng);
        contact.interestLevel = outcome === "QUALIFIED" ? "ELEVE" : "MOYEN";
        contact.dateOfBirth = outcome === "QUALIFIED" || rng() > 0.5 ? dobFor(contact.ageRange ?? null, rng) : undefined;
        contact.eanCode = outcome === "QUALIFIED" || rng() > 0.6 ? eanFor(rng) : undefined;
        contact.notes = outcome === "QUALIFIED"
          ? "Client intéressé, dossier complet, prêt pour prise de contact du closer."
          : "Client intéressé mais informations incomplètes (EAN ou date de naissance manquante).";
        contact.score = outcome === "QUALIFIED" ? randomInt(rng, 80, 99) : randomInt(rng, 45, 75);
      }

      if (outcome === "NOT_INTERESTED") {
        contact.interestLevel = "FAIBLE";
        contact.score = randomInt(rng, 5, 20);
      }
      if (outcome === "CALLBACK_REQUESTED") {
        contact.interestLevel = "MOYEN";
        contact.score = randomInt(rng, 40, 60);
        callbacks.push({
          id: `callback-${callbacks.length + 1}`,
          contactId: contact.id,
          campaignId: group.campaignId,
          scheduledAt: isoDaysFromNow(randomInt(rng, -2, 6), randomInt(rng, 0, 8)),
          reason: "Contact occupé au moment de l'appel, rappel demandé.",
          done: false,
        });
      }

      if (outcome === "QUALIFIED") {
        const completeness = 100;
        const dossierStatus = pickWeighted<DossierStatus>(rng, [
          ["NOUVEAU_DOSSIER", 20],
          ["A_VERIFIER", 20],
          ["A_RAPPELER", 12],
          ["PRET_POUR_CLOSING", 22],
          ["CONTRAT_ENVOYE", 12],
          ["SIGNE", 10],
          ["PERDU", 4],
        ]);
        const dossierId = `dossier-${dossiers.length + 1}`;
        dossiers.push({
          id: dossierId,
          contactId: contact.id,
          campaignId: group.campaignId,
          callId: call.id,
          status: dossierStatus,
          completenessPercent: completeness,
          assignedCloserId: call.assignedCloserId,
          callSummary: call.summary,
          internalNote: "",
          createdAt: callStartedAt,
          updatedAt: isoDaysAgo(randomInt(rng, 0, 5)),
          statusHistory: [
            { status: "NOUVEAU_DOSSIER", at: callStartedAt, note: "Dossier créé automatiquement après appel qualifié." },
            ...(dossierStatus !== "NOUVEAU_DOSSIER"
              ? [{ status: dossierStatus, at: isoDaysAgo(randomInt(rng, 0, 4)) }]
              : []),
          ],
        });
      }

      contact.lastActivityAt = callStartedAt;
    }
  }

  // Do Not Contact — pick a handful of processed contacts across the pool.
  const dncCandidates = contacts.filter(
    (c) => c.status === "NOT_INTERESTED" || c.status === "IMPORTED",
  );
  const dncPicked = shuffle(rng, dncCandidates).slice(0, dncBudget);
  for (const c of dncPicked) {
    c.status = "DO_NOT_CONTACT";
    doNotContact.push({
      id: `dnc-${doNotContact.length + 1}`,
      contactId: c.id,
      reason: pick(rng, [
        "Demande explicite de ne plus être contacté.",
        "Numéro signalé comme indésirable.",
        "Refus catégorique lors de l'appel précédent.",
      ]),
      createdAt: isoDaysAgo(randomInt(rng, 1, 20)),
      createdBy: "Simon Lefèvre",
    });
  }

  // A few contacts mid-call for the "live activity" demo card.
  const callingCandidates = contacts.filter((c) => c.status === "READY_TO_CALL" && c.campaignId === "camp-ecofix");
  for (const c of shuffle(rng, callingCandidates).slice(0, 3)) {
    c.status = "CALLING";
  }

  const imports: ContactImportSummary[] = [
    {
      id: "import-1",
      fileName: "pour yanis.xlsx",
      totalRows: 3000,
      validRows: 2911,
      duplicateRows: 47,
      missingPhone: 22,
      brusselsRows: 0,
      invalidRows: 20,
      createdAt: isoDaysAgo(46),
    },
  ];

  auditLog.push(
    {
      id: "audit-1",
      action: "campaign.started",
      entityType: "Campaign",
      entityId: "camp-ecofix",
      userName: "Camille Dubuisson",
      metadata: { name: "Ecofix – Pilot Énergie Juillet" },
      createdAt: isoDaysAgo(14),
    },
    {
      id: "audit-2",
      action: "campaign.paused",
      entityType: "Campaign",
      entityId: "camp-clearwatt",
      userName: "Camille Dubuisson",
      metadata: { reason: "Révision du script en cours" },
      createdAt: isoDaysAgo(3),
    },
    {
      id: "audit-3",
      action: "contact.marked_do_not_contact",
      entityType: "Contact",
      userName: "Simon Lefèvre",
      metadata: { count: dncPicked.length },
      createdAt: isoDaysAgo(2),
    },
    {
      id: "audit-4",
      action: "dossier.exported",
      entityType: "QualifiedDossier",
      userName: "Yanis Bertrand",
      metadata: { count: 3 },
      createdAt: isoDaysAgo(1),
    },
    {
      id: "audit-5",
      action: "import.completed",
      entityType: "ContactImport",
      entityId: "import-1",
      userName: "Simon Lefèvre",
      metadata: { fileName: "pour yanis.xlsx", validRows: 2911 },
      createdAt: isoDaysAgo(46),
    },
  );

  const agentConfig: AgentConfiguration = {
    id: "agent-default",
    name: "Assistant EnergyQualify",
    language: "Français (Belgique)",
    speakingStyle: "Professionnel, calme, transparent",
    openingMessage: DEFAULT_OPENING_MESSAGE,
    objectionHandling: OBJECTIONS.map((o) => ({
      objection: o.phrase,
      response: o.aiResponse,
      action: o.action,
    })),
    requiredFields: [
      "Prénom",
      "Nom",
      "Adresse complète",
      "E-mail",
      "Téléphone",
      "Date de naissance",
      "Code EAN",
      "Fournisseur actuel",
      "Niveau d'intérêt",
      "Notes / résumé d'appel",
    ],
    escalationRules: [
      "Si le contact est agressif ou menaçant, terminer l'appel immédiatement.",
      "Si le contact demande un humain, proposer un rappel par un conseiller.",
      "Ne jamais insister après un deuxième refus clair.",
    ],
    complianceNotice: DEFAULT_COMPLIANCE_NOTICE,
    demoMode: true,
  };

  return { users, campaigns, contacts, calls, dossiers, callbacks, doNotContact, auditLog, agentConfig, imports };
}
