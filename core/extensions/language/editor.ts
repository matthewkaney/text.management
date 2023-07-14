import { Extension, Compartment } from "@codemirror/state";
import { evaluation } from "@management/cm-evaluate";

export class LanguageMode {
  display: HTMLIFrameElement | null = null;

  constructor(readonly name: string, readonly extensions: Extension) {}
}

export class JavascriptLanguageMode extends LanguageMode {
  constructor(name: string, extensions: Extension, src: string) {
    let channel = new MessageChannel();

    super(name, [
      extensions,
      evaluation((code) => {
        channel.port1.postMessage({ method: "evaluate", code });
      }),
    ]);

    this.display = document.createElement("iframe");
    this.display.src = src;

    this.display.addEventListener("load", () => {
      this.display?.contentWindow?.postMessage("channel", "*", [channel.port2]);
    });
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
