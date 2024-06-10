let strudel = require("@strudel/web/dist/index.js");

initStrudel();

setTimeout(() => {
  evaluate('note("c d e")');
}, 1000);

setTimeout(() => {
  evaluate("hush()");
}, 5000);
