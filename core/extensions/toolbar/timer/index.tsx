import { Config, ConfigExtension, SettingsSchema } from "@core/state";

import { render } from "preact";
import { useState, useEffect } from "preact/hooks";

import "./style.css";

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

  const dom = document.createElement("div");
  dom.classList.add("cm-menu");

  render(<Timer config={config} />, dom);

  return { dom };
};

interface TimerProps {
  config: ConfigExtension<typeof TimerSettings>;
}

function Timer({ config }: TimerProps) {
  let [duration, setDuration] = useState(
    config.data["countdownClock.duration"] ?? defaultDuration
  );
  let [playing, setPlaying] = useState(false);
  let [startTime, setStartTime] = useState(0);
  let [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    let offChange = config.on(
      "change",
      ({ ["countdownClock.duration"]: newDuration }) => {
        newDuration = newDuration ?? defaultDuration;

        if (newDuration !== duration) {
          setDuration(newDuration);
          setPlaying(false);
        }
      }
    );

    return () => {
      offChange();
    };
  }, [config, duration]);

  const togglePlayState = () => {
    setPlaying((p) => !p);
  };

  useEffect(() => {
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

  return (
    <div class="cm-menu-trigger" onClick={togglePlayState}>
      <Indicator
        state={playing ? (currentTime - startTime) / duration : "filled"}
      />
      <TimerLabel
        time={playing ? currentTime - startTime : 0}
        duration={duration}
      />
    </div>
  );
}

interface TimerLabelProps {
  time: number;
  duration: number;
}

function TimerLabel({ time, duration }: TimerLabelProps) {
  const totalMinuteDigits = Math.floor(duration / 60).toString().length;
  const minutes = Math.floor((duration - time) / 60)
    .toString()
    .padStart(totalMinuteDigits);
  const seconds = Math.ceil((duration - time) % 60)
    .toString()
    .padStart(2, "0");

  return (
    <span>
      {minutes}:{seconds}
    </span>
  );
}

//   let startTime: number;
//   let playing = false;

//   const timer = new ToolbarMenu(renderTime(duration, duration), [], "timer");

//   const indicator = getIndicator();
//   timer.dom.appendChild(indicator.dom);

//   let animationFrame: number;

//   timer.dom.addEventListener("click", () => {
//     togglePlayState();
//   });

//   const togglePlayState = (newPlayState = !playing) => {
//     if (newPlayState === playing) return;

//     if (playing) {
//       playing = false;
//       cancelAnimationFrame(animationFrame);
//       timer.label = renderTime(duration, duration);
//     } else {
//       playing = true;
//       startTime = performance.now();
//       animationFrame = requestAnimationFrame(update);
//     }

//     playing = newPlayState;
//   };

//   const update = (time: number) => {
//     const timeElapsed = (time - startTime) / 1000;
//     timer.label = renderTime(duration - timeElapsed, duration);
//     indicator.update(timeElapsed / duration);
//     animationFrame = requestAnimationFrame(update);
//   };

//   return timer;
// };

// function renderTime(time: number, duration: number) {
//   const totalMinuteDigits = Math.floor(duration / 60).toString().length;
//   const minutes = Math.floor(time / 60)
//     .toString()
//     .padStart(totalMinuteDigits);
//   const seconds = Math.ceil(time % 60)
//     .toString()
//     .padStart(2, "0");
//   return `${minutes}:${seconds}`;
// }

// function getIndicator() {
//   const dom = document.createElement("span");

//   const update = (state: number | "empty" | "filled") => {
//     render(<Indicator state={state} />, dom);
//   };

//   update("empty");

//   return { dom, update };
// }

function Indicator({ state }: { state: number | "empty" | "filled" }) {
  let amount = typeof state === "number" ? state : 0;

  return (
    <svg class="timer-icon" width="26" height="26" viewBox="-13 -13 26 26">
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
  start += Number.EPSILON;

  const data = [
    `M ${Math.sin(start) * r1} ${-Math.cos(start) * r1}`,
    `A ${r1} ${r1} 0 ${flag} 1 ${Math.sin(end) * r1} ${-Math.cos(end) * r1}`,
    `L ${Math.sin(end) * r2} ${-Math.cos(end) * r2}`,
    `A ${r2} ${r2} 0 ${flag} 0 ${Math.sin(start) * r2} ${
      -Math.cos(start) * r2
    }`,
    "Z",
  ];

  return <path d={data.join(" ")} fill="black" />;
}
