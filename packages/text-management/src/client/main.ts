import { session } from "./currentSession";
import { createEditor } from "./editor";

window.addEventListener("load", () => {
  const parent = document.body.appendChild(document.createElement("section"));
  parent.id = "editor";
  createEditor(session, parent);
});
