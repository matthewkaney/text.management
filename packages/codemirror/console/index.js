var $ifrFJ$codemirrorstate = require("@codemirror/state");
var $ifrFJ$codemirrorview = require("@codemirror/view");

function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$export(module.exports, "console", () => $fa899d3baf3f7347$export$e896d9a1b4631fa1);

const $325e020f57b74a09$export$8666279ca1aaec5d = (0, $ifrFJ$codemirrorstate.StateEffect).define();
const $325e020f57b74a09$export$ddd63682888dfa0e = (0, $ifrFJ$codemirrorstate.StateField).define({
    create: ()=>{
        return [];
    },
    update: (value, transaction)=>{
        for (let effect of transaction.effects){
            if (effect.is($325e020f57b74a09$export$8666279ca1aaec5d)) return [
                ...value,
                effect.value
            ];
        }
        return value;
    }
});




function $60dbf1243bc5b358$var$consolePanelConstructor(view) {
    let consoleNode = document.createElement("div");
    let messages = view.state.field((0, $325e020f57b74a09$export$ddd63682888dfa0e), false) || [];
    for (let message of messages)consoleNode.appendChild($60dbf1243bc5b358$var$messageConstructor(message));
    return {
        dom: consoleNode,
        update (update) {
            for (let transaction of update.transactions){
                for (let effect of transaction.effects)if (effect.is((0, $325e020f57b74a09$export$8666279ca1aaec5d))) consoleNode.appendChild($60dbf1243bc5b358$var$messageConstructor(effect.value));
            }
        },
        destroy () {}
    };
}
function $60dbf1243bc5b358$var$messageConstructor(message) {
    const messageNode = document.createElement("div");
    messageNode.innerText = message.text;
    return messageNode;
}
const $60dbf1243bc5b358$export$266e006714e4276 = (0, $ifrFJ$codemirrorview.showPanel).of($60dbf1243bc5b358$var$consolePanelConstructor);


function $fa899d3baf3f7347$export$e896d9a1b4631fa1() {
    return [
        (0, $325e020f57b74a09$export$ddd63682888dfa0e),
        (0, $60dbf1243bc5b358$export$266e006714e4276)
    ];
}


//# sourceMappingURL=index.js.map
