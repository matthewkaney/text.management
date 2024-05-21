import { StateField, StateEffect, Transaction } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";

const toggleTabFocus = StateEffect.define<null | boolean>();

const tabFocusField = StateField.define({
  create: () => false,
  update: (value, transaction) => {
    let newValue: boolean | null = null;

    for (let effect of transaction.effects) {
      if (effect.is(toggleTabFocus)) {
        newValue = effect.value ?? !value;
      }
    }

    return (
      newValue ??
      (transaction.annotation(Transaction.userEvent) !== undefined
        ? false
        : value)
    );
  },
  provide: (field) => [
    EditorView.editorAttributes.of((view) =>
      view.state.field(field) ? { class: "cm-tab-focus" } : null
    ),
    keymap.from(field, (value) => (value ? [] : [indentWithTab])),
    EditorView.focusChangeEffect.of((_, focusing) =>
      focusing ? null : toggleTabFocus.of(false)
    ),
  ],
});

export const tabFocus = [
  tabFocusField,
  keymap.of([
    {
      key: "Escape",
      run: ({ dispatch }) => {
        dispatch({ effects: toggleTabFocus.of(null) });
        return true;
      },
    },
  ]),
];
