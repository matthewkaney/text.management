import dashify from "dashify";

import { Config, ConfigExtension } from "@core/state";

import { ThemeSettingsSchema } from "../settings";

import defaultLight from "./defaultLight.json";
import defaultDark from "./defaultDark.json";

export class ColorScheme {
  private config: ConfigExtension<typeof ThemeSettingsSchema>;

  private styleTag = document.head.appendChild(document.createElement("style"));

  private lightStyleMod: string;
  private darkStyleMod: string;

  constructor(configuration: Config) {
    this.config = configuration.extend(ThemeSettingsSchema);

    this.config.on("change", () => {
      this.update();
    });

    this.lightStyleMod = this.buildStyleRule(defaultLight, "light");
    this.darkStyleMod = this.buildStyleRule(defaultDark, "dark");

    this.update();
  }

  private update() {
    let { "theme.customColors": customColors } = this.config.data;
    customColors = customColors ?? {};

    //TODO: Filter custom colors

    let customStyleMod = this.buildStyleRule(
      customColors as { [name: string]: string }
    );

    this.styleTag.textContent = [
      this.lightStyleMod,
      this.darkStyleMod,
      customStyleMod,
    ].join("\n");
  }

  private buildStyleRule(
    colorSpec: { [name: string]: string },
    mode?: "light" | "dark"
  ) {
    let properties: string[] = [];

    for (let key in colorSpec) {
      properties.push(`--color-${dashify(key)}: ${colorSpec[key]};`);
    }

    let rule = `:root { ${properties.join(" ")} }`;

    if (mode) {
      rule = `@media (prefers-color-scheme: ${mode}) { ${rule} }`;
    }

    return rule;
  }
}
