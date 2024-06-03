import { syntaxTree } from "@codemirror/language";
import { IterMode } from "@lezer/common";
import { ViewPlugin, ViewUpdate } from "@codemirror/view";

export function formatter() {
  const plugin = ViewPlugin.define((view) => ({
    update: (update: ViewUpdate) => {
      console.log(syntaxTree(update.state));
      const tree = syntaxTree(update.state);
      const cursor = tree.cursor(IterMode.IncludeAnonymous);
      while (cursor.next()) {
        console.log(cursor.node.type.name);
      }
      cursor.iterate((node) => {
        console.log(node.from, node.to);
        console.log(node.type.isSkipped);
        console.log(node.type.name);
        return true;
      });
    },
  }));
  return [plugin];
}
