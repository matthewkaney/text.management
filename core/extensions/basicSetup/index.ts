import {
  lineNumbers,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
} from "@codemirror/view";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
} from "@codemirror/language";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { decorateEmptyLines } from "./emptyLines";
import { tabFocus } from "./tabTrapping";

import { atom, Store, StoreValue } from "nanostores";
import { Compartment, Extension } from "@codemirror/state";
import { ViewPlugin } from "@codemirror/view";

const tabSetting = atom(false);

function fromStore<StoreType extends Store>(
  store: StoreType,
  compute: (value: StoreValue<StoreType>) => Extension
): Extension {
  const compartment = new Compartment();
  const storeUpdater = ViewPlugin.define(({ dispatch }) => {
    const unsubscribe = store.subscribe((value) => {
      dispatch({ effects: compartment.reconfigure(compute(value)) });
    });

    return {
      destroy: () => {
        unsubscribe();
      },
    };
  });

  return [compartment.of(compute(store.get()))];
}

export const basicSetup = [
  // lineNumbers(),
  drawSelection(),
  highlightActiveLine(),
  highlightActiveLineGutter(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  closeBrackets(),
  history(),
  keymap.of([...defaultKeymap, ...closeBracketsKeymap, ...historyKeymap]),
  decorateEmptyLines(),
  tabFocus,
];
