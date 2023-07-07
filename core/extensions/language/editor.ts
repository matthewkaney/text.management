import { Extension, Compartment } from "@codemirror/state";
import { evaluation } from "@management/cm-evaluate";

export class LanguageMode {
  display: HTMLIFrameElement | null = null;

  constructor(readonly name: string, readonly extensions: Extension) {}
}

export class JavascriptLanguageMode extends LanguageMode {
  constructor(name: string, extensions: Extension) {
    // let channel = new MessagePort();

    super(name, [
      extensions,
      evaluation((code) => {
        console.log(code);
      }),
    ]);
  }
}

const languageModeExtensions = new Compartment();

export function languageMode(initialMode?: LanguageMode) {
  return languageModeExtensions.of(initialMode?.extensions ?? []);
}

export function changeLanguageMode(mode?: LanguageMode) {
  return {
    effects: languageModeExtensions.reconfigure(mode?.extensions ?? []),
  };
}
