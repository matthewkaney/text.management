import { Config, SettingsSchema } from "@core/state";

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

  console.log(config.data);

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
    animationFrame = requestAnimationFrame(update);
  };

  return timer;
};

function renderTime(time: number, duration: number) {
  const totalMinuteDigits = Math.floor(duration / 60).toString().length;
  const minutes = Math.floor(time / 60)
    .toString()
    .padStart(totalMinuteDigits);
  const seconds = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}
