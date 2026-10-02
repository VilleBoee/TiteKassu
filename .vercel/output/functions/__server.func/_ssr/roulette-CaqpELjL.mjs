import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as playCue, n as BrokeRack, o as useHouse, r as HouseShell, s as useI18n } from "./shell-DE_NL6o6.mjs";
import { h as useReducedMotion, n as GhostButton, o as ResultLine, p as randInt, r as GoldButton, s as RuleNote, t as DenomPicker } from "./use-reduced-motion-DNYynpH8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/roulette-CaqpELjL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var WHEEL = [
	0,
	32,
	15,
	19,
	4,
	21,
	2,
	25,
	17,
	34,
	6,
	27,
	13,
	36,
	11,
	30,
	8,
	23,
	10,
	5,
	24,
	16,
	33,
	1,
	20,
	14,
	31,
	9,
	22,
	18,
	29,
	7,
	28,
	12,
	35,
	3,
	26
];
var REDS = /* @__PURE__ */ new Set([
	1,
	3,
	5,
	7,
	9,
	12,
	14,
	16,
	18,
	19,
	21,
	23,
	25,
	27,
	30,
	32,
	34,
	36
]);
function pocketColor(n) {
	if (n === 0) return "green";
	return REDS.has(n) ? "red" : "black";
}
function columnOf(n) {
	if (n < 1 || n > 36) return null;
	const mod = n % 3;
	if (mod === 1) return 1;
	if (mod === 2) return 2;
	return 3;
}
function splitMates(n) {
	if (n < 1 || n > 36) return [];
	const col = Math.ceil(n / 3);
	const level = (n - 1) % 3;
	const mates = [];
	if (level < 2) mates.push(n + 1);
	if (level > 0) mates.push(n - 1);
	if (col < 12) mates.push(n + 3);
	if (col > 1) mates.push(n - 3);
	return mates;
}
function streetStart(n) {
	if (n < 1 || n > 36) return null;
	return n - (n - 1) % 3;
}
function cornersTouching(n) {
	if (n < 1 || n > 36) return [];
	const col = Math.ceil(n / 3);
	const level = (n - 1) % 3;
	const lows = [];
	if (level <= 1 && col < 12) lows.push(n);
	if (level <= 1 && col > 1) lows.push(n - 3);
	if (level >= 1 && col < 12) lows.push(n - 1);
	if (level >= 1 && col > 1) lows.push(n - 4);
	return lows;
}
function sixesTouching(n) {
	const start = streetStart(n);
	if (start == null) return [];
	const starts = [];
	if (start <= 31) starts.push(start);
	if (start > 1) starts.push(start - 3);
	return starts;
}
function cornerNumbers(low) {
	return [
		low,
		low + 1,
		low + 3,
		low + 4
	];
}
function isLegal(bet) {
	switch (bet.kind) {
		case "straight": return bet.n >= 0 && bet.n <= 36;
		case "split": return bet.a >= 1 && bet.b <= 36 && bet.a < bet.b && splitMates(bet.a).includes(bet.b);
		case "street": return bet.start >= 1 && bet.start <= 34 && (bet.start - 1) % 3 === 0;
		case "corner": {
			const col = Math.ceil(bet.low / 3);
			const level = (bet.low - 1) % 3;
			return bet.low >= 1 && bet.low <= 32 && level <= 1 && col < 12;
		}
		case "six": return bet.start >= 1 && bet.start <= 31 && (bet.start - 1) % 3 === 0;
		case "dozen": return bet.d === 1 || bet.d === 2 || bet.d === 3;
		case "column": return bet.c === 1 || bet.c === 2 || bet.c === 3;
		default: return true;
	}
}
function betKey(bet) {
	switch (bet.kind) {
		case "straight": return `st:${bet.n}`;
		case "split": return `sp:${bet.a}-${bet.b}`;
		case "street": return `tr:${bet.start}`;
		case "corner": return `co:${bet.low}`;
		case "six": return `sx:${bet.start}`;
		case "dozen": return `dz:${bet.d}`;
		case "column": return `cl:${bet.c}`;
		default: return bet.kind;
	}
}
function describeBet(bet) {
	switch (bet.kind) {
		case "straight": return `${bet.n}`;
		case "split": return `Split ${bet.a}/${bet.b}`;
		case "street": return `Street ${bet.start}–${bet.start + 2}`;
		case "corner": return `Corner ${cornerNumbers(bet.low).join("/")}`;
		case "six": return `Line ${bet.start}–${bet.start + 5}`;
		case "dozen": return [
			"1st dozen",
			"2nd dozen",
			"3rd dozen"
		][bet.d - 1];
		case "column": return `Column ${bet.c}`;
		case "red": return "Red";
		case "black": return "Black";
		case "odd": return "Odd";
		case "even": return "Even";
		case "low": return "1–18";
		case "high": return "19–36";
	}
}
function payoutOdds(bet) {
	switch (bet.kind) {
		case "straight": return 35;
		case "split": return 17;
		case "street": return 11;
		case "corner": return 8;
		case "six": return 5;
		case "dozen":
		case "column": return 2;
		default: return 1;
	}
}
function covers(bet, n) {
	switch (bet.kind) {
		case "straight": return bet.n === n;
		case "split": return bet.a === n || bet.b === n;
		case "street": return n >= bet.start && n < bet.start + 3;
		case "corner": return cornerNumbers(bet.low).includes(n);
		case "six": return n >= bet.start && n < bet.start + 6;
		case "dozen": return n !== 0 && Math.ceil(n / 12) === bet.d;
		case "column": return columnOf(n) === bet.c;
		case "red": return REDS.has(n);
		case "black": return n !== 0 && !REDS.has(n);
		case "odd": return n !== 0 && n % 2 === 1;
		case "even": return n !== 0 && n % 2 === 0;
		case "low": return n >= 1 && n <= 18;
		case "high": return n >= 19 && n <= 36;
	}
}
function settleRoulette(bets, n) {
	let stake = 0;
	let returned = 0;
	const wins = [];
	for (const placed of bets) {
		stake += placed.amount;
		if (covers(placed.bet, n)) {
			returned += placed.amount * (payoutOdds(placed.bet) + 1);
			wins.push(describeBet(placed.bet));
		}
	}
	const head = `${n} ${pocketColor(n)}`;
	return {
		stake,
		returned,
		note: wins.length ? `${head} · ${wins.join(", ")}` : `${head} · house`
	};
}
function wheelIndex(n) {
	return WHEEL.indexOf(n);
}
var DENOMS = [
	10,
	25,
	100,
	500
];
var CELL_W = 48;
var CELL_H = 46;
var ZERO_W = 48;
var STEP = 360 / 37;
var MODES = [
	"straight",
	"split",
	"street",
	"corner",
	"six"
];
function landingRotation(current, n) {
	const desired = (-(wheelIndex(n) * STEP + STEP / 2) % 360 + 360) % 360;
	let target = current + 1800;
	const mod = (target % 360 + 360) % 360;
	target += (desired - mod + 360) % 360;
	return target;
}
function wedge(cx, cy, r, half) {
	const a0 = (-90 - half) * Math.PI / 180;
	const a1 = (-90 + half) * Math.PI / 180;
	const x0 = cx + r * Math.cos(a0);
	const y0 = cy + r * Math.sin(a0);
	const x1 = cx + r * Math.cos(a1);
	const y1 = cy + r * Math.sin(a1);
	return `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}
function orderedSplit(a, b) {
	return {
		kind: "split",
		a: Math.min(a, b),
		b: Math.max(a, b)
	};
}
function RouletteGame() {
	const reduced = useReducedMotion();
	const { tx, fmt } = useI18n();
	const chips = useHouse((s) => s.chips);
	const [denom, setDenom] = (0, import_react.useState)(25);
	const [bets, setBets] = (0, import_react.useState)([]);
	const [mode, setMode] = (0, import_react.useState)("straight");
	const [pending, setPending] = (0, import_react.useState)(null);
	const [choices, setChoices] = (0, import_react.useState)(null);
	const [spinning, setSpinning] = (0, import_react.useState)(false);
	const [rotation, setRotation] = (0, import_react.useState)(-9.72972972972973 / 2);
	const [ball, setBall] = (0, import_react.useState)(0);
	const [winning, setWinning] = (0, import_react.useState)(null);
	const [history, setHistory] = (0, import_react.useState)([]);
	const [banner, setBanner] = (0, import_react.useState)("Lay chips, then spin.");
	const [tone, setTone] = (0, import_react.useState)("idle");
	const betsRef = (0, import_react.useRef)(bets);
	const rotRef = (0, import_react.useRef)(rotation);
	const owed = (0, import_react.useRef)(null);
	const timer = (0, import_react.useRef)(0);
	betsRef.current = bets;
	rotRef.current = rotation;
	const flush = (announce) => {
		const due = owed.current;
		if (!due) return;
		owed.current = null;
		window.clearTimeout(timer.current);
		useHouse.getState().settle("roulette", due.stake, due.back, due.note);
		if (!announce) return;
		setSpinning(false);
		const net = due.back - due.stake;
		setBanner(net > 0 ? `${due.note} · +${fmt(net)}` : due.note);
		if (net > 0) {
			setTone("win");
			playCue("win");
		} else if (net === 0) {
			setTone("push");
			playCue("tick");
		} else {
			setTone("lose");
			playCue("lose");
		}
	};
	(0, import_react.useEffect)(() => () => flush(false), []);
	const onTable = bets.reduce((sum, bet) => sum + bet.amount, 0);
	function add(bet) {
		if (spinning || !isLegal(bet)) return;
		const prev = betsRef.current;
		if (prev.reduce((sum, item) => sum + item.amount, 0) + denom > useHouse.getState().chips) return;
		const key = betKey(bet);
		const index = prev.findIndex((item) => betKey(item.bet) === key);
		const next = prev.slice();
		if (index >= 0) next[index] = {
			bet,
			amount: next[index].amount + denom
		};
		else next.push({
			bet,
			amount: denom
		});
		betsRef.current = next;
		setBets(next);
		playCue("chip");
	}
	function remove(key) {
		if (spinning) return;
		const next = betsRef.current.filter((item) => betKey(item.bet) !== key);
		betsRef.current = next;
		setBets(next);
	}
	function clear() {
		if (spinning) return;
		betsRef.current = [];
		setBets([]);
		setPending(null);
		setChoices(null);
	}
	function onNumber(n) {
		if (spinning) return;
		if (mode === "straight" || n === 0) {
			add({
				kind: "straight",
				n
			});
			return;
		}
		if (mode === "street") {
			const start = streetStart(n);
			if (start) add({
				kind: "street",
				start
			});
			return;
		}
		if (mode === "split") {
			if (pending == null) {
				setPending(n);
				return;
			}
			if (pending === n) {
				setPending(null);
				return;
			}
			const bet = orderedSplit(pending, n);
			if (isLegal(bet)) add(bet);
			else setBanner("Those two don't share an edge.");
			setPending(null);
			return;
		}
		if (mode === "corner") {
			const lows = cornersTouching(n);
			if (lows.length === 1) add({
				kind: "corner",
				low: lows[0]
			});
			else setChoices(lows.map((low) => ({
				label: describeBet({
					kind: "corner",
					low
				}),
				bet: {
					kind: "corner",
					low
				}
			})));
			return;
		}
		const starts = sixesTouching(n);
		if (starts.length === 1) add({
			kind: "six",
			start: starts[0]
		});
		else setChoices(starts.map((start) => ({
			label: describeBet({
				kind: "six",
				start
			}),
			bet: {
				kind: "six",
				start
			}
		})));
	}
	function spin() {
		if (spinning) return;
		const layout = betsRef.current;
		const stake = layout.reduce((sum, bet) => sum + bet.amount, 0);
		if (stake <= 0 || !useHouse.getState().stake(stake)) return;
		const n = randInt(37);
		const result = settleRoulette(layout, n);
		owed.current = {
			stake: result.stake,
			back: result.returned,
			note: result.note
		};
		setSpinning(true);
		setTone("idle");
		setBanner("No more bets");
		setChoices(null);
		setPending(null);
		playCue("spin");
		const nextRot = landingRotation(rotRef.current, n);
		rotRef.current = nextRot;
		setRotation(nextRot);
		setBall((prev) => prev - 1440);
		timer.current = window.setTimeout(() => {
			setWinning(n);
			setHistory((prev) => [n, ...prev].slice(0, 16));
			flush(true);
		}, reduced ? 40 : 4300);
	}
	const straightOf = (n) => bets.find((item) => item.bet.kind === "straight" && item.bet.n === n)?.amount ?? 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs tracking-[0.2em] text-accent uppercase",
			children: tx("Wheel")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-1 font-display text-5xl leading-none",
			children: tx("Roulette")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 max-w-prose text-muted",
			children: tx("European wheel, thirty-seven pockets. Even-money bets lose on zero.")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 grid min-w-0 items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative mx-auto w-full max-w-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
						viewBox: "0 0 320 320",
						className: "w-full",
						role: "img",
						"aria-label": winning == null ? tx("Roulette wheel") : `${tx("Landed on ")}${winning}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
							style: {
								transform: `rotate(${rotation}deg)`,
								transformOrigin: "160px 160px",
								transition: spinning ? "transform 4.2s cubic-bezier(0.12, 0.65, 0.05, 1)" : "none"
							},
							children: [
								WHEEL.map((n, index) => {
									const color = pocketColor(n);
									const fill = color === "red" ? "var(--color-crimson)" : color === "green" ? "var(--color-felt)" : "var(--color-ink)";
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
										transform: `rotate(${index * STEP + STEP / 2} 160 160)`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
											d: wedge(160, 160, 148, STEP / 2),
											fill,
											stroke: "var(--color-gold-dim)",
											strokeWidth: "0.6"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
											x: "160",
											y: "30",
											textAnchor: "middle",
											fill: "var(--color-ivory)",
											fontSize: "11",
											fontFamily: "Outfit, sans-serif",
											children: n
										})]
									}, n);
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "160",
									cy: "160",
									r: "78",
									fill: "var(--color-felt-deep)",
									stroke: "var(--color-gold-dim)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "160",
									cy: "160",
									r: "18",
									fill: "var(--color-gold)"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
							points: "160,2 151,18 169,18",
							fill: "var(--color-gold)"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pointer-events-none absolute inset-0",
						style: {
							transform: `rotate(${ball}deg)`,
							transition: spinning ? "transform 4.2s cubic-bezier(0.15, 0.55, 0.1, 1)" : "none"
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-3 left-1/2 size-3.5 -translate-x-1/2 rounded-full border border-gold-dim bg-ivory" })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex gap-1 overflow-x-auto",
					"aria-label": tx("Recent numbers"),
					children: history.map((n, index) => {
						const color = pocketColor(n);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `num inline-flex h-8 min-w-8 items-center justify-center rounded-full px-1.5 text-sm ${color === "red" ? "bg-crimson text-ivory" : color === "green" ? "bg-felt text-ivory" : "bg-ink text-ivory border border-line"}`,
							children: n
						}, `${n}-${index}`);
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-3 flex flex-wrap gap-2",
						role: "radiogroup",
						"aria-label": tx("Inside bet"),
						children: MODES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							role: "radio",
							"aria-checked": mode === item,
							disabled: spinning,
							onClick: () => {
								setMode(item);
								setPending(null);
								setChoices(null);
							},
							className: `min-h-11 rounded-full px-4 text-sm capitalize disabled:opacity-40 ${mode === item ? "bg-gold text-ink" : "border border-line text-ivory"}`,
							children: tx(item === "six" ? "Line" : item)
						}, item))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mb-2 text-sm text-muted",
						children: [
							mode === "straight" && tx("Tap a number for a straight-up bet."),
							mode === "split" && (pending == null ? tx("Tap the first number of a split.") : `${tx("Now a neighbor of ")}${pending}.`),
							mode === "street" && tx("Tap any number to bet its street of three."),
							mode === "corner" && tx("Tap a number, then choose the corner."),
							mode === "six" && tx("Tap a number, then choose the six-line.")
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "max-w-full overflow-x-auto rounded-md border border-line",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative bg-felt-deep",
							style: {
								width: 680,
								height: 138
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: spinning,
									onClick: () => add({
										kind: "straight",
										n: 0
									}),
									className: `absolute flex items-center justify-center rounded-sm bg-felt text-sm font-semibold text-ivory ${winning === 0 ? "ring-2 ring-gold" : ""} ${straightOf(0) ? "outline outline-2 outline-gold" : ""}`,
									style: {
										left: 2,
										top: 2,
										width: 42,
										height: 134
									},
									children: "0"
								}),
								Array.from({ length: 36 }, (_, i) => i + 1).map((n) => {
									const col = Math.ceil(n / 3);
									const row = 2 - (n - 1) % 3;
									const toneClass = pocketColor(n) === "red" ? "bg-crimson text-ivory" : "bg-ink text-ivory";
									return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										disabled: spinning,
										onClick: () => onNumber(n),
										className: `absolute flex items-center justify-center rounded-sm text-sm font-semibold disabled:opacity-80 ${toneClass} ${winning === n ? "ring-2 ring-gold" : ""} ${pending === n ? "outline outline-2 outline-ivory" : ""} ${straightOf(n) ? "outline outline-2 outline-gold" : ""}`,
										style: {
											left: ZERO_W + (col - 1) * CELL_W + 1,
											top: row * CELL_H + 1,
											width: 46,
											height: 44
										},
										children: n
									}, n);
								}),
								[
									3,
									2,
									1
								].map((column, row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: spinning,
									onClick: () => add({
										kind: "column",
										c: column
									}),
									className: "absolute flex items-center justify-center rounded-sm bg-felt text-sm font-semibold text-ivory",
									style: {
										left: 626,
										top: row * CELL_H + 1,
										width: 50,
										height: 44
									},
									children: "2:1"
								}, column))
							]
						})
					}),
					choices ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [choices.map((choice) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GhostButton, {
							onClick: () => {
								add(choice.bet);
								setChoices(null);
							},
							children: tx(choice.label)
						}, choice.label)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GhostButton, {
							onClick: () => setChoices(null),
							children: tx("Cancel")
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 grid grid-cols-3 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outside, {
								label: "1st 12",
								bet: {
									kind: "dozen",
									d: 1
								},
								bets,
								spinning,
								onAdd: add
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outside, {
								label: "2nd 12",
								bet: {
									kind: "dozen",
									d: 2
								},
								bets,
								spinning,
								onAdd: add
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outside, {
								label: "3rd 12",
								bet: {
									kind: "dozen",
									d: 3
								},
								bets,
								spinning,
								onAdd: add
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outside, {
								label: "Column 1",
								bet: {
									kind: "column",
									c: 1
								},
								bets,
								spinning,
								onAdd: add
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outside, {
								label: "Column 2",
								bet: {
									kind: "column",
									c: 2
								},
								bets,
								spinning,
								onAdd: add
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outside, {
								label: "Column 3",
								bet: {
									kind: "column",
									c: 3
								},
								bets,
								spinning,
								onAdd: add
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outside, {
								label: "1–18",
								bet: { kind: "low" },
								bets,
								spinning,
								onAdd: add
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outside, {
								label: "Even",
								bet: { kind: "even" },
								bets,
								spinning,
								onAdd: add
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outside, {
								label: "Red",
								bet: { kind: "red" },
								bets,
								spinning,
								onAdd: add,
								hot: "red"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outside, {
								label: "Black",
								bet: { kind: "black" },
								bets,
								spinning,
								onAdd: add,
								hot: "black"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outside, {
								label: "Odd",
								bet: { kind: "odd" },
								bets,
								spinning,
								onAdd: add
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outside, {
								label: "19–36",
								bet: { kind: "high" },
								bets,
								spinning,
								onAdd: add
							})
						]
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultLine, {
				text: banner,
				tone
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-wrap items-end justify-between gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mb-2 text-xs tracking-wide text-muted uppercase",
				children: [
					tx("Chip"),
					" · ",
					tx("Bet"),
					" ",
					fmt(onTable)
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DenomPicker, {
				value: denom,
				onChange: setDenom,
				denoms: DENOMS,
				disabled: spinning
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GhostButton, {
					disabled: spinning || bets.length === 0,
					onClick: clear,
					children: tx("Clear")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoldButton, {
					disabled: spinning || onTable === 0 || chips < onTable,
					onClick: spin,
					children: spinning ? tx("Spinning") : tx("Spin ")
				})]
			})]
		}),
		bets.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 space-y-2",
			children: bets.map((item) => {
				const key = betKey(item.bet);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center justify-between gap-3 border-t border-line pt-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: tx(describeBet(item.bet)) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "num text-accent",
							children: fmt(item.amount)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "min-h-11 px-2 text-muted",
							disabled: spinning,
							onClick: () => remove(key),
							children: tx("Remove")
						})]
					})]
				}, key);
			})
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrokeRack, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RuleNote, {
			title: "Payouts",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tx("Straight 35 to 1. Split 17 to 1. Street 11 to 1. Corner 8 to 1. Six-line 5 to 1. Dozens and columns 2 to 1. Red, black, odd, even, and halves pay 1 to 1, and lose if the ball finds zero.") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: tx("Column 1 is 1, 4, 7… Column 2 is 2, 5, 8… Column 3 is 3, 6, 9…") })]
		})
	] });
}
function Outside({ label, bet, bets, spinning, onAdd, hot }) {
	const amount = bets.find((item) => betKey(item.bet) === betKey(bet))?.amount ?? 0;
	const { tx, fmt } = useI18n();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		disabled: spinning,
		onClick: () => onAdd(bet),
		className: `min-h-11 rounded-md px-2 py-1 text-sm disabled:opacity-40 ${hot === "red" ? "bg-crimson text-ivory" : hot === "black" ? "border border-line bg-ink text-ivory" : "bg-felt text-ivory"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block",
			children: tx(label)
		}), amount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "num block text-ivory",
			children: fmt(amount)
		}) : null]
	});
}
function RoulettePage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HouseShell, {
		wide: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RouletteGame, {})
	});
}
//#endregion
export { RoulettePage as component };
