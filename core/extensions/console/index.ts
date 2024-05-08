import { Evaluation, Log } from "@core/api";

import { messageConstructor } from "./message";
import "./style.css";

export function console(history: (Evaluation | Log)[] = []) {
  let consoleNode = document.createElement("div");
  consoleNode.classList.add("cm-console");

  consoleNode.setAttribute("role", "log");
  consoleNode.tabIndex = 0;

  let consoleWrapperNode = document.createElement("div");
  consoleNode.appendChild(consoleWrapperNode);

  let consoleHeight = 0;
  let wrapperHeight = 0;

  const observer = new ResizeObserver((elements) => {
    for (let element of elements) {
      if (element.target === consoleNode) {
        consoleHeight = element.contentBoxSize[0].blockSize;
      } else if (element.target === consoleWrapperNode) {
        wrapperHeight = element.contentBoxSize[0].blockSize;
      }
    }

    consoleWrapperNode.classList.toggle(
      "scrolling",
      wrapperHeight > consoleHeight
    );
  });

  observer.observe(consoleNode);
  observer.observe(consoleWrapperNode);

  for (let message of history) {
    consoleWrapperNode.appendChild(messageConstructor(message));
  }

  let visible = true;

  const toggleVisibility = (value?: boolean) => {
    visible = value ?? !visible;

    consoleNode.style.display = visible ? "inherit" : "none";
  };

  return {
    dom: consoleNode,
    update(message: Evaluation | Log) {
      let lastElement = consoleWrapperNode.appendChild(
        messageConstructor(message)
      );

      toggleVisibility(true);
      lastElement.scrollIntoView({ behavior: "smooth" });
    },
    toggleVisibility,
    destroy() {},
  };
}
