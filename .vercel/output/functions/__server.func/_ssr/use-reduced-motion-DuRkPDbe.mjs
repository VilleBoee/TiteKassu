import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as Diamond, m as Heart, s as Spade, y as Club } from "../_libs/lucide-react.mjs";
import { s as useI18n } from "./shell-bdhmSiAn.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/use-reduced-motion-DuRkPDbe.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function randInt(n) {
	if (!Number.isInteger(n) || n <= 0) throw new Error("randInt expects a positive integer");
	const buf = /* @__PURE__ */ new Uint32Array(1);
	const limit = Math.floor(4294967296 / n) * n;
	let x = 0;
	do {
		crypto.getRandomValues(buf);
		x = buf[0] ?? 0;
	} while (x >= limit);
	return x % n;
}
function shuffle(items) {
	const a = items.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = randInt(i + 1);
		const tmp = a[i];
		a[i] = a[j];
		a[j] = tmp;
	}
	return a;
}
var RANKS = [
	"A",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"10",
	"J",
	"Q",
	"K"
];
var SUITS$1 = [
	"S",
	"H",
	"D",
	"C"
];
function makeDeck() {
	const deck = [];
	for (const s of SUITS$1) for (const r of RANKS) deck.push({
		r,
		s
	});
	return deck;
}
function freshShoe(decks = 6) {
	const cards = [];
	for (let i = 0; i < decks; i++) cards.push(...makeDeck());
	return shuffle(cards);
}
function bjValue(rank) {
	if (rank === "A") return 11;
	if (rank === "K" || rank === "Q" || rank === "J") return 10;
	return Number(rank);
}
function handTotal(cards) {
	let total = 0;
	let aces = 0;
	for (const card of cards) if (card.r === "A") {
		aces += 1;
		total += 11;
	} else total += bjValue(card.r);
	while (total > 21 && aces > 0) {
		total -= 10;
		aces -= 1;
	}
	return {
		total,
		soft: aces > 0
	};
}
function isBlackjack(cards) {
	return cards.length === 2 && handTotal(cards).total === 21;
}
function pokerRank(rank) {
	if (rank === "A") return 14;
	if (rank === "K") return 13;
	if (rank === "Q") return 12;
	if (rank === "J") return 11;
	return Number(rank);
}
function cardLabel(card) {
	const suit = {
		S: "spades",
		H: "hearts",
		D: "diamonds",
		C: "clubs"
	}[card.s];
	return `${{
		A: "ace",
		K: "king",
		Q: "queen",
		J: "jack"
	}[card.r] ?? card.r} of ${suit}`;
}
var SUITS = {
	S: Spade,
	H: Heart,
	D: Diamond,
	C: Club
};
function PlayingCard({ card, down = false, small = false, enter = false }) {
	const size = small ? "pcard pcard-sm" : "pcard";
	const motion = enter ? "card-in" : "";
	if (down || !card) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `${size} ${motion} felt-surface relative shrink-0 rounded-md border border-gold-dim`,
		"aria-hidden": true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-1 rounded-sm border border-gold/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-2 rounded-sm border border-ivory/20" })]
	});
	const red = card.s === "H" || card.s === "D";
	const Icon = SUITS[card.s];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `${size} ${motion} relative shrink-0 rounded-md border border-line bg-ivory shadow-sm ${red ? "text-crimson" : "text-ink"}`,
		role: "img",
		"aria-label": cardLabel(card),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "absolute top-0.5 left-1 flex flex-col items-center leading-none",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: `pcard-rank font-display font-semibold ${card.r === "10" ? "text-sm" : "text-lg"}`,
				children: card.r
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: "pcard-pip size-3",
				"aria-hidden": true
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			className: "pcard-suit absolute top-1/2 left-1/2 size-7 -translate-x-1/2 -translate-y-1/2",
			"aria-hidden": true
		})]
	});
}
function LampMark({ lamp }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-full items-center justify-center text-ivory",
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LampGlyph, { lamp })
	});
}
function LampGlyph({ lamp }) {
	if (lamp === "cherry") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 64 64",
		className: "size-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M34 8c6 8 8 12 6 18",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "2",
				className: "text-gold"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "24",
				cy: "40",
				r: "11",
				className: "fill-crimson"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "40",
				cy: "42",
				r: "11",
				className: "fill-crimson"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "21",
				cy: "36",
				r: "3",
				className: "fill-ivory/50"
			})
		]
	});
	if (lamp === "lemon") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 64 64",
		className: "size-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
			cx: "32",
			cy: "34",
			rx: "16",
			ry: "12",
			transform: "rotate(-24 32 34)",
			className: "fill-gold"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M46 18c4 2 6 6 4 8",
			fill: "none",
			className: "stroke-felt",
			strokeWidth: "2"
		})]
	});
	if (lamp === "orange") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 64 64",
		className: "size-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "32",
				cy: "36",
				r: "14",
				className: "fill-gold"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M32 22c2-8 10-8 12-4",
				fill: "none",
				className: "stroke-felt",
				strokeWidth: "2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "32",
				cy: "36",
				r: "5",
				className: "fill-gold-dim"
			})
		]
	});
	if (lamp === "plum") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 64 64",
		className: "size-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
				cx: "32",
				cy: "38",
				rx: "13",
				ry: "15",
				className: "fill-felt"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M32 22c4-8 12-6 12-2",
				fill: "none",
				className: "stroke-gold",
				strokeWidth: "2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
				cx: "27",
				cy: "32",
				rx: "3",
				ry: "5",
				className: "fill-ivory/30"
			})
		]
	});
	if (lamp === "bell") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 64 64",
		className: "size-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M18 40c2-14 8-22 14-22s12 8 14 22H18z",
				className: "fill-gold"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "16",
				y: "40",
				width: "32",
				height: "5",
				rx: "1",
				className: "fill-gold"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "32",
				cy: "50",
				r: "4",
				className: "fill-gold"
			})
		]
	});
	if (lamp === "bar") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 64 64",
		className: "size-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			x: "8",
			y: "24",
			width: "48",
			height: "16",
			rx: "2",
			className: "fill-ivory"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
			x: "32",
			y: "36",
			textAnchor: "middle",
			className: "fill-ink",
			fontSize: "12",
			fontFamily: "Outfit, sans-serif",
			children: "BAR"
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 64 64",
		className: "size-10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
			x: "32",
			y: "46",
			textAnchor: "middle",
			className: "fill-crimson",
			fontSize: "40",
			fontFamily: "Cormorant Garamond, Georgia, serif",
			children: "7"
		})
	});
}
function DenomPicker({ value, onChange, denoms, disabled, label }) {
	const { tx } = useI18n();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		role: "radiogroup",
		"aria-label": tx(label ?? "Chip"),
		className: "flex flex-wrap gap-2",
		children: denoms.map((denom) => {
			const on = value === denom;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				role: "radio",
				"aria-checked": on,
				disabled,
				onClick: () => onChange(denom),
				className: `num flex size-12 items-center justify-center rounded-full border-2 text-sm font-semibold disabled:opacity-40 ${on ? "border-ivory bg-gold text-ink" : "border-gold-dim bg-felt-deep text-gold"}`,
				children: denom
			}, denom);
		})
	});
}
function GoldButton({ className = "", children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		...props,
		type: "button",
		className: `inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold tracking-wide text-ink disabled:opacity-40 ${className}`,
		children
	});
}
function GhostButton({ className = "", cabinet = false, children, ...props }) {
	const tone = cabinet ? "border-line text-ivory" : "border-stroke text-fg";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		...props,
		type: "button",
		className: `inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm font-medium disabled:opacity-40 ${tone} ${className}`,
		children
	});
}
function RuleNote({ title, children }) {
	const { tx } = useI18n();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
		className: "mt-6 border-t border-stroke pt-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
			className: "min-h-11 cursor-pointer list-none text-sm tracking-wide text-accent uppercase",
			children: tx(title)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 space-y-2 text-sm text-muted",
			children
		})]
	});
}
function ResultLine({ text, tone }) {
	const { tx } = useI18n();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: `font-display text-3xl leading-none ${tone === "win" ? "text-accent" : tone === "lose" ? "text-crimson" : "text-fg"}`,
		"aria-live": "polite",
		children: tx(text)
	});
}
function useReducedMotion() {
	const [reduced, setReduced] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const query = window.matchMedia("(prefers-reduced-motion: reduce)");
		const apply = () => setReduced(query.matches);
		apply();
		query.addEventListener("change", apply);
		return () => query.removeEventListener("change", apply);
	}, []);
	return reduced;
}
//#endregion
export { PlayingCard as a, freshShoe as c, makeDeck as d, pokerRank as f, useReducedMotion as h, LampMark as i, handTotal as l, shuffle as m, GhostButton as n, ResultLine as o, randInt as p, GoldButton as r, RuleNote as s, DenomPicker as t, isBlackjack as u };
