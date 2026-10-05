import { S as require_jsx_runtime, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { b as Cherry, g as Dices, s as Spade, v as Cpu, y as Club } from "../_libs/lucide-react.mjs";
import { r as HouseShell, s as useI18n, t as BUY_IN } from "./shell-bdhmSiAn.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CaURRPUp.js
var import_jsx_runtime = require_jsx_runtime();
var ROOMS = [
	{
		to: "/slots",
		kicker: "01",
		title: "gameSlots",
		line: "roomSlots",
		icon: Cherry
	},
	{
		to: "/blackjack",
		kicker: "02",
		title: "gameBlackjack",
		line: "roomBlackjack",
		icon: Spade
	},
	{
		to: "/roulette",
		kicker: "03",
		title: "gameRoulette",
		line: "roomRoulette",
		icon: Dices
	},
	{
		to: "/poker",
		kicker: "04",
		title: "gamePoker",
		line: "roomPoker",
		icon: Club
	},
	{
		to: "/segfault",
		kicker: "05",
		title: "gameSegfault",
		line: "roomSegfault",
		icon: Cpu
	}
];
function Home() {
	const { t, fmt } = useI18n();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(HouseShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs tracking-[0.22em] text-accent uppercase",
			children: t("rooms")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-2 max-w-xl font-display text-6xl leading-[0.9]",
			children: t("hero")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 max-w-prose text-muted",
			children: t("heroLine", { n: fmt(BUY_IN) })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-8 border-t border-stroke",
			children: ROOMS.map((room) => {
				const Icon = room.icon;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: room.to,
					className: "group flex min-h-24 items-center gap-4 border-b border-stroke py-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "num w-8 text-sm text-accent",
							children: room.kicker
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-stroke text-accent",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "size-4",
								"aria-hidden": true
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block font-display text-3xl leading-none group-hover:text-accent",
								children: t(room.title)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-1 block text-sm text-muted",
								children: t(room.line)
							})]
						})
					]
				}, room.to);
			})
		})
	] });
}
//#endregion
export { Home as component };
