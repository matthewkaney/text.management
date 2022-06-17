# CodeMirror 6 Code Evaluation

```
npm install @management/txt-evaluate
```

## Basic Usage

```javascript
import { EditorView, basicSetup } from "codemirror";
import { evaluation } from "@management/txt-evaluate";

// Define a function that handles evaluated code
function myEval(code) {
  eval(code);
  // ... or whatever else you want to do
}

// Then, pass that into a codemirror instance
let view = new EditorView({
  extensions: [evaluation(myEval), basicSetup],
  parent: document.body,
});
```

By default, this creates two keyboard shortcuts:

- **Shift+Enter**: Evaluate the current line
- **Ctrl+Enter (Cmd+Enter on Mac)**: Evaluate all adjacent lines of code (stopping at the nearest blank lines)
