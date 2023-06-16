import { Extension, Compartment } from "@codemirror/state";

export class LanguageMode {
  static define(name: string, extensions: Extension) {
    return new LanguageMode(name, extensions);
  }

  private constructor(readonly name: string, readonly extensions: Extension) {}
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
