import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { S as useI18n, d as RuleNote, g as playCue, i as DenomPicker, n as BrokeRack, o as GoldButton, r as Console, s as HouseShell, u as ResultLine, v as randInt, x as useHouse } from "./shell-Bl0y8KZI.mjs";
import { t as useReducedMotion } from "./use-reduced-motion-CCumc2IX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/segfault-CHjUh4rU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PAY_SYMS = [
	"bit",
	"ping",
	"hash",
	"link",
	"lock",
	"chip",
	"rack",
	"core"
];
var PAY_SET = new Set(PAY_SYMS);
/** Per route, in thousandths of the stake, for 3, 4, 5, and 6 racks from the left. */
var PAY = {
	bit: [
		250,
		600,
		1400,
		3200
	],
	ping: [
		300,
		800,
		1800,
		4e3
	],
	hash: [
		400,
		1e3,
		2200,
		5e3
	],
	link: [
		500,
		1300,
		3e3,
		6500
	],
	lock: [
		700,
		1800,
		4200,
		9e3
	],
	chip: [
		1e3,
		2600,
		6e3,
		13e3
	],
	rack: [
		1500,
		4e3,
		9e3,
		2e4
	],
	core: [
		2500,
		6500,
		16e3,
		34e3
	]
};
var WEIGHTS = [
	{
		sym: "nop",
		w: 28
	},
	{
		sym: "bit",
		w: 10
	},
	{
		sym: "ping",
		w: 9
	},
	{
		sym: "hash",
		w: 9
	},
	{
		sym: "link",
		w: 8
	},
	{
		sym: "lock",
		w: 7
	},
	{
		sym: "chip",
		w: 6
	},
	{
		sym: "rack",
		w: 4
	},
	{
		sym: "core",
		w: 3
	},
	{
		sym: "bug",
		w: 2
	},
	{
		sym: "root",
		w: 2
	}
];
var WEIGHT_TOTAL = WEIGHTS.reduce((sum, item) => sum + item.w, 0);
var CAP = 400;
function waysFor(open) {
	return open ** 6;
}
function draw() {
	let roll = randInt(WEIGHT_TOTAL);
	for (const item of WEIGHTS) {
		if (roll < item.w) return { sym: item.sym };
		roll -= item.w;
	}
	return { sym: "bit" };
}
function isPay(sym) {
	return PAY_SET.has(sym);
}
function cloneGrid(grid) {
	return grid.map((col) => col.map((cell) => ({ ...cell })));
}
function activeStart(open) {
	return 6 - open;
}
function inPlay(row, open) {
	return row >= 6 - open;
}
function freshGrid() {
	return Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => draw()));
}
function evaluate(grid, open, bet, mult) {
	const lit = [];
	const seen = /* @__PURE__ */ new Set();
	const usedBug = /* @__PURE__ */ new Set();
	let amount = 0;
	const order = [...PAY_SYMS].reverse();
	for (const sym of order) {
		const counts = [];
		const cells = [];
		let real = 0;
		for (let c = 0; c < 6; c++) {
			const reel = [];
			for (let r = activeStart(open); r < 6; r++) {
				const cell = grid[c][r].sym;
				if (cell === sym) {
					reel.push({
						c,
						r
					});
					real += 1;
				} else if (cell === "bug" && !usedBug.has(`${c}:${r}`)) reel.push({
					c,
					r
				});
			}
			if (reel.length === 0) break;
			counts.push(reel.length);
			cells.push(reel);
		}
		if (counts.length < 3 || real === 0) continue;
		const ways = counts.reduce((product, n) => product * n, 1);
		amount += Math.round(bet * PAY[sym][counts.length - 3] * ways * mult / 1e3);
		for (const reel of cells) for (const hit of reel) {
			if (grid[hit.c][hit.r].sym === "bug") usedBug.add(`${hit.c}:${hit.r}`);
			const key = `${hit.c}:${hit.r}`;
			if (seen.has(key)) continue;
			seen.add(key);
			lit.push(hit);
		}
	}
	return {
		amount,
		lit
	};
}
function findBugs(grid, open) {
	const bugs = [];
	for (let c = 0; c < 6; c++) for (let r = activeStart(open); r < 6; r++) if (grid[c][r].sym === "bug") bugs.push({
		c,
		r
	});
	return bugs;
}
function blastHits(grid, open, bugs) {
	const lit = [];
	const seen = /* @__PURE__ */ new Set();
	const add = (c, r) => {
		const key = `${c}:${r}`;
		if (seen.has(key)) return;
		seen.add(key);
		lit.push({
			c,
			r
		});
	};
	for (const bug of bugs) {
		add(bug.c, bug.r);
		for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
			if (dc === 0 && dr === 0) continue;
			const nc = bug.c + dc;
			const nr = bug.r + dr;
			if (nc < 0 || nc >= 6 || nr < 0 || nr >= 6 || !inPlay(nr, open)) continue;
			const sym = grid[nc][nr].sym;
			if (sym === "root" || sym === "bug") continue;
			add(nc, nr);
		}
	}
	return lit;
}
function mineLine(grid, open) {
	let best = null;
	for (let r = activeStart(open); r < 6; r++) {
		let run = [];
		let sym = null;
		const consider = () => {
			if (run.length >= 4 && (!best || run.length > best.length)) best = run.slice();
		};
		for (let c = 0; c < 6; c++) {
			const cell = grid[c][r].sym;
			if (isPay(cell) && (sym === null || cell === sym)) {
				sym = cell;
				run.push({
					c,
					r
				});
			} else {
				consider();
				run = [];
				sym = null;
				if (isPay(cell)) {
					sym = cell;
					run = [{
						c,
						r
					}];
				}
			}
		}
		consider();
	}
	if (!best) return null;
	const converted = best;
	const above = [];
	for (const cell of converted) {
		const up = cell.r - 1;
		if (up < 0) continue;
		if (grid[cell.c][up].sym === "root") continue;
		above.push({
			c: cell.c,
			r: up
		});
	}
	return {
		converted,
		above
	};
}
function fall(grid, removed) {
	const next = [];
	for (let c = 0; c < 6; c++) {
		const kept = [];
		for (let r = 0; r < 6; r++) if (!removed[c][r]) kept.push(grid[c][r]);
		const col = [];
		for (let i = 0; i < 6 - kept.length; i++) col.push(draw());
		col.push(...kept);
		next.push(col);
	}
	return next;
}
function blankRemoved() {
	return Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => false));
}
function mark(removed, hits) {
	for (const hit of hits) removed[hit.c][hit.r] = true;
}
function countRoots(grid, open) {
	let n = 0;
	for (let c = 0; c < 6; c++) for (let r = activeStart(open); r < 6; r++) if (grid[c][r].sym === "root") n += 1;
	return n;
}
function cashChip(bet) {
	const table = [
		.25,
		.5,
		.5,
		1,
		1
	];
	return Math.max(1, Math.round(bet * table[randInt(table.length)]));
}
function playShell(bet, roots) {
	const grid = Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => ({ sym: "bit" })));
	const spots = [];
	for (let c = 0; c < 6; c++) for (let r = 3; r < 6; r++) spots.push({
		c,
		r
	});
	for (let i = 0; i < Math.min(roots, 8); i++) {
		const spot = spots.splice(randInt(spots.length), 1)[0];
		grid[spot.c][spot.r] = {
			sym: "root",
			cash: cashChip(bet)
		};
	}
	const frames = [];
	let left = 3;
	let hotfix = false;
	const shot = (leftNow, kind, stepWin = 0, banner = "shell") => {
		frames.push({
			grid: cloneGrid(grid),
			open: 3,
			mult: 1,
			stepWin,
			total: 0,
			lit: [],
			kind,
			mode: "shell",
			banner,
			bannerN: banner === "shellWin" ? stepWin : leftNow,
			shellLeft: leftNow
		});
	};
	shot(left, "shell");
	for (let spin = 0; spin < 12 && left > 0; spin++) {
		left -= 1;
		let landed = 0;
		let full = true;
		for (let c = 0; c < 6; c++) for (let r = 3; r < 6; r++) {
			if (grid[c][r].sym === "root") continue;
			full = false;
			if (randInt(100) >= 9) continue;
			landed += 1;
			const cash = cashChip(bet);
			const hot = !hotfix && randInt(100) < 5;
			grid[c][r] = {
				sym: "root",
				cash,
				hot
			};
			if (hot) {
				hotfix = true;
				for (let cc = 0; cc < 6; cc++) for (let rr = 3; rr < 6; rr++) {
					const cell = grid[cc][rr];
					if (cell.cash) cell.cash *= 2;
				}
			}
		}
		if (landed > 0) left = 3;
		shot(left, "shell");
		if (full) break;
	}
	let sum = 0;
	for (let c = 0; c < 6; c++) for (let r = 3; r < 6; r++) sum += grid[c][r].cash ?? 0;
	shot(0, "done", sum, "shellWin");
	return frames;
}
function resolveSpin(bet) {
	let grid = freshGrid();
	let open = 3;
	let mult = 1;
	let total = 0;
	const frames = [];
	const snap = (kind, stepWin, lit, banner, bannerN, mode = "rack") => {
		frames.push({
			grid: cloneGrid(grid),
			open,
			mult,
			stepWin,
			total,
			lit,
			kind,
			mode,
			banner,
			bannerN
		});
	};
	snap("drop", 0, [], "idle", open);
	for (let guard = 0; guard < 14; guard++) {
		if (total >= bet * CAP) break;
		const result = evaluate(grid, open, bet, mult);
		if (result.amount > 0) {
			const room = bet * CAP - total;
			const paid = Math.max(0, Math.min(result.amount, room));
			total += paid;
			snap("win", paid, result.lit, paid < result.amount ? "cap" : "win", paid);
			const removed = blankRemoved();
			mark(removed, result.lit);
			const bugs = findBugs(grid, open);
			if (bugs.length) {
				const blast = blastHits(grid, open, bugs);
				mark(removed, blast);
				mult = Math.min(5, mult + 1);
				snap("blast", 0, blast, "blast", mult);
			}
			if (open < 6) open += 1;
			grid = fall(grid, removed);
			snap("drop", 0, [], "open", open);
			continue;
		}
		const mined = mineLine(grid, open);
		if (mined) {
			for (const cell of mined.converted) grid[cell.c][cell.r] = { sym: "bug" };
			snap("mine", 0, [...mined.converted, ...mined.above], "mine", 0);
			const removed = blankRemoved();
			mark(removed, mined.above);
			grid = fall(grid, removed);
			snap("drop", 0, [], "open", open);
			continue;
		}
		const bugs = findBugs(grid, open);
		if (bugs.length) {
			const blast = blastHits(grid, open, bugs);
			snap("blast", 0, blast, "blast", mult);
			const removed = blankRemoved();
			mark(removed, blast);
			grid = fall(grid, removed);
			snap("drop", 0, [], "open", open);
			continue;
		}
		break;
	}
	if (countRoots(grid, open) >= 3 && total < bet * CAP) {
		const shell = playShell(bet, countRoots(grid, open));
		for (const frame of shell) if (frame.kind === "done") {
			const room = bet * CAP - total;
			const paid = Math.max(0, Math.min(frame.stepWin, room));
			total += paid;
			frames.push({
				...frame,
				total,
				stepWin: paid,
				banner: paid < frame.stepWin ? "cap" : "shellWin",
				bannerN: paid
			});
		} else frames.push({
			...frame,
			total
		});
	}
	if (frames[frames.length - 1]?.kind !== "done") snap("done", 0, [], total > 0 ? "win" : "none", total);
	return frames;
}
var BETS = [
	10,
	25,
	50,
	100
];
var PAY_ROWS = [
	{
		key: "sfPayBit",
		sym: "bit"
	},
	{
		key: "sfPayPing",
		sym: "ping"
	},
	{
		key: "sfPayHash",
		sym: "hash"
	},
	{
		key: "sfPayLink",
		sym: "link"
	},
	{
		key: "sfPayLock",
		sym: "lock"
	},
	{
		key: "sfPayChip",
		sym: "chip"
	},
	{
		key: "sfPayRack",
		sym: "rack"
	},
	{
		key: "sfPayCore",
		sym: "core"
	}
];
var IDLE = [
	[
		"nop",
		"nop",
		"nop",
		"hash",
		"nop",
		"bit"
	],
	[
		"nop",
		"nop",
		"nop",
		"nop",
		"link",
		"ping"
	],
	[
		"nop",
		"nop",
		"nop",
		"lock",
		"nop",
		"nop"
	],
	[
		"nop",
		"nop",
		"nop",
		"nop",
		"chip",
		"lock"
	],
	[
		"nop",
		"nop",
		"nop",
		"rack",
		"nop",
		"bug"
	],
	[
		"nop",
		"nop",
		"nop",
		"nop",
		"core",
		"root"
	]
];
var GLYPH = {
	bit: "💠",
	ping: "📡",
	hash: "🔶",
	link: "🔗",
	lock: "🔒",
	chip: "💻",
	rack: "🗄️",
	core: "💎",
	bug: "🐞",
	root: "🐚",
	nop: "·"
};
function Glyph({ sym }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `leading-none select-none ${sym === "nop" ? "text-lg text-ivory/35" : "text-3xl"}`,
		role: "img",
		"aria-label": sym,
		children: GLYPH[sym]
	});
}
function tone(sym) {
	if (sym === "bug") return "border-crimson bg-crimson/25 text-ivory";
	if (sym === "root") return "border-phosphor bg-phosphor/15 text-phosphor";
	if (sym === "nop") return "border-term-line bg-ink/50 text-ivory/40";
	if (sym === "core" || sym === "rack") return "border-phosphor/60 bg-ink/35 text-phosphor";
	if (sym === "chip" || sym === "lock" || sym === "link") return "border-line bg-ink/35 text-ivory";
	return "border-line bg-ink/35 text-ivory/80";
}
function SegfaultGame() {
	const reduced = useReducedMotion();
	const { t, fmt } = useI18n();
	const chips = useHouse((s) => s.chips);
	const [bet, setBet] = (0, import_react.useState)(25);
	const [frames, setFrames] = (0, import_react.useState)([]);
	const [cursor, setCursor] = (0, import_react.useState)(0);
	const [running, setRunning] = (0, import_react.useState)(false);
	const [banner, setBanner] = (0, import_react.useState)("idle");
	const [bannerN, setBannerN] = (0, import_react.useState)(3);
	const [toneName, setToneName] = (0, import_react.useState)("idle");
	const owed = (0, import_react.useRef)(null);
	const flush = (announce) => {
		const due = owed.current;
		if (!due) return;
		owed.current = null;
		useHouse.getState().settle("segfault", due.stake, due.back, due.note);
		if (!announce) return;
		setRunning(false);
		if (due.back > due.stake) {
			setToneName("win");
			playCue("win");
		} else if (due.back === due.stake) {
			setToneName("push");
			playCue("tick");
		} else {
			setToneName("lose");
			playCue("lose");
		}
	};
	(0, import_react.useEffect)(() => () => flush(false), []);
	(0, import_react.useEffect)(() => {
		if (!running) return;
		const frame = frames[cursor];
		if (!frame) return;
		setBanner(frame.banner);
		setBannerN(frame.kind === "done" ? frame.total : frame.bannerN);
		if (frame.banner === "win" || frame.banner === "shellWin" || frame.banner === "cap") setToneName("win");
		else if (cursor < frames.length - 1) setToneName("idle");
		if (cursor >= frames.length - 1) {
			flush(true);
			return;
		}
		const id = window.setTimeout(() => setCursor((value) => value + 1), reduced ? 70 : 480);
		return () => window.clearTimeout(id);
	}, [
		running,
		cursor,
		frames,
		reduced
	]);
	function run() {
		if (running) return;
		if (!useHouse.getState().stake(bet)) return;
		const script = resolveSpin(bet);
		const total = script[script.length - 1]?.total ?? 0;
		const shell = script.some((frame) => frame.mode === "shell");
		owed.current = {
			stake: bet,
			back: total,
			note: shell ? "Root shell" : "Segfault"
		};
		setFrames(script);
		setCursor(0);
		setToneName("idle");
		setBanner("idle");
		setBannerN(3);
		setRunning(true);
		playCue("spin");
	}
	const frame = frames[cursor];
	const lit = new Set((frame?.lit ?? []).map((hit) => `${hit.c}:${hit.r}`));
	const line = banner === "win" ? t("sfWin", { n: fmt(bannerN) }) : banner === "blast" ? t("sfBlast", { n: bannerN }) : banner === "mine" ? t("sfMine") : banner === "shell" ? t("sfShell", { n: bannerN }) : banner === "shellWin" ? t("sfShellWin", { n: fmt(bannerN) }) : banner === "cap" ? t("sfCap", { n: fmt(bannerN) }) : banner === "none" ? t("sfNone") : banner === "open" ? t("sfOpen", { n: bannerN }) : t("sfIdle");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Console, {
		pid: "05",
		unit: "rack.segfault",
		title: t("gameSegfault"),
		blurb: t("sfIntro"),
		live: running,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "term-stage p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-xs tracking-wide text-term-muted uppercase",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("sfRows", { n: frame?.open ?? 3 }) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "num text-phosphor",
								children: t("sfWays", { n: fmt(waysFor(frame?.open ?? 3)) })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("sfMult", { n: frame?.mult ?? 1 }) })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-2 grid grid-cols-6 gap-1 text-center font-mono text-xs tracking-widest text-term-muted",
						children: Array.from({ length: 6 }, (_, c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["0", c + 1] }, c))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-6 gap-1",
						"aria-busy": running,
						children: Array.from({ length: 6 }, (_, c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid gap-1",
							children: Array.from({ length: 6 }, (_, r) => {
								if (frame?.mode === "shell" && r < 3) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2" }, r);
								const cell = frame?.grid[c]?.[r] ?? { sym: IDLE[c]?.[r] ?? "nop" };
								const locked = frame?.mode !== "shell" && r < 6 - (frame?.open ?? 3);
								const on = lit.has(`${c}:${r}`);
								const falling = Boolean(frame && frame.kind === "drop" && !locked);
								const ring = frame?.kind === "blast" && on ? "ring-2 ring-crimson" : on ? "ring-2 ring-phosphor" : "";
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `relative flex aspect-square items-center justify-center rounded-sm border ${locked ? "border-term-line bg-ink/70" : tone(cell.sym)} ${ring} ${cell.hot ? "ring-2 ring-ivory" : ""} ${falling ? "sf-fall" : ""}`,
									children: locked ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px w-5 bg-term-muted" }) : cell.cash ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "num text-xs leading-none",
										children: cell.cash
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Glyph, { sym: cell.sym })
								}, `${cursor}-${r}`);
							})
						}, c))
					}),
					frame?.mode === "shell" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-center font-mono text-xs tracking-wide text-phosphor uppercase",
						children: t("sfShell", { n: frame.shellLeft ?? 0 })
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultLine, {
					text: line,
					tone: toneName
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-wrap items-end justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 font-mono text-xs tracking-wide text-term-muted uppercase",
					children: t("betSize")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DenomPicker, {
					value: bet,
					onChange: setBet,
					denoms: BETS,
					disabled: running,
					label: "Bet size"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoldButton, {
					className: "min-w-32 px-8",
					disabled: running || chips < bet,
					onClick: run,
					children: running ? t("sfRunning") : t("sfRun", { n: fmt(bet) })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrokeRack, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RuleNote, {
				title: "House rules",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t("sfRules1") }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t("sfRules2") }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t("sfRules3") }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-1",
						children: PAY_ROWS.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: t(row.key) }, row.sym))
					})
				]
			})
		]
	});
}
function SegfaultPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HouseShell, {
		wide: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SegfaultGame, {})
	});
}
//#endregion
export { SegfaultPage as component };
