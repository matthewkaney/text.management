import { Config, ConfigExtension, SettingsSchema } from "@core/state";

import { render } from "preact";
import { useState, useEffect, useLayoutEffect } from "preact/hooks";

import { clsx } from "clsx/lite";

import "./style.css";

const defaultDuration = 20;
const defaultWarning = 5;

export const TimerSettings = {
  properties: {
    "countdownClock.duration": {
      type: "number",
      default: defaultDuration,
      description: "Duration of the countdown clock in minutes",
    },
    "countdownClock.warningTime": {
      type: "number",
      default: defaultWarning,
      description: "Warning time (when the countdown clock turns red)",
    },
  },
} as const satisfies SettingsSchema;

export const getTimer = (configuration: Config) => {
  let config = configuration.extend(TimerSettings);

  const dom = document.createElement("div");
  dom.classList.add("cm-menu");

  render(<Timer config={config} />, dom);

  return { dom };
};

interface TimerProps {
  config: ConfigExtension<typeof TimerSettings>;
}

function Timer({ config }: TimerProps) {
  let [duration, setDuration] = useState(defaultDuration);
  let [warningTime, setWarningTime] = useState(defaultWarning);
  let [playing, setPlaying] = useState(false);
  let [startTime, setStartTime] = useState(performance.now());
  let [currentTime, setCurrentTime] = useState(performance.now());

  useLayoutEffect(() => {
    setDuration(config.data["countdownClock.duration"] ?? defaultDuration);
    setWarningTime(config.data["countdownClock.warningTime"] ?? defaultWarning);

    let offChange = config.on(
      "change",
      ({
        ["countdownClock.duration"]: newDuration,
        ["countdownClock.warningTime"]: newWarning,
      }) => {
        newDuration = newDuration ?? defaultDuration;

        if (newDuration !== duration) {
          setDuration(newDuration);
          setPlaying(false);
        }

        setWarningTime(newWarning ?? defaultWarning);
      }
    );

    return () => {
      offChange();
    };
  }, [config, duration]);

  const togglePlayState = () => {
    setPlaying((p) => !p);
  };

  useLayoutEffect(() => {
    if (playing) {
      let animationFrame: number;

      let update = (time: number) => {
        setCurrentTime(time / 1000);
        animationFrame = requestAnimationFrame(update);
      };

      setStartTime(performance.now() / 1000);
      setCurrentTime(performance.now() / 1000);

      animationFrame = requestAnimationFrame(update);

      return () => {
        cancelAnimationFrame(animationFrame);
      };
    }
  }, [playing]);

  const durationSeconds = duration * 60;
  const elapsed = currentTime - startTime;
  const remaining = durationSeconds - elapsed;

  return (
    <div
      class={clsx(
        "cm-menu-trigger",
        playing && remaining < warningTime * 60 && "timer-warning",
        playing &&
          remaining < 0 &&
          Math.abs(remaining % 1) < 0.5 &&
          "timer-blink"
      )}
      onClick={togglePlayState}
    >
      <Indicator amount={playing ? elapsed / durationSeconds : 1} />
      <TimerLabel time={playing ? elapsed : 0} duration={durationSeconds} />
    </div>
  );
}

interface TimerLabelProps {
  time: number;
  duration: number;
}

function TimerLabel({ time, duration }: TimerLabelProps) {
  const isNegative = time > duration;
  time = Math.abs(duration - time);

  const totalMinuteDigits = Math.floor(duration / 60).toString().length;
  const nearestSecond = isNegative ? Math.floor(time) : Math.ceil(time);
  const minutes = Math.floor(nearestSecond / 60);
  const seconds = nearestSecond % 60;

  return (
    <span>
      {(minutes !== 0 || seconds !== 0) && isNegative && "-"}
      {minutes.toString().padStart(totalMinuteDigits)}:
      {seconds.toString().padStart(2, "0")}
    </span>
  );
}

function Indicator({ amount }: { amount: number }) {
  const warning = amount > 1;
  amount = Math.min(1, amount);

  return (
    <svg class="timer-icon" width="26" height="26" viewBox="-13 -13 26 26">
      {amount > 0 && <Arc start={0} end={amount} r1={12} r2={10} />}
      {amount < 1 && <Arc start={amount} end={1} r1={12} r2={4} />}
      {warning && <Arc start={0} end={1} r1={8} r2={0} />}
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
  let flag1 = end - start > 0.5 && end - start < 1 ? 1 : 0;
  let flag2 = (start - end) % 1 === 0 ? 0 : 1;

  // Convert unit angles to radians
  start *= Math.PI * 2;
  end *= Math.PI * 2;
  start += Number.EPSILON;

  const data = [
    `M ${Math.sin(start) * r1} ${-Math.cos(start) * r1}`,
    `A ${r1} ${r1} 0 ${flag1} ${flag2} ${Math.sin(end) * r1} ${
      -Math.cos(end) * r1
    }`,
    `L ${Math.sin(end) * r2} ${-Math.cos(end) * r2}`,
    `A ${r2} ${r2} 0 ${flag1} ${Math.abs(flag2 - 1)} ${Math.sin(start) * r2} ${
      -Math.cos(start) * r2
    }`,
    "Z",
  ];

  return <path d={data.join(" ")} fill="currentColor" />;
}
