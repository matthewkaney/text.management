import {
  EditorState,
  StateEffect,
  Range,
  Extension,
  RangeSetBuilder,
  Prec,
} from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  keymap,
} from "@codemirror/view";

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

    // Tidal broadcasts every highlight to every editor; only handle our own.
    let ownedMinis = new Set<number>();

    const refreshOwnedMinis = () => {
      ownedMinis.clear();

      let cursor = view.state.field(mininotationStringField).iter();

      while (cursor.value !== null) {
        ownedMinis.add(cursor.value.id);
        cursor.next();
      }
    };

    refreshOwnedMinis();

    // The loop only runs while events are pending or highlights are still
    // live, and restarts when a new event arrives.
    let animationFrame: number | null = null;

    const schedule = () => {
      if (animationFrame === null) {
        animationFrame = requestAnimationFrame(update);
      }
    };

    const hasWork = () =>
      pendingHighlights.length > 0 ||
      view.state.field(highlightSetField).length > 0;

    let offTidalHighlight = api.onTidalHighlight((highlight) => {
      // TODO: Filter out duplicate highlights
      if (!ownedMinis.has(highlight.miniID)) return;

      pendingHighlights.push({
        ...highlight,
        time: fromNTPTime(highlight.onset),
      });

      schedule();
    });

    const update = (time: number) => {
      animationFrame = null;

      // Unmounted tab: drop stale events, clear anything still lit.
      if (!view.dom.isConnected) {
        pendingHighlights = [];

        if (view.state.field(highlightSetField).length) {
          view.dispatch({ effects: highlightTickEffect.of(time) });
        }

        return;
      }

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

      // Without this the queue grows for the life of the tab.
      pendingHighlights = stillPending;

      const needsExpiry = view.state
        .field(highlightSetField)
        .some((event) => event.time + event.duration < time);

      let effects: StateEffect<any>[] = [];

      // Tick before add: expire by time first, then append what's newly due.
      if (toAdd.length || needsExpiry) {
        effects.push(highlightTickEffect.of(time));
      }

      if (toAdd.length) {
        effects.push(highlightAddEffect.of(toAdd));
      }

      if (effects.length) {
        view.dispatch({ effects });
      }

      if (hasWork()) {
        schedule();
      }
    };

    return {
      update: (viewUpdate: ViewUpdate) => {
        if (
          viewUpdate.transactions.some((tr) =>
            tr.effects.some((effect) => effect.is(replaceMininotationEffect))
          )
        ) {
          refreshOwnedMinis();
        }

        // Resume after the tab is remounted, or if work is left over.
        if (view.dom.isConnected && hasWork()) {
          schedule();
        }
      },
      destroy: () => {
        offTidalHighlight();

        if (animationFrame !== null) {
          cancelAnimationFrame(animationFrame);
        }
      },
    };
  });

  return [
    highlighterPlugin,
    mininotationStringField,
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
