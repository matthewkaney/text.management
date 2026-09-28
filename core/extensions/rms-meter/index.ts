import { RmsEvent } from "@management/lang-tidal";
import "./style.css";

const ORBIT_COUNT = 12;
const DECAY = 0.94;
const DB_FLOOR = -60;

export function rmsMeter() {
    let meterNode = document.createElement("div");
    meterNode.classList.add('rms-meter');
    meterNode.hidden = true;

    let levels = new Float32Array(ORBIT_COUNT);
    let rafID: number | null = null;

    let fills: HTMLElement[] = [];
    let dbLabels: HTMLElement[] = [];

    for (let i = 0; i < ORBIT_COUNT; i++) {
        let row = meterNode.appendChild(document.createElement('div'));
        row.classList.add('rms-orbit');

        let label = row.appendChild(document.createElement('span'));
        label.classList.add('rms-label');
        label.textContent = `${i}`;

        let track = row.appendChild(document.createElement('div'));
        track.classList.add('rms-track');

        let fill = track.appendChild(document.createElement('div'));
        fill.classList.add('rms-fill');
        fills.push(fill);

        let db = row.appendChild(document.createElement('span'));
        db.classList.add('rms-db');
        db.textContent = '-Inf';
        dbLabels.push(db);
    }

    function render() {
        for (let i = 0; i < ORBIT_COUNT; i++) {
            let linear = levels[i];

            let db = linear > 0 ? Math.max(DB_FLOOR, 20 * Math.log10(linear)) : DB_FLOOR;
            let pct = ((db - DB_FLOOR) / (0 - DB_FLOOR)) * 100;

            fills[i].style.width = `${pct.toFixed(1)}%`;
            dbLabels[i].textContent = db <= DB_FLOOR ? `-Inf` : db.toFixed(1);

            fills[i].classList.toggle("rms-fill--loud", db > -12);
            fills[i].classList.toggle("rms-fill--clipping", db > -3);
        }
    }

    function startLoop() {
        function tick() {
            for (let i = 0; i < ORBIT_COUNT; i++) {
                levels[i] *= DECAY;
                if (levels[i] < 1e-6) levels[i] = 0;
            }

            render();
            rafID = requestAnimationFrame(tick);
        }
        if (rafID === null) rafID = requestAnimationFrame(tick);
    }

    function stopLoop() {
        if (rafID !== null) {
            cancelAnimationFrame(rafID);
            rafID = null;
        }
    }

    return {
        dom: meterNode,
        update(event: RmsEvent) {
            if (event.orbit >= 0 && event.orbit < ORBIT_COUNT) {
                if (event.peak > levels[event.orbit]) {
                    levels[event.orbit] = event.peak;
                }
            }
        },
        toggleVisibility() {
            let next = !meterNode.hidden;
            meterNode.hidden = !next;
            if (!meterNode.hidden) {
                startLoop();
            } else {
                stopLoop();
            }
        },
        destroy() {
            stopLoop();
        }
    }
}