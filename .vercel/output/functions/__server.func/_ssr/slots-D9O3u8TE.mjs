import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as playCue, n as BrokeRack, o as useHouse, r as HouseShell, s as useI18n } from "./shell-CswMBeV8.mjs";
import { h as useReducedMotion, i as LampMark, n as GhostButton, o as ResultLine, p as randInt, r as GoldButton, s as RuleNote, t as DenomPicker } from "./use-reduced-motion-CGmAgD2K.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/slots-D9O3u8TE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var REELS = [
	[
		"cherry",
		"lemon",
		"orange",
		"plum",
		"cherry",
		"cherry",
		"bar",
		"orange",
		"bell",
		"cherry",
		"plum",
		"lemon",
		"orange",
		"seven",
		"cherry",
		"bar",
		"lemon",
		"plum",
		"orange",
		"bell",
		"cherry",
		"lemon",
		"orange",
		"plum"
	],
	[
		"lemon",
		"orange",
		"plum",
		"bar",
		"lemon",
		"bell",
		"orange",
		"cherry",
		"plum",
		"lemon",
		"seven",
		"orange",
		"bar",
		"plum",
		"lemon",
		"bell",
		"orange",
		"cherry",
		"plum",
		"lemon",
		"orange",
		"bar",
		"plum",
		"cherry"
	],
	[
		"orange",
		"plum",
		"lemon",
		"bar",
		"orange",
		"bell",
		"plum",
		"lemon",
		"seven",
		"orange",
		"bar",
		"plum",
		"lemon",
		"bell",
		"orange",
		"plum",
		"lemon",
		"cherry",
		"bar",
		"orange",
		"plum",
		"lemon",
		"bell",
		"orange"
	]
];
function evaluateLine(line) {
	const [a, b, c] = line;
	if (a === "seven" && b === "seven" && c === "seven") return {
		mult: 80,
		label: "Three sevens"
	};
	if (a === "bar" && b === "bar" && c === "bar") return {
		mult: 40,
		label: "Three bars"
	};
	if (a === "bell" && b === "bell" && c === "bell") return {
		mult: 20,
		label: "Three bells"
	};
	if (a === "plum" && b === "plum" && c === "plum") return {
		mult: 14,
		label: "Three plums"
	};
	if (a === "orange" && b === "orange" && c === "orange") return {
		mult: 12,
		label: "Three oranges"
	};
	if (a === "lemon" && b === "lemon" && c === "lemon") return {
		mult: 10,
		label: "Three lemons"
	};
	if (a === "cherry" && b === "cherry" && c === "cherry") return {
		mult: 8,
		label: "Three cherries"
	};
	if (a === "cherry" && b === "cherry") return {
		mult: 4,
		label: "Two cherries"
	};
	if (a === "cherry") return {
		mult: 2,
		label: "Cherry"
	};
	return {
		mult: 0,
		label: "No line"
	};
}
var PAYTABLE = [
	{
		label: "Three sevens",
		mult: "80"
	},
	{
		label: "Three bars",
		mult: "40"
	},
	{
		label: "Three bells",
		mult: "20"
	},
	{
		label: "Three plums",
		mult: "14"
	},
	{
		label: "Three oranges",
		mult: "12"
	},
	{
		label: "Three lemons",
		mult: "10"
	},
	{
		label: "Three cherries",
		mult: "8"
	},
	{
		label: "Two cherries",
		mult: "4"
	},
	{
		label: "Cherry on the first reel",
		mult: "2"
	}
];
function lampName(lamp) {
	if (lamp === "seven") return "Seven";
	return lamp.slice(0, 1).toUpperCase() + lamp.slice(1);
}
var REEL_H = 92;
var LOOPS = 5;
var DURATION = [
	1100,
	1600,
	2100
];
var BETS = [
	5,
	10,
	25,
	50,
	100
];
function Reel({ strip, stopIndex, spinId, frozen, duration, reduced }) {
	const list = (0, import_react.useMemo)(() => {
		return Array.from({ length: strip.length * 8 }, (_, i) => strip[i % strip.length]);
	}, [strip]);
	const [y, setY] = (0, import_react.useState)((1 - (strip.length + stopIndex)) * REEL_H);
	const [animate, setAnimate] = (0, import_react.useState)(false);
	const yRef = (0, import_react.useRef)(y);
	yRef.current = y;
	(0, import_react.useEffect)(() => {
		if (spinId === 0 || frozen) return;
		const period = strip.length;
		const currentIndex = 1 - yRef.current / REEL_H;
		const landed = (Math.round(currentIndex) % period + period) % period;
		const base = landed + period;
		const startY = (1 - base) * REEL_H;
		const delta = (stopIndex - landed + period) % period;
		const endY = (1 - (base + LOOPS * period + delta)) * REEL_H;
		setAnimate(false);
		setY(startY);
		let inner = 0;
		const outer = requestAnimationFrame(() => {
			inner = requestAnimationFrame(() => {
				if (!reduced) setAnimate(true);
				setY(endY);
			});
		});
		return () => {
			cancelAnimationFrame(outer);
			cancelAnimationFrame(inner);
		};
	}, [
		spinId,
		frozen,
		stopIndex,
		strip.length,
		reduced
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative overflow-hidden rounded-md bg-ink",
		style: { height: 276 },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-x-0",
			style: {
				transform: `translateY(${y}px)`,
				transition: animate ? `transform ${duration}ms cubic-bezier(0.12, 0.7, 0.08, 1)` : "none"
			},
			children: list.map((lamp, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-center",
				style: { height: REEL_H },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LampMark, { lamp })
			}, index))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pointer-events-none absolute inset-x-0 bg-gold/10",
			style: {
				top: REEL_H,
				height: REEL_H
			}
		})]
	});
}
function SlotsGame() {
	const reduced = useReducedMotion();
	const { tx, fmt } = useI18n();
	const chips = useHouse((s) => s.chips);
	const [bet, setBet] = (0, import_react.useState)(10);
	const [stops, setStops] = (0, import_react.useState)([
		0,
		0,
		0
	]);
	const [held, setHeld] = (0, import_react.useState)([
		false,
		false,
		false
	]);
	const [spinId, setSpinId] = (0, import_react.useState)(0);
	const [spinning, setSpinning] = (0, import_react.useState)(false);
	const [banner, setBanner] = (0, import_react.useState)("Center line pays.");
	const [tone, setTone] = (0, import_react.useState)("idle");
	const pending = (0, import_react.useRef)(null);
	const timer = (0, import_react.useRef)(0);
	const flush = (announce) => {
		const owed = pending.current;
		if (!owed) return;
		pending.current = null;
		window.clearTimeout(timer.current);
		const back = owed.mult * owed.bet;
		useHouse.getState().settle("slots", owed.bet, back, owed.mult ? owed.label : "No line");
		if (!announce) return;
		setSpinning(false);
		if (back > owed.bet) {
			setTone("win");
			setBanner(`${owed.label} · +${fmt(back - owed.bet)}`);
			setHeld([
				false,
				false,
				false
			]);
			playCue("win");
		} else if (back === owed.bet) {
			setTone("push");
			setBanner(`${owed.label} · stake back`);
			playCue("tick");
		} else {
			setTone("lose");
			setBanner(owed.label === "No line" ? "No line" : `${owed.label} · −${fmt(owed.bet - back)}`);
			playCue("lose");
		}
	};
	(0, import_react.useEffect)(() => () => flush(false), []);
	const line = stops.map((stop, reel) => REELS[reel][stop]);
	function spin() {
		if (spinning) return;
		if (held.every(Boolean)) return;
		if (!useHouse.getState().stake(bet)) return;
		const next = stops.map((stop, reel) => held[reel] ? stop : randInt(REELS[reel].length));
		const outcome = evaluateLine([
			REELS[0][next[0]],
			REELS[1][next[1]],
			REELS[2][next[2]]
		]);
		const id = spinId + 1;
		pending.current = {
			id,
			bet,
			mult: outcome.mult,
			label: outcome.label
		};
		setStops(next);
		setSpinId(id);
		setSpinning(true);
		setTone("idle");
		setBanner("Spinning");
		playCue("spin");
		const wait = reduced ? 40 : Math.max(...DURATION.filter((_, index) => !held[index]), 400);
		timer.current = window.setTimeout(() => flush(true), wait + 40);
	}
	function toggleHold(index) {
		if (spinning) return;
		setHeld((prev) => {
			const next = [...prev];
			next[index] = !next[index];
			return next;
		});
		playCue("tick");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs tracking-[0.2em] text-accent uppercase",
			children: tx("Lamp")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-1 font-display text-5xl leading-none",
			children: tx("Fruit machine")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 max-w-prose text-muted",
			children: tx("Three reels, one line through the middle. Hold a reel and it sits for the next paid spin.")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 rounded-card border border-gold-dim bg-panel p-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "felt-surface grid grid-cols-3 gap-2 rounded-md p-2",
					"aria-busy": spinning,
					children: REELS.map((strip, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Reel, {
						strip,
						stopIndex: stops[index] ?? 0,
						spinId,
						frozen: held[index] ?? false,
						duration: DURATION[index] ?? 1e3,
						reduced
					}, index))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "sr-only",
					"aria-live": "polite",
					children: spinning ? tx("Spinning") : line.map((lamp) => tx(lampName(lamp))).join(", ")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 grid grid-cols-3 gap-2",
					children: [
						0,
						1,
						2
					].map((index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GhostButton, {
						cabinet: true,
						"aria-pressed": held[index],
						disabled: spinning,
						onClick: () => toggleHold(index),
						className: held[index] ? "border-gold text-gold" : "",
						children: tx(held[index] ? "Held" : "Hold")
					}, index))
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultLine, {
				text: banner,
				tone
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-5 flex flex-wrap items-end justify-between gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 text-xs tracking-wide text-muted uppercase",
				children: tx("Bet")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DenomPicker, {
				value: bet,
				onChange: setBet,
				denoms: BETS,
				disabled: spinning,
				label: "Bet size"
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoldButton, {
				className: "min-w-32 px-8",
				disabled: spinning || held.every(Boolean) || chips < bet,
				onClick: spin,
				children: spinning ? tx("Spinning") : `${tx("Spin ")}${fmt(bet)}`
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrokeRack, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RuleNote, {
			title: "Paytable",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-1",
				children: PAYTABLE.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: tx(row.label) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "num text-fg",
						children: [row.mult, "×"]
					})]
				}, row.label))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tx("Only the center symbol of each reel counts. Holds clear after a win that beats the stake.") })]
		})
	] });
}
function SlotsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HouseShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlotsGame, {}) });
}
//#endregion
export { SlotsPage as component };
