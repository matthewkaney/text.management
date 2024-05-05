import {
  EditorState,
  StateEffect,
  StateField,
  Range,
  RangeValue,
  RangeSet,
  Extension,
  RangeSetBuilder,
} from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";

import {
  evaluation,
  evalEffect,
  commandEffect,
  evalHandler,
} from "@management/cm-evaluate";

export function evaluationWithHighlights(action: evalHandler): Extension {
  const handler = EditorState.transactionExtender.of((tr) => {
    // New effects to be added
    let effects = [];

    for (let effect of tr.effects) {
      if (effect.is(evalEffect)) {
        let { from, to } = effect.value;
        let code = tr.newDoc.sliceString(from, to);
        let { newCode, mininotationStrings } = wrapMininotation(code, from);

        action(newCode);

        effects.push(
          replaceMininotationEffect.of({ from, to, mininotationStrings })
        );
      } else if (effect.is(commandEffect)) {
        action(effect.value.method);
      }
    }

    return effects.length > 0 ? { effects } : null;
  });

  return [
    evaluation(),
    handler,
    mininotationStringField,
    mininotationDecorations,
  ];
}

class MininotationString extends RangeValue {
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

const replaceMininotationEffect = StateEffect.define<{
  from: number;
  to: number;
  mininotationStrings: Range<MininotationString>[];
}>();

const mininotationStringField = StateField.define<RangeSet<MininotationString>>(
  {
    create: () => RangeSet.empty,
    update: (minis, tr) => {
      let initialMinis = minis;

      if (tr.docChanged) {
        tr.changes.iterChangedRanges((filterFrom, filterTo) => {
          minis = minis.update({ filterFrom, filterTo, filter: () => false });
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

      console.log("Field changed: " + (initialMinis !== minis));

      return minis;
    },
  }
);

function wrapMininotation(code: string, from: number) {
  let mininotationStrings: Range<MininotationString>[] = [];

  let newCode = "";

  let parts = code.split(/("(?:(?!(?:\\|")).|\\.)*")/);

  while (parts.length > 0) {
    let string: string;
    [string, ...parts] = parts;

    if (string.match(/^".*"$/)) {
      let miniString = new MininotationString();
      newCode += `(deltaContext 0 ${miniString.id} ${string})`;
      mininotationStrings.push(miniString.range(from, from + string.length));
    } else {
      newCode += string;
    }

    from += string.length;
  }

  console.log("Result: " + newCode);
  console.log("Highlights: " + JSON.stringify(mininotationStrings));

  return { newCode, mininotationStrings };
}

const highlightDecoration = Decoration.mark({
  attributes: { style: "background-color: deeppink" },
});

const mininotationDecorations = EditorView.decorations.from(
  mininotationStringField,
  (minis) => {
    let builder = new RangeSetBuilder<Decoration>();

    let cursor = minis.iter();

    while (cursor.value !== null) {
      let { from, to } = cursor;
      builder.add(from, to, highlightDecoration);
      cursor.next();
    }

    console.log("Built decorations:");
    console.log(builder);

    return builder.finish();
  }
);
