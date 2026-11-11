import type { FocusEvent, PointerEvent } from "react";

type FieldElement = HTMLInputElement | HTMLTextAreaElement;

/**
 * Browsers keep a form-history bucket per field name. Question ids such as
 * `q11a` and `w1` are reused on every paper and lesson, and the answer boxes
 * had no name, so one paper's typed values were offered on the next.
 * The name is scoped to the paper or lesson. Autocomplete stays off, and a
 * tap marks the box read-only until focus so the suggestion list does not open.
 * The controlled value is unchanged, so the current attempt still restores.
 */
export function answerFieldName(scope: string, fieldId: string) {
  return `answer-${scope}-${fieldId}`;
}

export function choiceFieldName(scope: string, fieldId: string) {
  return `choice-${scope}-${fieldId}`;
}

function bindSuggestionBlock(node: FieldElement | null, locked: boolean) {
  if (!node) return;
  node.dataset.answerLocked = locked ? "1" : "0";
  if (node.dataset.suggestBound === "1") return;
  node.dataset.suggestBound = "1";
  node.addEventListener("pointerdown", () => {
    if (node.dataset.answerLocked === "1") return;
    node.readOnly = true;
  });
  node.addEventListener("focus", () => {
    if (node.dataset.answerLocked === "1") return;
    node.readOnly = false;
  });
}

export function answerFieldProps(scope: string, fieldId: string, locked = false) {
  const name = answerFieldName(scope, fieldId);
  return {
    name,
    id: name,
    autoComplete: "off" as const,
    autoCorrect: "off" as const,
    autoCapitalize: "none" as const,
    spellCheck: false as const,
    "data-1p-ignore": "true",
    "data-lpignore": "true",
    "data-form-type": "other",
    readOnly: locked,
    ref: (node: FieldElement | null) => bindSuggestionBlock(node, locked),
    onPointerDown: (event: PointerEvent<FieldElement>) => {
      if (locked) return;
      event.currentTarget.readOnly = true;
    },
    onFocus: (event: FocusEvent<FieldElement>) => {
      if (locked) return;
      event.currentTarget.readOnly = false;
    },
  };
}
