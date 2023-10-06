export function injectHighlights(code: string) {
  let newCode = "";

  let parts = code.split(/("(?:(?!(?:\\|")).|\\.)*")/);
  console.log(parts);

  while (parts.length > 0) {
    let prefix: string, string: string;
    [prefix, string, ...parts] = parts;

    if (prefix) {
      newCode += prefix;
    }

    if (string) {
      newCode += `(deltaContext ${newCode.length} 0 ${prefix})`;
    }
  }

  console.log("Result: " + newCode);

  return newCode;
}
