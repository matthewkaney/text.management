import { session } from "./currentSession";
import { Editor } from "./editor";

window.addEventListener("load", () => {
  const parent = document.body.appendChild(document.createElement("section"));
  parent.id = "editor";
  new Editor(session, parent);
});
