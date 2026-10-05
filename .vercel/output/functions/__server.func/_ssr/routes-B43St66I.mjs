import { S as require_jsx_runtime, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Spade, d as Cpu, f as Club, l as Dices, p as Cherry } from "../_libs/lucide-react.mjs";
import { S as useI18n, r as Console, s as HouseShell, t as BUY_IN } from "./shell-BLRQpTWr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-B43St66I.js
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HouseShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Console, {
		pid: "00",
		unit: "house.index",
		title: t("hero"),
		blurb: t("heroLine", { n: fmt(BUY_IN) }),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-mono text-xs tracking-wide text-term-muted uppercase",
			children: t("rooms")
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 border-t border-term-line",
			children: ROOMS.map((room) => {
				const Icon = room.icon;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: room.to,
					className: "group flex min-h-20 items-center gap-4 border-b border-term-line py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "num w-8 font-mono text-xs text-phosphor",
							children: room.kicker
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-term-line text-phosphor",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "size-4",
								"aria-hidden": true
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block font-display text-3xl leading-none text-term-fg transition-colors group-hover:text-phosphor",
								children: t(room.title)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-1 block text-sm text-term-muted",
								children: t(room.line)
							})]
						})
					]
				}, room.to);
			})
		})]
	}) });
}
//#endregion
export { Home as component };
