import {
  EditorState,
  StateEffect,
  Range,
  Extension,
  RangeSetBuilder,
  Prec,
} from "@codemirror/state";
import { Decoration, EditorView, ViewPlugin, keymap } from "@codemirror/view";

import {
  evaluation,
  evaluationEffect,
  evaluationKeymap,
} from "@management/cm-evaluate";

import {
  MininotationString,
  mininotationStringField,
  replaceMininotationEffect,
  TimestampedHighlightEvent,
  highlightTickEffect,
  highlightAddEffect,
  highlightSetField,
} from "./state";

export function evaluationWithHighlights(
  action: (evaluation: { code: string }) => void
): Extension {
  const handler = EditorState.transactionExtender.of((tr) => {
    // New effects to be added
    let effects = [];

    for (let effect of tr.effects) {
      if (effect.is(evaluationEffect)) {
        if (effect.value.span !== undefined) {
          let { from, to } = effect.value.span;
          let { newCode, mininotationStrings } = wrapMininotation(
            effect.value.code,
            from
          );

          action({ code: newCode });

          effects.push(
            replaceMininotationEffect.of({ from, to, mininotationStrings })
          );
        } else {
          action(effect.value);
        }
      }
    }

    return effects.length > 0 ? { effects } : null;
  });

  return [
    keymap.of(evaluationKeymap),
    evaluation(),
    handler,
    mininotationStringField,
  ];
}

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

  return { newCode, mininotationStrings };
}

import { ElectronAPI } from "@core/api";
import { fromNTPTime } from "@core/osc/utils";

export function highlighter(api: typeof ElectronAPI): Extension {
  const highlighterPlugin = ViewPlugin.define((view) => {
    let pendingHighlights: TimestampedHighlightEvent[] = [];

    let offTidalHighlight = api.onTidalHighlight((highlight) => {
      // TODO: Filter out duplicate highlights
      pendingHighlights.push({
        ...highlight,
        time: fromNTPTime(highlight.onset),
      });
    });

    const update = (time: number) => {
      let effects: StateEffect<any>[] = [];

      effects.push(highlightTickEffect.of(time));

      let toAdd: TimestampedHighlightEvent[] = [];
      let stillPending: TimestampedHighlightEvent[] = [];

      // Partition the pending events based on whether they're ready
      for (let event of pendingHighlights) {
        if (event.time > time) {
          stillPending.push(event);
        } else {
          if (event.time + event.duration >= time) {
            toAdd.push(event);
          }
          // Any events that were just dispatched and have already ended
          // are discarded
        }
      }

      if (toAdd.length) {
        effects.push(highlightAddEffect.of(toAdd));
      }

      if (effects.length) {
        view.dispatch({ effects });
      }

      animationFrame = requestAnimationFrame(update);
    };

    let animationFrame = requestAnimationFrame(update);

    return {
      destroy: () => {
        offTidalHighlight();
        cancelAnimationFrame(animationFrame);
      },
    };
  });

  return [
    highlighterPlugin,
    highlightSetField,
    Prec.highest(highlightDecorations),
  ];
}

const highlightDecoration = Decoration.mark({
  attributes: {
    style:
      "background-color: var(--color-livecode-active-event-background); color: var(--color-foreground-inverted)",
  },
});

const highlightDecorations = EditorView.decorations.compute(
  [mininotationStringField, highlightSetField],
  (state) => {
    const setBuilder = new RangeSetBuilder<Decoration>();

    const mininotationRanges = state.field(mininotationStringField);
    const currentHighlights = state.field(highlightSetField);

    let mininotationCursor = mininotationRanges.iter();

    while (mininotationCursor.value !== null) {
      let { from, value: miniString } = mininotationCursor;

      let highlightsInMini = currentHighlights
        .filter(({ miniID }) => miniID === miniString.id)
        .sort((a, b) => a.from - b.from);

      for (let highlight of highlightsInMini) {
        setBuilder.add(
          highlight.from + from,
          highlight.to + from,
          highlightDecoration
        );
      }

      mininotationCursor.next();
    }

    return setBuilder.finish();
  }
);
