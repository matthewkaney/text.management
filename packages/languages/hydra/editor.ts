import { JavascriptLanguageMode } from "@core/extensions/language/editor";

import { javascript } from "@codemirror/lang-javascript";

export default new JavascriptLanguageMode(
  "Hydra",
  [javascript()],
  "../hydra/index.html"
);
