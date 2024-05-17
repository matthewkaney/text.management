import { Compartment } from "@codemirror/state";
import { ViewPlugin, lineNumbers as cmLineNumbers } from "@codemirror/view";
import { Config } from "@core/state";
import { SettingsSchema } from "@core/state/schema";

const editorSettings = {
  properties: {
    "editor.lineNumbers": {
      enum: ["off", "on"],
      default: "on",
    },
  },
} as const satisfies SettingsSchema;

const lineNumberConf = new Compartment();

export function lineNumbers(configuration: Config) {
  const plugin = ViewPlugin.define((view) => {
    const editorConfig = configuration.extend(editorSettings);
    const unlisten = editorConfig.on("change", (data) => {
      let lineNumberSetting = data["editor.lineNumbers"] ?? "on";

      view.dispatch({
        effects: lineNumberConf.reconfigure(
          lineNumberSetting === "on" ? cmLineNumbers() : []
        ),
      });
    });

    return {
      destroy: () => {
        unlisten();
      },
    };
  });

  let lineNumberSetting = configuration.data["editor.lineNumbers"] ?? "on";

  return [
    lineNumberConf.of(lineNumberSetting === "on" ? cmLineNumbers() : []),
    plugin,
  ];
}
