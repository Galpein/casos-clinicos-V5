"use client";

import { create } from "zustand";
import type { ClinicalCase } from "@/types/clinical-case";
import { blankCase, withComputedStatus } from "@/lib/case-factory";
import {
  addOutcome,
  addTreatment,
  aiTreatment,
  setTimeline,
  validateAll as validateAllPatch,
} from "@/lib/assistant/apply";
import {
  EXAMPLE_INPUT,
  nextPrompt,
  respond,
  setCaseTypeFromContext,
} from "@/lib/assistant/engine";
import type { ChatMessage, ProposalSet } from "@/lib/assistant/types";

let mid = 0;
const newId = () => `m${mid++}`;

const WELCOME =
  "Soy tu asistente de casos clínicos. Cuéntame el caso con tus palabras (o pega una " +
  "historia / PPT) y lo iré redactando a la izquierda en tiempo real. Te propondré las " +
  "mejores opciones y tú solo validas o corriges.";

interface CreationState {
  caso: ClinicalCase;
  messages: ChatMessage[];
  proposals?: ProposalSet;
  highlight?: string;
  thinking: boolean;
  /** Campo de texto libre que el asistente está esperando (motivo, etc.). */
  pendingField?: string;

  sendUserText: (text: string) => void;
  pickProposal: (id: string) => void;
  skipProposal: () => void;
  validateAll: () => void;
  applyExample: () => void;
  reset: () => void;
}

function normalize(c: ClinicalCase): ClinicalCase {
  return setCaseTypeFromContext(c);
}

export const useCreationStore = create<CreationState>((set, get) => ({
  caso: blankCase(),
  messages: [{ id: newId(), role: "assistant", text: WELCOME }],
  thinking: false,

  sendUserText: (text) => {
    const trimmed = text.trim();
    if (!trimmed || get().thinking) return;

    const pending = get().pendingField;

    set((s) => ({
      messages: [...s.messages, { id: newId(), role: "user", text: trimmed }],
      thinking: true,
      proposals: undefined,
      pendingField: undefined,
    }));

    const turn = respond(get().caso, trimmed, pending);

    // Mensaje del asistente tras un breve "pensando".
    setTimeout(() => {
      set((s) => ({
        messages: [
          ...s.messages,
          { id: newId(), role: "assistant", text: turn.message, applied: turn.patches.map((p) => p.summary) },
        ],
      }));

      // Relleno en vivo: aplica los parches uno a uno con stagger.
      turn.patches.forEach((patch, i) => {
        setTimeout(() => {
          set((s) => ({ caso: normalize(patch.apply(s.caso)), highlight: patch.field }));
        }, 350 + i * 420);
      });

      const settle = 350 + turn.patches.length * 420 + 200;
      setTimeout(() => {
        set({
          proposals: turn.proposals,
          highlight: turn.highlight,
          pendingField: turn.expectsText,
          thinking: false,
        });
      }, settle);
    }, 450);
  },

  pickProposal: (id) => {
    const ps = get().proposals;
    const opt = ps?.options.find((o) => o.id === id);
    if (!ps || !opt) return;

    set((s) => ({
      caso: normalize(opt.apply(s.caso)),
      highlight: ps.field,
      proposals: undefined,
      messages: [...s.messages, { id: newId(), role: "user", text: opt.label }],
      thinking: true,
    }));

    advance(set, get);
  },

  skipProposal: () => {
    const ps = get().proposals;
    if (!ps) return;
    set((s) => ({
      caso: normalize(skipField(s.caso, ps.field)),
      proposals: undefined,
      highlight: ps.field,
      messages: [...s.messages, { id: newId(), role: "user", text: "No documentado" }],
      thinking: true,
    }));
    advance(set, get);
  },

  validateAll: () => {
    set((s) => ({
      caso: validateAllPatch(s.caso),
      messages: [
        ...s.messages,
        {
          id: newId(),
          role: "assistant",
          text: "He marcado como **validado por ti** todo lo que estaba propuesto. El estado del caso se ha recalculado.",
        },
      ],
    }));
  },

  applyExample: () => {
    get().sendUserText(EXAMPLE_INPUT);
  },

  reset: () => {
    mid = 0;
    set({
      caso: blankCase(),
      messages: [{ id: newId(), role: "assistant", text: WELCOME }],
      proposals: undefined,
      highlight: undefined,
      pendingField: undefined,
      thinking: false,
    });
  },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function advance(
  set: (partial: Partial<CreationState>) => void,
  get: () => CreationState,
) {
  setTimeout(() => {
    const turn = nextPrompt(get().caso);
    set({
      messages: [
        ...get().messages,
        { id: newId(), role: "assistant", text: turn.message },
      ],
      proposals: turn.proposals,
      highlight: turn.highlight,
      pendingField: turn.expectsText,
      thinking: false,
    });
  }, 500);
}

/** "No documentado" explícito para que el campo cuente como respondido. */
function skipField(c: ClinicalCase, field: string): ClinicalCase {
  switch (field) {
    case "management":
      return addTreatment(
        c,
        aiTreatment("No documentado", { type: "other", status: "not_documented", validatedByHcp: true, concept: null }),
      );
    case "followUp":
      return addOutcome(c, { globalOutcome: "unknown", validatedByHcp: true });
    case "timeline":
      return setTimeline(c, [{ when: "—", event: "No documentado" }]);
    default:
      return withComputedStatus(c);
  }
}
