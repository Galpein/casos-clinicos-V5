/**
 * Metadatos visuales por patología (icono + paleta), indexados por el concepto
 * normalizado del diagnóstico principal. Compartido por la tarjeta, el detalle
 * y la biblioteca para que el color de cada patología sea consistente.
 */

import type { ClinicalCase } from "@/types/clinical-case";

function IconDA({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}
function IconEC({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}
function IconPS({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconRO({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="7.05" y2="7.05" /><line x1="16.95" y1="16.95" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="7.05" y2="16.95" /><line x1="16.95" y1="7.05" x2="19.78" y2="4.22" />
    </svg>
  );
}
function IconUC({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function IconDefault({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export interface ConditionMeta {
  bg: string;
  ring: string;
  color: string;
  /** clases para el chip del código del caso (coloreado por patología) */
  codeChip: string;
  gradient: string;
  label: string;
  Icon: React.FC<{ className?: string }>;
}

const BY_CONCEPT: Record<string, ConditionMeta> = {
  atlas_disease_atopic_dermatitis: {
    bg: "bg-orange-100", ring: "ring-orange-200", color: "text-orange-600",
    codeChip: "bg-orange-100 text-orange-700 ring-orange-200",
    gradient: "from-orange-500 to-amber-400", label: "Dermatitis atópica", Icon: IconDA,
  },
  atlas_disease_contact_eczema: {
    bg: "bg-emerald-100", ring: "ring-emerald-200", color: "text-emerald-600",
    codeChip: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    gradient: "from-green-500 to-emerald-400", label: "Eccema de contacto", Icon: IconEC,
  },
  atlas_disease_psoriasis: {
    bg: "bg-violet-100", ring: "ring-violet-200", color: "text-violet-600",
    codeChip: "bg-violet-100 text-violet-700 ring-violet-200",
    gradient: "from-purple-500 to-violet-400", label: "Psoriasis", Icon: IconPS,
  },
  atlas_disease_rosacea: {
    bg: "bg-rose-100", ring: "ring-rose-200", color: "text-rose-600",
    codeChip: "bg-rose-100 text-rose-700 ring-rose-200",
    gradient: "from-red-500 to-rose-400", label: "Rosácea", Icon: IconRO,
  },
  atlas_disease_chronic_urticaria: {
    bg: "bg-sky-100", ring: "ring-sky-200", color: "text-sky-600",
    codeChip: "bg-sky-100 text-sky-700 ring-sky-200",
    gradient: "from-blue-500 to-cyan-400", label: "Urticaria crónica", Icon: IconUC,
  },
};

const DEFAULT_META: ConditionMeta = {
  bg: "bg-slate-100", ring: "ring-slate-200", color: "text-slate-500",
  codeChip: "bg-slate-100 text-slate-600 ring-slate-200",
  gradient: "from-slate-500 to-slate-400", label: "Caso clínico", Icon: IconDefault,
};

/** Mapa código-prefijo → concepto, para casos sin concepto resuelto aún. */
const PREFIX_TO_CONCEPT: Record<string, string> = {
  DA: "atlas_disease_atopic_dermatitis",
  EC: "atlas_disease_contact_eczema",
  PS: "atlas_disease_psoriasis",
  RO: "atlas_disease_rosacea",
  UC: "atlas_disease_chronic_urticaria",
};

export function conditionMeta(caso: ClinicalCase): ConditionMeta {
  const conceptId =
    caso.primaryDiagnosis.concept?.conceptId ??
    PREFIX_TO_CONCEPT[caso.caseId.split("-")[0]] ??
    "";
  return BY_CONCEPT[conceptId] ?? DEFAULT_META;
}
