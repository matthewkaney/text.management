import { LanguageMode } from "@core/extensions/language/editor";

import { javascript } from "@codemirror/lang-javascript";

export default LanguageMode.define("Hydra", [javascript()]);
