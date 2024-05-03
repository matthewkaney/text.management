const multilineBlock =
  /^[ \t]*:{[ \t]*\r?\n((?:[ \t]*(?:[^:\s].*|:|:[^}].*|:}.*\S.*)?\r?\n)*)[ \t]*:}[ \t]*$/m;
const indentedStatement = /([ \t]*)\S.*(?:\r?\n\1[ \t]+\S.*)*/g;

export function extractStatements(code: string) {
  // Partially parsed blocks of code
  let blocks: string[] = code.split(multilineBlock);
  let plainBlock: string, bracketBlock: string;

  // Final parsed statements
  let statements: string[] = [];

  while (blocks.length > 0) {
    [plainBlock, bracketBlock, ...blocks] = blocks;

    for (let [statement] of plainBlock.matchAll(indentedStatement)) {
      statements.push(statement);
    }

    if (bracketBlock) {
      statements.push(bracketBlock);
    }
  }

  return statements;
}
