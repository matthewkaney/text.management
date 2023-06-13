import { Text, ChangeSet, StateField, StateEffect } from "@codemirror/state";
import { ViewPlugin } from "@codemirror/view";

import { LayoutView, changeSaveStateEffect } from "@core/extensions/layout";

import { DocumentUpdate } from "@core/api";

const saveEffect = StateEffect.define<number>();

const saveHistoryState = StateField.define({
  create: (state) => ({
    lastSaved: 0,
    lastSavedDoc: state.doc,
    history: [] as Text[],
  }),
  update: (value, tr) => {
    if (!tr.changes.empty) {
      value = {
        ...value,
        history: [...value.history, tr.newDoc],
      };
    }

    for (let effect of tr.effects) {
      if (effect.is(saveEffect) && effect.value > value.lastSaved) {
        value = {
          lastSaved: effect.value,
          lastSavedDoc: value.history[effect.value - value.lastSaved - 1],
          history: value.history.slice(effect.value - value.lastSaved),
        };
      }
    }

    return value;
  },
});

export function fileSync(
  id: string,
  layout: LayoutView,
  update: (id: string, update: DocumentUpdate, saveState: boolean) => void,
  onSaved: (id: string, handler: (version: number) => void) => () => void
) {
  return ViewPlugin.define(
    (view) => {
      let offSaved = onSaved(id, (version) => {
        view.dispatch({ effects: saveEffect.of(version) });
      });

      let saveHistory = view.state.field(saveHistoryState);

      return {
        update: ({ state, changes, transactions }) => {
          if (saveHistory !== state.field(saveHistoryState)) {
            saveHistory = state.field(saveHistoryState);

            let { lastSaved, lastSavedDoc, history } = saveHistory;
            let saveState = lastSavedDoc.eq(state.doc);

            update(
              id,
              {
                version: lastSaved + history.length,
                clientID: "",
                changes: changes.toJSON(),
              },
              saveState
            );

            layout.dispatch({
              effects: [changeSaveStateEffect.of({ id, saveState })],
            });
          }
        },
        destroy: () => {
          offSaved();
        },
      };
    },
    { provide: () => saveHistoryState }
  );
}
