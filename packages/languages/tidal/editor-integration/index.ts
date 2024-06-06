import satisfies from "semver/functions/satisfies";

import hosc_1_9_2 from "bundle-text:./Hosc-1.9.2.ghci";
import hosc_1_9_3 from "bundle-text:./Hosc-1.9.3.ghci";
import editorPort from "bundle-text:./EditorPort.ghci";
import streamGetNow from "bundle-text:./StreamGetNow-1.9.x.ghci";
import tidalSetup from "bundle-text:./TidalSetup.ghci";

export function generateIntegrationCode(version: string) {
  let integrationCode = "";

  // Between 1.9.2 and 1.9.3, the HOSC dependency changed and
  // HOSC renamed some modules/functions
  if (satisfies(version, "<=1.9.2")) {
    integrationCode = integrationCode.concat("\n", hosc_1_9_2);
  } else {
    integrationCode = integrationCode.concat("\n", hosc_1_9_3);
  }

  integrationCode = integrationCode.concat("\n", editorPort);

  if (satisfies(version, "<1.10.0")) {
    integrationCode = integrationCode.concat("\n", streamGetNow);
  }

  integrationCode = integrationCode.concat("\n", tidalSetup);

  return integrationCode;
}
