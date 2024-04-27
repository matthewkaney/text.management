import { StateField, StateEffect, Transaction } from "@codemirror/state";
import { EditorView, ViewPlugin, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";

const toggleTabFocus = StateEffect.define<void>();

const tabFocusField = StateField.define({
  create: () => false,
  update: (value, transaction) => {
    let newValue: boolean | null = null;

    // Remote transactions have no effect
    if (transaction.annotation(Transaction.remote)) {
      return value;
    }

    for (let effect of transaction.effects) {
      if (effect.is(toggleTabFocus)) {
        newValue = !value;
      }
    }

    return newValue ?? false;
  },
  provide: (field) => [
    EditorView.editorAttributes.of((view) =>
      view.state.field(field) ? { class: "cm-tab-focus" } : null
    ),
    keymap.from(field, (value) => (value ? [] : [indentWithTab])),
  ],
});

export const tabFocus = [
  tabFocusField,
  keymap.of([
    {
      key: "Escape",
      run: ({ dispatch }) => {
        dispatch({ effects: toggleTabFocus.of() });
        return true;
      },
    },
  ]),
];
