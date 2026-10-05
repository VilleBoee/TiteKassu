import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { S as useI18n, a as GhostButton, d as RuleNote, f as freshShoe, g as playCue, i as DenomPicker, l as PlayingCard, m as isBlackjack, n as BrokeRack, o as GoldButton, p as handTotal, r as Console, s as HouseShell, u as ResultLine, x as useHouse } from "./shell-BLRQpTWr.mjs";
import { t as useReducedMotion } from "./use-reduced-motion-CCumc2IX.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/blackjack-9g9gyxNQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function createTable() {
	return {
		shoe: [],
		dealer: [],
		hands: [],
		active: 0,
		phase: "bet",
		baseBet: 0,
		insuranceBet: 0,
		settlement: null
	};
}
function clearHand(table) {
	return {
		...table,
		phase: "bet",
		hands: [],
		dealer: [],
		active: 0,
		baseBet: 0,
		insuranceBet: 0,
		settlement: null
	};
}
function drawOne(shoe) {
	const source = shoe.length === 0 ? freshShoe() : shoe;
	return {
		card: source[0],
		shoe: source.slice(1)
	};
}
function replace(hands, index, hand) {
	return hands.map((h, i) => i === index ? hand : h);
}
function dealerShouldHit(cards) {
	return handTotal(cards).total < 17;
}
function canHit(table) {
	if (table.phase !== "player") return false;
	const hand = table.hands[table.active];
	if (!hand || hand.stood || hand.splitAce) return false;
	return handTotal(hand.cards).total < 21;
}
function canStand(table) {
	return table.phase === "player" && !!table.hands[table.active] && !table.hands[table.active].stood;
}
function canDouble(table) {
	if (table.phase !== "player") return false;
	const hand = table.hands[table.active];
	return !!hand && hand.cards.length === 2 && !hand.splitAce && !hand.stood;
}
function canSplit(table) {
	if (table.phase !== "player" || table.hands.length !== 1) return false;
	const hand = table.hands[0];
	if (!hand || hand.cards.length !== 2 || hand.wasSplit) return false;
	return hand.cards[0].r === hand.cards[1].r;
}
function advance(table) {
	const hand = table.hands[table.active];
	if (!hand) return playDealer(table);
	if (!hand.stood && handTotal(hand.cards).total < 21) return table;
	const hands = replace(table.hands, table.active, {
		...hand,
		stood: true
	});
	const nextIndex = hands.findIndex((h, i) => i > table.active && !h.stood);
	if (nextIndex >= 0) return {
		...table,
		hands,
		active: nextIndex
	};
	return playDealer({
		...table,
		hands
	});
}
function playDealer(table) {
	const anyLive = table.hands.some((h) => handTotal(h.cards).total <= 21);
	let shoe = table.shoe;
	let dealer = table.dealer.slice();
	if (anyLive) while (dealerShouldHit(dealer)) {
		const drawn = drawOne(shoe);
		dealer = [...dealer, drawn.card];
		shoe = drawn.shoe;
	}
	return settle({
		...table,
		shoe,
		dealer,
		phase: "done",
		active: -1
	});
}
function settle(table) {
	const dealerTotal = handTotal(table.dealer).total;
	const dealerBJ = isBlackjack(table.dealer);
	const dealerBust = dealerTotal > 21;
	let mainReturn = 0;
	const parts = [];
	table.hands.forEach((hand, index) => {
		const total = handTotal(hand.cards).total;
		const natural = isBlackjack(hand.cards) && !hand.wasSplit;
		const prefix = table.hands.length > 1 ? index === 0 ? "Left " : "Right " : "";
		if (total > 21) {
			parts.push(prefix ? `${prefix}bust` : "You bust");
			return;
		}
		if (natural && dealerBJ) {
			mainReturn += hand.bet;
			parts.push(prefix ? `${prefix}push` : "Push");
			return;
		}
		if (natural) {
			mainReturn += hand.bet + Math.round(hand.bet * 3 / 2);
			parts.push(prefix ? `${prefix}blackjack` : "Blackjack");
			return;
		}
		if (dealerBJ) {
			parts.push(prefix ? `${prefix}loses to a blackjack` : "You lose to a blackjack");
			return;
		}
		if (dealerBust || total > dealerTotal) {
			mainReturn += hand.bet * 2;
			parts.push(!prefix && dealerBust ? "Dealer busts. You win" : prefix ? `${prefix}wins` : "You win");
			return;
		}
		if (total === dealerTotal) {
			mainReturn += hand.bet;
			parts.push(prefix ? `${prefix}push` : "Push");
			return;
		}
		parts.push(prefix ? `${prefix}loses` : "You lose");
	});
	let insuranceReturn = 0;
	if (table.insuranceBet > 0) {
		if (dealerBJ) {
			insuranceReturn = table.insuranceBet * 3;
			parts.push("Insurance pays");
		} else parts.push("Insurance loses");
	}
	const note = parts.map((part) => part.trim()).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" · ");
	return {
		...table,
		phase: "done",
		active: -1,
		settlement: {
			mainReturn,
			insuranceReturn,
			note: note || "Settled"
		}
	};
}
function deal(table, bet) {
	if (table.phase !== "bet" || bet <= 0) return table;
	let shoe = table.shoe.length < 78 ? freshShoe() : table.shoe;
	const take = () => {
		const drawn = drawOne(shoe);
		shoe = drawn.shoe;
		return drawn.card;
	};
	const p1 = take();
	const up = take();
	const p2 = take();
	const hole = take();
	const hand = {
		cards: [p1, p2],
		bet,
		stood: false,
		doubled: false,
		splitAce: false,
		wasSplit: false
	};
	const dealer = [up, hole];
	let phase = "player";
	if (up.r === "A") phase = "insurance";
	else if (isBlackjack(dealer) || isBlackjack([p1, p2])) phase = "done";
	const next = {
		shoe,
		dealer,
		hands: [hand],
		active: 0,
		phase,
		baseBet: bet,
		insuranceBet: 0,
		settlement: null
	};
	return phase === "done" ? settle(next) : next;
}
function resolveInsurance(table, take) {
	if (table.phase !== "insurance") return table;
	const next = {
		...table,
		insuranceBet: take ? Math.floor(table.baseBet / 2) : 0,
		phase: "player"
	};
	if (isBlackjack(next.dealer) || isBlackjack(next.hands[0].cards)) return settle(next);
	return next;
}
function hit(table) {
	if (!canHit(table)) return table;
	const drawn = drawOne(table.shoe);
	const hand = table.hands[table.active];
	const cards = [...hand.cards, drawn.card];
	const total = handTotal(cards).total;
	const updated = {
		...hand,
		cards,
		stood: total >= 21
	};
	return advance({
		...table,
		shoe: drawn.shoe,
		hands: replace(table.hands, table.active, updated)
	});
}
function stand(table) {
	if (!canStand(table)) return table;
	const hand = table.hands[table.active];
	return advance({
		...table,
		hands: replace(table.hands, table.active, {
			...hand,
			stood: true
		})
	});
}
function doubleDown(table) {
	if (!canDouble(table)) return table;
	const drawn = drawOne(table.shoe);
	const hand = table.hands[table.active];
	const cards = [...hand.cards, drawn.card];
	const updated = {
		...hand,
		cards,
		bet: hand.bet * 2,
		doubled: true,
		stood: true
	};
	return advance({
		...table,
		shoe: drawn.shoe,
		hands: replace(table.hands, table.active, updated)
	});
}
function splitHand(table) {
	if (!canSplit(table)) return table;
	const hand = table.hands[0];
	const leftDraw = drawOne(table.shoe);
	const rightDraw = drawOne(leftDraw.shoe);
	const ace = hand.cards[0].r === "A";
	const leftTotal = handTotal([hand.cards[0], leftDraw.card]).total;
	const rightTotal = handTotal([hand.cards[1], rightDraw.card]).total;
	const left = {
		cards: [hand.cards[0], leftDraw.card],
		bet: hand.bet,
		stood: ace || leftTotal >= 21,
		doubled: false,
		splitAce: ace,
		wasSplit: true
	};
	const right = {
		cards: [hand.cards[1], rightDraw.card],
		bet: hand.bet,
		stood: ace || rightTotal >= 21,
		doubled: false,
		splitAce: ace,
		wasSplit: true
	};
	return advance({
		...table,
		shoe: rightDraw.shoe,
		hands: [left, right],
		active: 0
	});
}
function insuranceCost(table) {
	return Math.floor(table.baseBet / 2);
}
var DENOMS = [
	10,
	25,
	100,
	500
];
function BlackjackGame() {
	const reduced = useReducedMotion();
	const { t, fmt } = useI18n();
	const chips = useHouse((s) => s.chips);
	const [wager, setWager] = (0, import_react.useState)(25);
	const [denom, setDenom] = (0, import_react.useState)(25);
	const [table, setTable] = (0, import_react.useState)(() => createTable());
	const [banner, setBanner] = (0, import_react.useState)("Place a bet.");
	const [tone, setTone] = (0, import_react.useState)("idle");
	const [view, setView] = (0, import_react.useState)({
		players: [],
		dealer: 0,
		hole: false
	});
	const [busy, setBusy] = (0, import_react.useState)(false);
	const tableRef = (0, import_react.useRef)(table);
	const owed = (0, import_react.useRef)(null);
	const timer = (0, import_react.useRef)(0);
	const gen = (0, import_react.useRef)(0);
	const flushRef = (0, import_react.useRef)(() => {});
	flushRef.current = (announce) => {
		const due = owed.current;
		if (!due) return;
		owed.current = null;
		window.clearTimeout(timer.current);
		useHouse.getState().settle("blackjack", due.stake, due.back, due.note);
		if (!announce) return;
		setBusy(false);
		setBanner(due.note);
		if (due.back > due.stake) {
			setTone("win");
			playCue("win");
		} else if (due.back === due.stake) {
			setTone("push");
			playCue("tick");
		} else {
			setTone("lose");
			playCue("lose");
		}
	};
	(0, import_react.useEffect)(() => () => {
		gen.current += 1;
		window.clearTimeout(timer.current);
		flushRef.current(false);
	}, []);
	const runRef = (0, import_react.useRef)(() => {});
	runRef.current = (next, kind) => {
		const id = gen.current + 1;
		gen.current = id;
		const live = () => gen.current === id;
		const pace = (ms) => new Promise((resolve) => {
			timer.current = window.setTimeout(resolve, reduced ? 70 : ms);
		});
		if (next.phase === "done" && next.settlement) {
			const stake = next.hands.reduce((sum, hand) => sum + hand.bet, 0) + next.insuranceBet;
			owed.current = {
				stake,
				back: next.settlement.mainReturn + next.settlement.insuranceReturn,
				note: next.settlement.note
			};
		}
		tableRef.current = next;
		setTable(next);
		setBusy(true);
		setTone("idle");
		const showHands = () => next.hands.map((hand) => hand.cards.length);
		const finishIfLive = async () => {
			let n = 2;
			setBanner("Dealer plays");
			setView({
				players: showHands(),
				dealer: Math.min(2, next.dealer.length),
				hole: false
			});
			playCue("card");
			while (n < next.dealer.length) {
				await pace(440);
				if (!live()) return;
				n += 1;
				setView({
					players: showHands(),
					dealer: n,
					hole: false
				});
				playCue("tick");
			}
			await pace(560);
			if (!live()) return;
			flushRef.current(true);
		};
		(async () => {
			if (kind === "deal") {
				setBanner("Dealing");
				setView({
					players: [0],
					dealer: 0,
					hole: false
				});
				await pace(90);
				if (!live()) return;
				setView({
					players: [1],
					dealer: 0,
					hole: false
				});
				playCue("card");
				await pace(460);
				if (!live()) return;
				setView({
					players: [1],
					dealer: 1,
					hole: false
				});
				playCue("card");
				await pace(460);
				if (!live()) return;
				setView({
					players: [2],
					dealer: 1,
					hole: false
				});
				playCue("card");
				await pace(460);
				if (!live()) return;
				setView({
					players: [2],
					dealer: 1,
					hole: true
				});
				playCue("card");
				await pace(520);
				if (!live()) return;
				if (next.phase === "done") {
					await finishIfLive();
					return;
				}
				setBusy(false);
				setBanner(next.phase === "insurance" ? "Insurance?" : "Your hand");
				return;
			}
			setView({
				players: showHands(),
				dealer: 1,
				hole: next.dealer.length > 1
			});
			playCue("card");
			if (next.phase !== "done") {
				setBusy(false);
				setBanner(next.phase === "insurance" ? "Insurance?" : "Your hand");
				return;
			}
			await pace(kind === "peek" ? 420 : 360);
			if (!live()) return;
			await finishIfLive();
		})();
	};
	function present(next, kind) {
		runRef.current(next, kind);
	}
	function onDeal(amount = wager) {
		if (busy) return;
		const ready = tableRef.current.phase === "done" ? clearHand(tableRef.current) : tableRef.current;
		if (ready.phase !== "bet") return;
		if (!useHouse.getState().stake(amount)) return;
		present(deal(ready, amount), "deal");
	}
	function act(kind) {
		if (busy) return;
		const prev = tableRef.current;
		if (kind === "double") {
			const extra = prev.hands[prev.active]?.bet ?? 0;
			if (!canDouble(prev) || !useHouse.getState().stake(extra)) return;
			const next = doubleDown(prev);
			if (next === prev) {
				useHouse.getState().refund(extra);
				return;
			}
			present(next, "play");
			return;
		}
		if (kind === "split") {
			const extra = prev.hands[0]?.bet ?? 0;
			if (!canSplit(prev) || !useHouse.getState().stake(extra)) return;
			const next = splitHand(prev);
			if (next === prev) {
				useHouse.getState().refund(extra);
				return;
			}
			present(next, "play");
			return;
		}
		const next = kind === "hit" ? hit(prev) : stand(prev);
		if (next === prev) return;
		present(next, "play");
	}
	function insure(take) {
		if (busy) return;
		const prev = tableRef.current;
		const cost = insuranceCost(prev);
		if (take && !useHouse.getState().stake(cost)) return;
		const next = resolveInsurance(prev, take);
		if (next === prev && take) useHouse.getState().refund(cost);
		if (next !== prev) present(next, "peek");
	}
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			const target = event.target;
			if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
			const phaseNow = tableRef.current.phase;
			const key = event.key.toLowerCase();
			if (key === "h") act("hit");
			else if (key === "s") act("stand");
			else if (key === "d") act("double");
			else if (key === "p") act("split");
			else if (key === "enter" && (phaseNow === "bet" || phaseNow === "done")) onDeal();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [busy, wager]);
	const phase = table.phase;
	const dealerUp = table.dealer.slice(0, view.dealer);
	const holeDown = view.hole && table.dealer.length > view.dealer;
	const active = table.hands[table.active];
	const scoreOf = (cards) => {
		const { total, soft } = handTotal(cards);
		if (total > 21) return t("bjBust");
		if (soft && total !== 21) return t("bjSoft", { n: total });
		return t("bjTotal", { n: total });
	};
	const dealerTotal = !holeDown && dealerUp.length >= 2 ? scoreOf(dealerUp) : "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Console, {
		pid: "02",
		unit: "table.blackjack",
		title: t("gameBlackjack"),
		blurb: t("bjIntro"),
		live: busy,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "felt-surface rounded-md border border-term-line px-4 py-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-mono text-xs tracking-wide text-ivory/75 uppercase",
						children: [t("bjDealer"), dealerTotal ? ` · ${dealerTotal}` : ""]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex gap-2",
						children: [
							dealerUp.map((card, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayingCard, {
								card,
								enter: true
							}, `${card.r}${card.s}${index}`)),
							holeDown ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayingCard, {
								down: true,
								enter: true
							}) : null,
							table.dealer.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayingCard, { down: true }) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `mt-6 grid gap-4 ${table.hands.length > 1 ? "sm:grid-cols-2" : ""}`,
						children: table.hands.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-ivory/80",
							children: t("bjWait")
						}) : table.hands.map((hand, index) => {
							const live = phase === "player" && index === table.active && !busy;
							const shownCards = hand.cards.slice(0, view.players[index] ?? 0);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: `rounded-md border p-3 ${live ? "border-phosphor bg-ink/20" : "border-transparent"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "font-mono text-xs tracking-wide text-ivory/75 uppercase",
									children: [
										table.hands.length > 1 ? t(index === 0 ? "bjLeft" : "bjRight") : t("you"),
										shownCards.length ? ` · ${scoreOf(shownCards)}` : "",
										" · ",
										t("betOf", { n: fmt(hand.bet) })
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-3 flex flex-wrap gap-2",
									children: shownCards.map((card, cardIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayingCard, {
										card,
										enter: true
									}, `${card.r}${card.s}${cardIndex}`))
								})]
							}, index);
						})
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
			phase === "bet" || phase === "done" && !busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-2 font-mono text-xs tracking-wide text-term-muted uppercase",
					children: t("bjAdd", { n: fmt(wager) })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DenomPicker, {
					value: denom,
					onChange: (value) => {
						setDenom(value);
						setWager((prev) => Math.min(prev + value, Math.max(value, chips)));
						playCue("chip");
					},
					denoms: DENOMS,
					disabled: busy
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoldButton, {
						disabled: busy || wager < 10 || chips < wager,
						onClick: () => onDeal(wager),
						children: t("bjDeal", { n: fmt(wager) })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GhostButton, {
						disabled: busy,
						onClick: () => {
							setWager(0);
						},
						children: t("bjClear")
					})]
				})]
			}) : null,
			phase === "insurance" && !busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-wrap gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoldButton, {
					disabled: busy || chips < insuranceCost(table),
					onClick: () => insure(true),
					children: t("bjInsure", { n: fmt(insuranceCost(table)) })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GhostButton, {
					disabled: busy,
					onClick: () => insure(false),
					children: t("bjDecline")
				})]
			}) : null,
			phase === "player" && active && !busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoldButton, {
						disabled: !canHit(table),
						onClick: () => act("hit"),
						children: t("bjHit")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GhostButton, {
						disabled: !canStand(table),
						onClick: () => act("stand"),
						children: t("bjStand")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GhostButton, {
						disabled: !canDouble(table) || chips < active.bet,
						onClick: () => act("double"),
						children: t("bjDouble")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GhostButton, {
						disabled: !canSplit(table) || chips < active.bet,
						onClick: () => act("split"),
						children: t("bjSplit")
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 font-mono text-xs text-term-muted",
				children: t("bjKeys")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrokeRack, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RuleNote, {
				title: "House rules",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t("bjRules1") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t("bjRules2") })]
			})
		]
	});
}
function BlackjackPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HouseShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BlackjackGame, {}) });
}
//#endregion
export { BlackjackPage as component };
