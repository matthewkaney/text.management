import { JavascriptLanguageMode } from "@core/extensions/language/editor";

import { javascript } from "@codemirror/lang-javascript";

import source from "./viewer.html";

export default new JavascriptLanguageMode("Hydra", [], source);
