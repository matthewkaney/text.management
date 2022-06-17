let bpm = 120;
let lastTap = 0;

export function tap() {
  let time = performance.now();

  if (time - lastTap > 3000) {
    lastTap = time;
  } else {
    bpm = 60000 / (time - lastTap);
    lastTap = time;
    console.log(bpm);
  }
}

export * from "./midi";
