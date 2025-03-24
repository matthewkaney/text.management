import satisfies from "semver/functions/satisfies";

// @ts-ignore
import editorPort from "./EditorPort.hs?raw";
// @ts-ignore
import editorSocket_1_9_2 from "./EditorSocket-1.9.2.hs?raw";
// @ts-ignore
import editorSocket_1_9_3 from "./EditorSocket-1.9.3.hs?raw";
// @ts-ignore
import tidalSetup from "./TidalSetup.hs?raw";

export function generateIntegrationCode(version: string) {
  let integrationCode = editorPort;

  // Between 1.9.2 and 1.9.3, the HOSC dependency changed and
  // HOSC renamed some modules/functions
  if (satisfies(version, "<=1.9.2")) {
    integrationCode = [integrationCode, editorSocket_1_9_2].join("\n");
  } else {
    integrationCode = [integrationCode, editorSocket_1_9_3].join("\n");
  }

  return [integrationCode, tidalSetup].join("\n");
}
