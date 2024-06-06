import satisfies from "semver/functions/satisfies";

import v1_9_2Hosc from "bundle-text:./Hosc-1.9.2.ghci";
import v1_9_3Hosc from "bundle-text:./Hosc-1.9.3.ghci";
import editorPort from "bundle-text:./EditorPort.ghci";
import streamGetNow from "bundle-text:./StreamGetNow-1.9.x.ghci";
import integrations from "bundle-text:./Integrations.ghci";
import v1_9Hacks from "bundle-text:./1.9.x-Hacks.ghci";

export function generateIntegrationCode(version: string) {
  let integrationCode = "";

  // Between 1.9.2 and 1.9.3, the HOSC dependency changed and
  // HOSC renamed some modules/functions
  if (satisfies(version, "<=1.9.2")) {
    integrationCode = integrationCode.concat("\n", v1_9_2Hosc);
  } else {
    integrationCode = integrationCode.concat("\n", v1_9_3Hosc);
  }

  integrationCode = integrationCode.concat("\n", editorPort);

  if (satisfies(version, "<1.10.0")) {
    integrationCode = integrationCode.concat("\n", streamGetNow);
  }

  integrationCode = integrationCode.concat("\n", integrations);

  if (satisfies(version, "<1.10.0")) {
    integrationCode = integrationCode.concat("\n", v1_9Hacks);
  }

  return integrationCode;
}
