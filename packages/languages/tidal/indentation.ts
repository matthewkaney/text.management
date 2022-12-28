import { indentService } from "@codemirror/language";

export function indentation() {
  return indentService.of((context, pos) => {
    console.log(context);
    return null;
  });
}
