import {
  Range,
  RangeValue,
  RangeSet,
  StateEffect,
  StateField,
} from "@codemirror/state";

import { HighlightEvent } from "../ghci";

export class MininotationString extends RangeValue {
  private static nextID = 0;

  private _id: number;

  get id() {
    return this._id;
  }

  constructor() {
    super();

    // Equivalent to non-inclusive decorations
    this.startSide = 5e8;
    this.endSide = -6e8;

    this._id = MininotationString.nextID;
    MininotationString.nextID += 1;
  }
}

export const replaceMininotationEffect = StateEffect.define<{
  from: number;
  to: number;
  mininotationStrings: Range<MininotationString>[];
}>();

export const mininotationStringField = StateField.define<
  RangeSet<MininotationString>
>({
  create: () => RangeSet.empty,
  update: (minis, tr) => {
    if (tr.docChanged) {
      tr.changes.iterChangedRanges((filterFrom, filterTo) => {
        minis = minis.update({
          filterFrom,
          filterTo,
          filter: (miniFrom, miniTo) =>
            filterTo <= miniFrom || miniTo <= filterFrom,
        });
      });
      minis = minis.map(tr.changes);
    }

    for (let effect of tr.effects) {
      if (effect.is(replaceMininotationEffect)) {
        let { from, to, mininotationStrings } = effect.value;

        minis = minis.update({
          filterFrom: from,
          filterTo: to,
          filter: () => false,
          add: mininotationStrings,
        });
      }
    }

    return minis;
  },
});

export type TimestampedHighlightEvent = HighlightEvent & { time: number };

export const highlightTickEffect = StateEffect.define<number>();

export const highlightAddEffect =
  StateEffect.define<TimestampedHighlightEvent[]>();

export const highlightSetField = StateField.define({
  create: () => [],
  update: (value: TimestampedHighlightEvent[], tr) => {
    for (let effect of tr.effects) {
      if (effect.is(highlightTickEffect)) {
        value = value.filter((event) => {
          event.time + event.duration >= effect.value;
        });
      } else if (effect.is(highlightAddEffect)) {
        value = value.concat(effect.value);
      }
    }

    return value;
  },
});
