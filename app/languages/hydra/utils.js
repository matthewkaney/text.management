export * from "./midi";

export const PI = Math.PI;

let values = {};

export function v(name, value) {
  if (!(name in values)) {
    values[name] = 0;
  }

  let firstValue = values[name];
  return () => {
    if (typeof value === "function") {
      values[name] = firstValue + value();
    } else if (typeof value === "number") {
      values[name] = value;
    }

    return values[name];
  };
}

export function t(scale) {
  let delta = dt(scale);
  let total = 0;

  return () => {
    total += delta();
    return total;
  };
}

export function dt(scale) {
  if (typeof scale !== "function") {
    let scaleVal = scale === undefined ? 1 : scale;
    scale = () => scaleVal;
  }

  let lastTime = performance.now();

  return () => {
    let thisTime = performance.now();
    let elapsed = (thisTime - lastTime) * 0.001 * scale();
    lastTime = thisTime;
    return elapsed;
  };
}

export function acc(update) {
  let value = 0;

  return () => {
    value += update() || 0;
    return value;
  };
}

export function cyc(index, ...values) {
  return () => {
    return values[Math.floor(index()) % values.length];
  };
}

export function hold(update) {
  let value = 0;

  return () => {
    let newValue = update();
    value = newValue === undefined ? value : newValue;
    return value;
  };
}

export function ease(update) {
  let duration = 300;
  let lastValue = update();
  let start = null;

  return () => {
    let target = update();
    if (lastValue !== target) {
      if (start === null) {
        start = performance.now();
      }

      let progress = performance.now() - start;

      if (progress >= duration) {
        lastValue = target;
        start = null;
        return lastValue;
      } else {
        return (
          easeOutElastic(progress / duration) * (target - lastValue) + lastValue
        );
      }
    } else {
      return lastValue;
    }
  };
}

function easeOutElastic(x) {
  const c4 = (2 * Math.PI) / 3;

  return x === 0
    ? 0
    : x === 1
    ? 1
    : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

import { currentTick } from "./midi";

export function clk(step, value = 1) {
  let stepTicks = step * 24;
  let lastTick = Math.floor(currentTick() / stepTicks);

  return () => {
    let thisTick = Math.floor(currentTick() / stepTicks);
    if (thisTick != lastTick) {
      lastTick = thisTick;
      return typeof value === "function" ? value() : value;
    } else {
      return;
    }
  };
}

export function q(value = 1) {
  return clk(1, value);
}

export function sx(value = 1) {
  return clk(0.25, value);
}

import { cc } from "./midi";

export const k1 = (low, high) => cc(80, low, high);
export const k2 = (low, high) => cc(81, low, high);
export const k3 = (low, high) => cc(82, low, high);
export const k4 = (low, high) => cc(83, low, high);
export const k5 = (low, high) => cc(84, low, high);
export const k6 = (low, high) => cc(85, low, high);
export const k7 = (low, high) => cc(86, low, high);
export const k8 = (low, high) => cc(87, low, high);
