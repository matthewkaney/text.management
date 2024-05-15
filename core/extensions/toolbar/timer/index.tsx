import { Config, SettingsSchema } from "@core/state";

import { render } from "nano-jsx";

import { ToolbarMenu } from "..";

const defaultDuration = 20 * 60;

const TimerSettings = {
  properties: {
    "countdownClock.duration": {
      type: "number",
      default: defaultDuration,
    },
  },
} as const satisfies SettingsSchema;

export const getTimer = (configuration: Config) => {
  let config = configuration.extend(TimerSettings);
  let duration = config.data["countdownClock.duration"] ?? defaultDuration;

  config.on("change", ({ ["countdownClock.duration"]: newDuration }) => {
    newDuration = newDuration ?? defaultDuration;

    if (newDuration !== duration) {
      duration = newDuration;
      togglePlayState(false);
      timer.label = renderTime(duration, duration);
    }
  });

  let startTime: number;
  let playing = false;

  const timer = new ToolbarMenu(renderTime(duration, duration), [], "timer");

  const indicator = getIndicator();
  timer.dom.appendChild(indicator.dom);

  let animationFrame: number;

  timer.dom.addEventListener("click", () => {
    togglePlayState();
  });

  const togglePlayState = (newPlayState = !playing) => {
    if (newPlayState === playing) return;

    if (playing) {
      playing = false;
      cancelAnimationFrame(animationFrame);
      timer.label = renderTime(duration, duration);
    } else {
      playing = true;
      startTime = performance.now();
      animationFrame = requestAnimationFrame(update);
    }

    playing = newPlayState;
  };

  const update = (time: number) => {
    const timeElapsed = (time - startTime) / 1000;
    timer.label = renderTime(duration - timeElapsed, duration);
    indicator.update(timeElapsed / duration);
    animationFrame = requestAnimationFrame(update);
  };

  return timer;
};

function renderTime(time: number, duration: number) {
  const totalMinuteDigits = Math.floor(duration / 60).toString().length;
  const minutes = Math.floor(time / 60)
    .toString()
    .padStart(totalMinuteDigits);
  const seconds = Math.ceil(time % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getIndicator() {
  const dom = document.createElement("span");

  const update = (state: number | "empty" | "filled") => {
    render(<Indicator state={state} />, dom);
  };

  update("empty");

  return { dom, update };
}

function Indicator({ state }: { state: number | "empty" | "filled" }) {
  let amount = typeof state === "number" ? state : 0;

  return (
    <svg width="36" height="36" viewBox="-18 -18 36 36">
      <Arc start={0} end={amount} r1={12} r2={10} />
      <Arc start={amount} end={1} r1={12} r2={4} />
    </svg>
  );
}

interface ArcProps {
  start: number;
  end: number;
  r1: number;
  r2: number;
}

function Arc({ start, end, r1, r2 }: ArcProps) {
  // Figure out large arc flag
  const flag = end - start > 0.5 ? 1 : 0;

  // Convert unit angles to radians
  start *= Math.PI * 2;
  end *= Math.PI * 2;

  const data = [
    `m ${Math.sin(start) * r1} ${-Math.cos(start) * r1}`,
    `A ${r1} ${r1} 0 ${flag} 1 ${Math.sin(end) * r1} ${-Math.cos(end) * r1}`,
    `L ${Math.sin(end) * r2} ${-Math.cos(end) * r2}`,
    `A ${r2} ${r2} 0 ${flag} 0 ${Math.sin(start) * r2} ${
      -Math.cos(start) * r2
    }`,
    "Z",
  ];

  return <path d={data.join(" ")} fill="currentColor" />;
}
