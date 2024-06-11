// Currently, a bug with v1.1.0 prevents bundling, but it will
// eventually look something like this

// import { initStrudel } from "@strudel/web";

// async function start() {
//   const repl = await initStrudel();

//   repl.evaluate('note("c5 e5 g5 bf5").fast(8)');
// }

// start();

require("@strudel/web/dist/index.js");

initStrudel();

setTimeout(() => {
  console.log(evaluate);
  evaluate('note("c c c")');

  parentFrame.on("evaluation", (code) => {
    console.log("got evaluation");
    console.log(evaluate);
    evaluate(code);
  });
}, 1000);
