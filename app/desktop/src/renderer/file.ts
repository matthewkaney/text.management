import { ChangeSet, StateEffect } from "@codemirror/state";
import { ViewPlugin } from "@codemirror/view";

import { LayoutView, changeSaveStateEffect } from "@core/extensions/layout";

import { DocumentUpdate } from "@core/api";

const saveEffect = StateEffect.define<number>();

export function fileSync(
  id: string,
  layout: LayoutView,
  update: (id: string, update: DocumentUpdate, saveState: boolean) => void,
  onSaved: (id: string, handler: (version: number) => void) => () => void
) {
  return ViewPlugin.define((view) => {
    let offSaved = onSaved(id, (version) => {
      view.dispatch({ effects: saveEffect.of(version) });
    });

    let lastSavedVersion = 0;
    let lastSavedDoc = view.state.doc;
    let history: ChangeSet[] = [];

    return {
      update: ({ state: { doc }, transactions }) => {
        for (let { changes, effects } of transactions) {
          for (let effect of effects) {
            if (effect.is(saveEffect) && effect.value > lastSavedVersion) {
              let savedVersion = effect.value;
              let savedIndex = savedVersion - lastSavedVersion;
              lastSavedVersion = savedVersion;
              lastSavedDoc = history
                .slice(0, savedIndex)
                .reduce(
                  (lastDoc, change) => change.apply(lastDoc),
                  lastSavedDoc
                );
              history = history.slice(savedIndex);
            }
          }

          if (!changes.empty) {
            history.push(changes);
            update(
              id,
              {
                version: lastSavedVersion + history.length,
                clientID: "",
                changes: changes.toJSON(),
              },
              lastSavedDoc.eq(doc)
            );
          }
        }

        let saveState = lastSavedDoc.eq(doc);
        layout.dispatch({
          effects: [changeSaveStateEffect.of({ id, saveState })],
        });
      },
      destroy: () => {
        offSaved();
      },
    };
  });
}
