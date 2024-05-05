import { StateEffect, StateField } from "@codemirror/state";
import { EditorView, ViewPlugin, Decoration } from "@codemirror/view";

const blinkEffect = StateEffect.define<void>();

const blinkField = StateField.define({
  create: () => {
    return false;
  },
  update(value, tr) {
    for (let e of tr.effects) {
      if (e.is(blinkEffect)) {
        value = !value;
      }
    }

    return value;
  },
});

const highlightDecoration = Decoration.mark({
  attributes: { style: "background-color: deeppink" },
});

const blinkDecoration = EditorView.decorations.from(blinkField, (value) =>
  value ? Decoration.set([highlightDecoration.range(0, 10)]) : Decoration.none
);

const blinkPlugin = ViewPlugin.define((view) => {
  let interval = setInterval(
    () => view.dispatch({ effects: [blinkEffect.of()] }),
    1000
  );

  return {
    destroy: () => {
      clearInterval(interval);
    },
  };
});

export const blinkExtension = [blinkField, blinkPlugin, blinkDecoration];
