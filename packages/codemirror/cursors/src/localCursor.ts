import { StateField } from "@codemirror/state";

export interface Cursor {
  id: string;
  position: any;
}

export const localCursor = StateField.define({
  create: (state) => {
    state.selection.toJSON();
  },

  update: (value, transaction) => {},
});
