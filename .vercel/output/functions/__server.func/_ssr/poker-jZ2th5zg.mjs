import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as rankWord, i as playCue, n as BrokeRack, o as useHouse, r as HouseShell, s as useI18n } from "./shell-DE_NL6o6.mjs";
import { a as PlayingCard, d as makeDeck, f as pokerRank, h as useReducedMotion, m as shuffle, n as GhostButton, o as ResultLine, p as randInt, r as GoldButton, s as RuleNote } from "./use-reduced-motion-DNYynpH8.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/poker-jZ2th5zg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function zeros(n = 6) {
	return Array.from({ length: n }, () => false);
}
function nums(n = 6, value = 0) {
	return Array.from({ length: n }, () => value);
}
function straightHigh(ranks) {
	const unique = [...new Set(ranks)].sort((a, b) => a - b);
	if (unique.length < 5) return null;
	if (unique.length === 5 && unique[4] - unique[0] === 4) return unique[4];
	if (unique.join(",") === "2,3,4,5,14") return 5;
	return null;
}
function fiveScore(cards) {
	const ranks = cards.map((card) => pokerRank(card.r)).sort((a, b) => b - a);
	const flush = cards.every((card) => card.s === cards[0].s);
	const counts = /* @__PURE__ */ new Map();
	for (const rank of ranks) counts.set(rank, (counts.get(rank) ?? 0) + 1);
	const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
	const high = straightHigh(ranks);
	if (flush && high != null) return {
		key: high === 14 ? "royal" : "straightFlush",
		score: [8, high]
	};
	const top = groups[0];
	if (top[1] === 4) {
		const kicker = groups.find((group) => group[1] === 1)?.[0] ?? 0;
		return {
			key: "quads",
			score: [
				7,
				top[0],
				kicker
			]
		};
	}
	if (top[1] === 3 && groups[1]?.[1] === 2) return {
		key: "fullHouse",
		score: [
			6,
			top[0],
			groups[1][0]
		]
	};
	if (flush) return {
		key: "flush",
		score: [5, ...ranks]
	};
	if (high != null) return {
		key: "straight",
		score: [4, high]
	};
	if (top[1] === 3) {
		const kicks = groups.filter((group) => group[1] === 1).map((group) => group[0]);
		return {
			key: "trips",
			score: [
				3,
				top[0],
				...kicks
			]
		};
	}
	if (top[1] === 2 && groups[1]?.[1] === 2) {
		const pairs = groups.filter((group) => group[1] === 2).map((group) => group[0]).sort((a, b) => b - a);
		const kicker = groups.find((group) => group[1] === 1)?.[0] ?? 0;
		return {
			key: "twoPair",
			score: [
				2,
				pairs[0],
				pairs[1],
				kicker
			]
		};
	}
	if (top[1] === 2) {
		const kicks = groups.filter((group) => group[1] === 1).map((group) => group[0]).sort((a, b) => b - a);
		return {
			key: "pair",
			score: [
				1,
				top[0],
				...kicks
			]
		};
	}
	return {
		key: "highCard",
		score: [0, ...ranks]
	};
}
function compareHands(a, b) {
	const length = Math.max(a.score.length, b.score.length);
	for (let i = 0; i < length; i++) {
		const delta = (a.score[i] ?? 0) - (b.score[i] ?? 0);
		if (delta) return delta > 0 ? 1 : -1;
	}
	return 0;
}
function choose5(cards, start, picked, best) {
	if (picked.length === 5) {
		const rank = fiveScore(picked);
		if (!best || compareHands(rank, best) > 0) return rank;
		return best;
	}
	const need = 5 - picked.length;
	for (let i = start; i <= cards.length - need; i++) {
		picked.push(cards[i]);
		best = choose5(cards, i + 1, picked, best);
		picked.pop();
	}
	return best;
}
function bestHand(cards) {
	if (cards.length < 5) return {
		key: "highCard",
		score: [0]
	};
	if (cards.length === 5) return fiveScore(cards);
	return choose5(cards, 0, [], null) ?? fiveScore(cards.slice(0, 5));
}
function holdingOf(hole, board) {
	if (hole.length < 2) return null;
	if (board.length < 3) {
		const a = pokerRank(hole[0].r);
		const b = pokerRank(hole[1].r);
		if (a === b) return {
			key: "pair",
			ranks: [a],
			suited: false
		};
		return {
			key: "highCard",
			ranks: [Math.max(a, b), Math.min(a, b)],
			suited: hole[0].s === hole[1].s
		};
	}
	const rank = bestHand([...hole, ...board]);
	if (rank.key === "twoPair" || rank.key === "fullHouse") return {
		key: rank.key,
		ranks: [rank.score[1] ?? 0, rank.score[2] ?? 0],
		suited: false
	};
	return {
		key: rank.key,
		ranks: [rank.score[1] ?? 0],
		suited: false
	};
}
function live(table) {
	const seats = [];
	table.inHand.forEach((playing, seat) => {
		if (playing && !table.folded[seat]) seats.push(seat);
	});
	return seats;
}
function maxBet(table) {
	return Math.max(0, ...table.streetBet);
}
function roundComplete(table) {
	const seats = live(table);
	if (seats.length <= 1) return true;
	const highest = maxBet(table);
	return seats.every((seat) => table.stacks[seat] === 0 || table.acted[seat] && table.streetBet[seat] === highest);
}
function pendingActor(table, prefer) {
	const highest = maxBet(table);
	for (let step = 0; step < 6; step++) {
		const seat = (prefer + step) % 6;
		if (!table.inHand[seat] || table.folded[seat] || table.stacks[seat] === 0) continue;
		if (!table.acted[seat] || table.streetBet[seat] < highest) return seat;
	}
	return null;
}
function returnUncalled(table) {
	const seats = live(table);
	if (seats.length < 2) return table;
	const cap = seats.map((seat) => table.streetBet[seat]).sort((a, b) => b - a)[1] ?? 0;
	const stacks = table.stacks.slice();
	const committed = table.committed.slice();
	const streetBet = table.streetBet.slice();
	let pot = table.pot;
	for (const seat of seats) {
		if (streetBet[seat] <= cap) continue;
		const extra = streetBet[seat] - cap;
		stacks[seat] = (stacks[seat] ?? 0) + extra;
		committed[seat] = (committed[seat] ?? 0) - extra;
		streetBet[seat] = cap;
		pot -= extra;
	}
	return {
		...table,
		stacks,
		committed,
		streetBet,
		pot
	};
}
function givePot(table, winner) {
	const stacks = table.stacks.slice();
	stacks[winner] = (stacks[winner] ?? 0) + table.pot;
	const hands = table.hole.map(() => null);
	return {
		...table,
		stacks,
		pot: 0,
		status: "done",
		toAct: null,
		winner,
		byFold: true,
		hands,
		youHand: null,
		railHand: null
	};
}
function clockwise(button, seats) {
	const wanted = new Set(seats);
	const order = [];
	for (let step = 1; step <= 6; step++) {
		const seat = (button + step) % 6;
		if (wanted.has(seat)) order.push(seat);
	}
	return order;
}
function bestTied(table, eligible) {
	let best = null;
	let tied = [];
	for (const seat of eligible) {
		const rank = bestHand([...table.hole[seat], ...table.board]);
		if (!best || compareHands(rank, best) > 0) {
			best = rank;
			tied = [seat];
		} else if (compareHands(rank, best) === 0) tied.push(seat);
	}
	return tied;
}
function showdown(table) {
	const hands = table.hole.map((hole, seat) => table.inHand[seat] && !table.folded[seat] ? bestHand([...hole, ...table.board]) : null);
	const contrib = table.committed.slice();
	const stacks = table.stacks.slice();
	const levels = [...new Set(contrib.filter((amount) => amount > 0))].sort((a, b) => a - b);
	let prev = 0;
	let mainSize = 0;
	let mainWinners = [];
	for (const level of levels) {
		const slice = level - prev;
		const involved = [];
		contrib.forEach((amount, seat) => {
			if (amount >= level) involved.push(seat);
		});
		const amount = slice * involved.length;
		const eligible = involved.filter((seat) => table.inHand[seat] && !table.folded[seat]);
		if (eligible.length > 0 && amount > 0) {
			const order = clockwise(table.button, bestTied(table, eligible));
			const share = Math.floor(amount / order.length);
			let remainder = amount - share * order.length;
			for (const seat of order) {
				stacks[seat] = (stacks[seat] ?? 0) + share + (remainder > 0 ? 1 : 0);
				if (remainder > 0) remainder -= 1;
			}
			if (amount >= mainSize) {
				mainSize = amount;
				mainWinners = order;
			}
		}
		prev = level;
	}
	return {
		...table,
		stacks,
		pot: 0,
		streetBet: nums(),
		status: "done",
		toAct: null,
		winner: mainWinners.length === 1 ? mainWinners[0] ?? null : "split",
		byFold: false,
		hands,
		youHand: hands[0] ?? null,
		railHand: hands[1] ?? null
	};
}
function nextLive(table, after) {
	for (let step = 1; step <= 6; step++) {
		const seat = (after + step) % 6;
		if (table.inHand[seat] && !table.folded[seat] && table.stacks[seat] > 0) return seat;
	}
	return null;
}
function dealAndAct(table) {
	const count = table.board.length === 0 ? 3 : 1;
	const board = [...table.board, ...table.deck.slice(1, 1 + count)];
	const street = board.length >= 5 ? "river" : board.length === 4 ? "turn" : "flop";
	const next = {
		...table,
		deck: table.deck.slice(1 + count),
		board,
		street,
		streetBet: nums(),
		acted: zeros(),
		mayRaise: table.inHand.map(() => true)
	};
	if (live(next).filter((seat) => next.stacks[seat] > 0).length < 2) {
		if (next.board.length >= 5) return showdown(next);
		return {
			...next,
			status: "reveal",
			toAct: null
		};
	}
	return open(next, nextLive(next, next.button) ?? next.button);
}
function endStreet(table) {
	const returned = returnUncalled(table);
	const seats = live(returned);
	if (seats.length <= 1) return givePot(returned, seats[0] ?? 0);
	if (returned.board.length >= 5) return showdown(returned);
	if (seats.filter((seat) => returned.stacks[seat] > 0).length < 2) return {
		...returned,
		streetBet: nums(),
		acted: zeros(),
		status: "reveal",
		toAct: null
	};
	return dealAndAct(returned);
}
function open(table, prefer) {
	if (roundComplete(table)) return endStreet(table);
	const actor = pendingActor(table, prefer);
	if (actor == null) return endStreet(table);
	return {
		...table,
		toAct: actor,
		status: "act"
	};
}
function post(table, seat, amount) {
	const pay = Math.min(table.stacks[seat] ?? 0, amount);
	const stacks = table.stacks.slice();
	const streetBet = table.streetBet.slice();
	const committed = table.committed.slice();
	stacks[seat] = (stacks[seat] ?? 0) - pay;
	streetBet[seat] = (streetBet[seat] ?? 0) + pay;
	committed[seat] = (committed[seat] ?? 0) + pay;
	return {
		...table,
		stacks,
		streetBet,
		committed,
		pot: table.pot + pay
	};
}
function nextWithChips(stacks, after) {
	for (let step = 1; step <= 6; step++) {
		const seat = (after + step) % 6;
		if ((stacks[seat] ?? 0) >= 1) return seat;
	}
	return null;
}
function startHand(args) {
	const stacks = (args.stacks ?? [
		args.you ?? 0,
		args.rail ?? 0,
		0,
		0,
		0,
		0
	]).slice(0, 6);
	while (stacks.length < 6) stacks.push(0);
	const playing = stacks.map((stack) => stack >= 1);
	if (playing.filter(Boolean).length < 2) return null;
	const deck = args.deck ? args.deck.slice() : shuffle(makeDeck());
	const button = (args.button % 6 + 6) % 6;
	const active = playing.map((on, seat) => on ? seat : -1).filter((seat) => seat >= 0);
	const headsUp = active.length === 2 && playing[button];
	const sbSeat = headsUp ? button : nextWithChips(stacks, button) ?? button;
	const bbSeat = headsUp ? active.find((seat) => seat !== button) ?? sbSeat : nextWithChips(stacks, sbSeat) ?? sbSeat;
	const hole = Array.from({ length: 6 }, () => []);
	const order = [];
	for (let step = 0; step < 6; step++) {
		const seat = (sbSeat + step) % 6;
		if (playing[seat]) order.push(seat);
	}
	let cursor = 0;
	for (let round = 0; round < 2; round++) for (const seat of order) hole[seat].push(deck[cursor++]);
	let table = {
		button,
		street: "preflop",
		deck: deck.slice(cursor),
		board: [],
		pot: 0,
		stacks: stacks.slice(),
		streetBet: nums(),
		committed: nums(),
		hole,
		folded: playing.map((on) => !on),
		inHand: playing,
		acted: zeros(),
		mayRaise: playing.map(() => true),
		minRaise: 20,
		sb: 10,
		bb: 20,
		sbSeat,
		bbSeat,
		toAct: null,
		status: "act",
		winner: null,
		byFold: false,
		hands: hole.map(() => null),
		youHand: null,
		railHand: null,
		startYou: stacks[0] ?? 0,
		startRail: stacks[1] ?? 0,
		startStacks: stacks.slice()
	};
	table = post(table, sbSeat, 10);
	table = post(table, bbSeat, 20);
	const first = headsUp ? sbSeat : (bbSeat + 1) % 6;
	return open(table, first);
}
function options(table, seat) {
	const none = {
		fold: false,
		check: false,
		call: 0,
		minTo: null,
		maxTo: null
	};
	if (table.status !== "act" || table.toAct !== seat) return none;
	const highest = maxBet(table);
	const toCall = Math.max(0, highest - (table.streetBet[seat] ?? 0));
	const maxTo = (table.streetBet[seat] ?? 0) + (table.stacks[seat] ?? 0);
	let minTo = null;
	if ((table.stacks[seat] ?? 0) > 0 && maxTo > (table.streetBet[seat] ?? 0)) {
		if (highest === 0) minTo = Math.min(maxTo, table.bb);
		else if (table.mayRaise[seat] && maxTo > highest) minTo = Math.min(maxTo, highest + table.minRaise);
	}
	return {
		fold: true,
		check: toCall === 0,
		call: toCall === 0 ? 0 : Math.min(toCall, table.stacks[seat] ?? 0),
		minTo,
		maxTo: minTo == null ? null : maxTo
	};
}
function commit(table, seat, betTo) {
	const put = betTo - (table.streetBet[seat] ?? 0);
	const stacks = table.stacks.slice();
	const streetBet = table.streetBet.slice();
	const committed = table.committed.slice();
	stacks[seat] = (stacks[seat] ?? 0) - put;
	streetBet[seat] = betTo;
	committed[seat] = (committed[seat] ?? 0) + put;
	return {
		...table,
		stacks,
		streetBet,
		committed,
		pot: table.pot + put
	};
}
function act(table, seat, action) {
	if (table.status !== "act" || table.toAct !== seat) return table;
	const opt = options(table, seat);
	if (action.type === "fold") {
		if (!opt.fold) return table;
		const folded = table.folded.slice();
		folded[seat] = true;
		const seats = live({
			...table,
			folded
		});
		if (seats.length <= 1) return givePot({
			...table,
			folded
		}, seats[0] ?? 0);
		const acted = table.acted.slice();
		acted[seat] = true;
		return open({
			...table,
			folded,
			acted
		}, (seat + 1) % 6);
	}
	if (action.type === "check") {
		if (!opt.check) return table;
		const acted = table.acted.slice();
		acted[seat] = true;
		return open({
			...table,
			acted
		}, (seat + 1) % 6);
	}
	if (action.type === "call") {
		if (opt.call <= 0) return table;
		const next = commit(table, seat, Math.min(maxBet(table), (table.streetBet[seat] ?? 0) + (table.stacks[seat] ?? 0)));
		const acted = next.acted.slice();
		acted[seat] = true;
		return open({
			...next,
			acted
		}, (seat + 1) % 6);
	}
	if (opt.minTo == null || opt.maxTo == null || action.to < opt.minTo || action.to > opt.maxTo) return table;
	const prevMax = maxBet(table);
	let next = commit(table, seat, action.to);
	const raiseSize = action.to - prevMax;
	const acted = next.acted.slice();
	const mayRaise = next.mayRaise.slice();
	acted[seat] = true;
	let minRaise = next.minRaise;
	if (raiseSize > 0) {
		const full = raiseSize >= table.minRaise;
		if (full) minRaise = raiseSize;
		for (let other = 0; other < 6; other++) {
			if (other === seat || next.folded[other] || !next.inHand[other]) continue;
			if ((next.stacks[other] ?? 0) === 0) continue;
			acted[other] = false;
			mayRaise[other] = full || !table.acted[other];
		}
	}
	return open({
		...next,
		acted,
		mayRaise,
		minRaise
	}, (seat + 1) % 6);
}
function reveal(table) {
	if (table.status !== "reveal") return table;
	return dealAndAct(table);
}
function drawBoost(hole, board) {
	const cards = [...hole, ...board];
	const suits = /* @__PURE__ */ new Map();
	for (const card of cards) suits.set(card.s, (suits.get(card.s) ?? 0) + 1);
	let bonus = 0;
	for (const [suit, count] of suits) if (count === 4 && hole.some((card) => card.s === suit)) bonus += .12;
	const ranks = [...new Set(cards.map((card) => pokerRank(card.r)))].sort((a, b) => a - b);
	for (let i = 0; i < ranks.length; i++) {
		let run = 1;
		for (let j = i + 1; j < ranks.length && ranks[j] === ranks[j - 1] + 1; j++) run += 1;
		if (run >= 4) bonus += .08;
	}
	return bonus;
}
function equity(hole, board) {
	if (board.length < 3) {
		const a = pokerRank(hole[0].r);
		const b = pokerRank(hole[1].r);
		const hi = Math.max(a, b);
		const lo = Math.min(a, b);
		let score = hi / 22;
		if (a === b) score = .48 + hi / 55;
		else {
			if (hole[0].s === hole[1].s) score += .05;
			const gap = hi - lo;
			if (gap === 1) score += .04;
			else if (gap >= 5) score -= .08;
			if (hi < 11) score -= .08;
		}
		return Math.max(.05, Math.min(.9, score));
	}
	const cat = bestHand([...hole, ...board]).score[0] ?? 0;
	const base = [
		.22,
		.48,
		.7,
		.82,
		.88,
		.91,
		.96,
		.98,
		.99
	][cat] ?? .22;
	return Math.min(.99, cat >= 4 ? base : base + drawBoost(hole, board));
}
function botAct(table) {
	if (table.toAct == null) return { type: "check" };
	const seat = table.toAct;
	const opt = options(table, seat);
	const tighten = live(table).length > 2 ? .08 : 0;
	const eq = equity(table.hole[seat] ?? [], table.board) + (randInt(9) - 4) / 100 - tighten;
	const toCall = opt.call;
	const price = toCall === 0 ? 0 : toCall / (table.pot + toCall);
	if (toCall > 0) {
		if (opt.minTo != null && opt.maxTo != null && eq > .82 && randInt(100) < 55) return {
			type: "bet",
			to: sized(table, eq, opt.minTo, opt.maxTo)
		};
		if (eq + .02 >= price) return { type: "call" };
		if (opt.check) return { type: "check" };
		return { type: "fold" };
	}
	if (opt.minTo != null && opt.maxTo != null && (eq > .64 || randInt(100) < 6)) return {
		type: "bet",
		to: sized(table, eq, opt.minTo, opt.maxTo)
	};
	if (opt.check) return { type: "check" };
	if (opt.call > 0) return { type: "call" };
	return { type: "fold" };
}
function sized(table, eq, minTo, maxTo) {
	const highest = maxBet(table);
	const potTarget = highest + table.pot;
	const halfTarget = highest + Math.floor(table.pot / 2);
	return Math.max(minTo, Math.min(maxTo, eq > .92 ? maxTo : eq > .78 ? potTarget : Math.max(minTo, halfTarget)));
}
var RAIL_KEY = "marlowe.holdem.v1";
var RAIL_BUY = 2e3;
var BOT_MS = 2200;
var REVEAL_MS = 1100;
var BOT_KEY = [
	"botAino",
	"botEero",
	"botSaima",
	"botOnni",
	"botHelmi"
];
var HAND_KEY = {
	royal: "handRoyal",
	straightFlush: "handStraightFlush",
	quads: "handQuads",
	fullHouse: "handFullHouse",
	flush: "handFlush",
	straight: "handStraight",
	trips: "handTrips",
	twoPair: "handTwoPair",
	pair: "handPair",
	highCard: "handHighCard"
};
function freshSeat() {
	return {
		bots: Array.from({ length: 5 }, () => RAIL_BUY),
		button: 0
	};
}
function readSeat() {
	if (typeof window === "undefined") return freshSeat();
	try {
		const raw = window.localStorage.getItem(RAIL_KEY);
		if (!raw) return freshSeat();
		const parsed = JSON.parse(raw);
		const button = typeof parsed.button === "number" && parsed.button >= 0 && parsed.button < 6 ? Math.floor(parsed.button) : 0;
		return {
			bots: Array.from({ length: 5 }, (_, index) => {
				const saved = Array.isArray(parsed.bots) ? parsed.bots[index] : index === 0 ? parsed.rail : void 0;
				return typeof saved === "number" && saved >= 1 ? Math.round(saved) : RAIL_BUY;
			}),
			button
		};
	} catch {
		return freshSeat();
	}
}
function writeSeat(seat) {
	try {
		window.localStorage.setItem(RAIL_KEY, JSON.stringify(seat));
	} catch {}
}
function PokerGame() {
	const reduced = useReducedMotion();
	const chips = useHouse((s) => s.chips);
	const { t, fmt, locale } = useI18n();
	const [seat, setSeat] = (0, import_react.useState)(freshSeat);
	const [ready, setReady] = (0, import_react.useState)(false);
	const [hand, setHand] = (0, import_react.useState)(null);
	const [tone, setTone] = (0, import_react.useState)("idle");
	const [sizing, setSizing] = (0, import_react.useState)(false);
	const [refilled, setRefilled] = (0, import_react.useState)(false);
	const handRef = (0, import_react.useRef)(null);
	const invested = (0, import_react.useRef)(0);
	const settled = (0, import_react.useRef)(true);
	(0, import_react.useEffect)(() => {
		setSeat(readSeat());
		setReady(true);
	}, []);
	(0, import_react.useEffect)(() => () => {
		if (settled.current) return;
		useHouse.getState().refund(invested.current);
		invested.current = 0;
		settled.current = true;
	}, []);
	function nameOf(index) {
		if (index <= 0) return t("you");
		return t(BOT_KEY[index - 1] ?? "botAino");
	}
	function outcome(table) {
		const net = table.stacks[0] - table.startYou;
		const yours = table.hands[0] ? t(HAND_KEY[table.hands[0].key]) : "";
		if (table.byFold && table.winner === 0) return t("foldWin", { n: fmt(net) });
		if (table.byFold && table.folded[0]) {
			if (net === 0 || typeof table.winner !== "number") return t("youFolded");
			return t("foldTaken", {
				name: nameOf(table.winner),
				n: fmt(Math.abs(net))
			});
		}
		if (net > 0 && table.winner === 0) return t("winShow", {
			n: fmt(net),
			hand: yours
		});
		if (net >= 0 && table.winner === "split") return t("splitShow", { hand: yours });
		if (net === 0) return t("splitShow", { hand: yours });
		const rivals = (typeof table.winner === "number" ? [table.winner] : winningSeats(table)).filter((index) => index !== 0);
		const who = rivals.map(nameOf).join(", ") || t("rail");
		const shownHand = table.hands[rivals[0] ?? -1];
		return t("loseShow", {
			name: who,
			n: fmt(Math.abs(net)),
			hand: shownHand ? t(HAND_KEY[shownHand.key]) : yours
		});
	}
	function syncStack(prev, next, done) {
		if (next < prev) {
			const delta = prev - next;
			if (!useHouse.getState().stake(delta)) return false;
			invested.current += delta;
			return true;
		}
		if (!done && next > prev) {
			const delta = next - prev;
			useHouse.getState().refund(delta);
			invested.current = Math.max(0, invested.current - delta);
		}
		return true;
	}
	function finish(next) {
		if (settled.current || next.status !== "done") return;
		const award = next.stacks[0] - useHouse.getState().chips;
		if (award > 0) useHouse.getState().pay(award);
		const net = next.stacks[0] - next.startYou;
		const note = outcome(next);
		useHouse.getState().record({
			game: "poker",
			stake: invested.current,
			payout: Math.max(0, invested.current + net),
			net,
			note
		});
		settled.current = true;
		invested.current = 0;
		const saved = {
			bots: next.stacks.slice(1, 6).map((stack) => Math.round(stack)),
			button: (next.button + 1) % 6
		};
		setSeat(saved);
		writeSeat(saved);
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
	}
	function apply(next, prevStack) {
		if (!syncStack(prevStack, next.stacks[0], next.status === "done")) return;
		handRef.current = next;
		setHand(next);
		setSizing(false);
		if (next.status === "done") finish(next);
	}
	function deal() {
		if (hand && hand.status !== "done") return;
		const bank = useHouse.getState().chips;
		if (bank < 1) return;
		let didRefill = false;
		const bots = seat.bots.map((stack) => {
			if (stack >= 1) return stack;
			didRefill = true;
			return RAIL_BUY;
		});
		while (bots.length < 5) {
			bots.push(RAIL_BUY);
			didRefill = true;
		}
		const next = startHand({
			stacks: [bank, ...bots.slice(0, 5)],
			button: seat.button
		});
		if (!next) return;
		settled.current = false;
		invested.current = 0;
		setRefilled(didRefill);
		setTone("idle");
		playCue("card");
		apply(next, bank);
	}
	function playerAct(action) {
		const current = handRef.current;
		if (!current || current.status !== "act" || current.toAct !== 0) return;
		const next = act(current, 0, action);
		if (next === current) return;
		playCue(action.type === "fold" ? "lose" : "chip");
		apply(next, current.stacks[0]);
	}
	(0, import_react.useEffect)(() => {
		const current = hand;
		if (!current || current.status === "done") return;
		const botTurn = current.status === "act" && current.toAct != null && current.toAct !== 0;
		const revealing = current.status === "reveal";
		if (!botTurn && !revealing) return;
		const wait = reduced ? 40 : revealing ? REVEAL_MS : BOT_MS;
		const timer = window.setTimeout(() => {
			const live = handRef.current;
			if (!live || live !== current) return;
			if (live.status === "reveal") {
				apply(reveal(live), live.stacks[0]);
				return;
			}
			if (live.status !== "act" || live.toAct == null || live.toAct === 0) return;
			const seatNow = live.toAct;
			let next = act(live, seatNow, botAct(live));
			if (next === live) {
				const opt = options(live, seatNow);
				next = act(live, seatNow, opt.check ? { type: "check" } : opt.call > 0 ? { type: "call" } : { type: "fold" });
			}
			if (next !== live) apply(next, live.stacks[0]);
		}, wait);
		return () => window.clearTimeout(timer);
	}, [hand, reduced]);
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			const target = event.target;
			if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
			const live = handRef.current;
			const key = event.key.toLowerCase();
			if ((key === "enter" || key === "d") && (!live || live.status === "done")) {
				deal();
				return;
			}
			if (!live || live.toAct !== 0 || live.status !== "act") return;
			const opt = options(live, 0);
			if (key === "f" && opt.fold && !opt.check) playerAct({ type: "fold" });
			else if (key === "c" && opt.check) playerAct({ type: "check" });
			else if (key === "c" && opt.call > 0) playerAct({ type: "call" });
			else if (key === "a" && opt.maxTo != null) playerAct({
				type: "bet",
				to: opt.maxTo
			});
			else if (key === "b" && opt.minTo != null) playerAct({
				type: "bet",
				to: opt.minTo
			});
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});
	const live = hand && hand.status !== "done" ? hand : null;
	const shown = hand;
	const expose = Boolean(shown && !shown.byFold && (shown.status === "reveal" || shown.status === "done"));
	const opt = shown && shown.status === "act" && shown.toAct === 0 ? options(shown, 0) : null;
	const buttonSeat = shown?.button ?? seat.button;
	const targets = opt?.minTo != null && opt.maxTo != null && shown ? uniqueTargets(shown, opt.minTo, opt.maxTo) : [];
	const actor = shown?.toAct;
	const line = shown?.status === "done" ? outcome(shown) : shown?.status === "reveal" ? t("reveal") : actor != null && actor !== 0 ? t("thinking", { name: nameOf(actor) }) : actor === 0 ? t("yourTurn") : t("sit");
	const holding = shown ? describeHolding(shown, t, locale) : "";
	function seatStack(index) {
		if (shown) return fmt(shown.stacks[index] ?? 0);
		if (index === 0) return fmt(chips);
		return fmt(seat.bots[index - 1] ?? RAIL_BUY);
	}
	function renderSeat(index, hero = false) {
		const folded = Boolean(shown?.inHand[index] && shown.folded[index]);
		const acting = shown?.status === "act" && shown.toAct === index;
		const allIn = Boolean(shown && shown.inHand[index] && !shown.folded[index] && shown.stacks[index] === 0 && shown.status !== "done");
		const bet = shown && !folded && !allIn && (shown.streetBet[index] ?? 0) > 0 ? t("betOf", { n: fmt(shown.streetBet[index] ?? 0) }) : "";
		const holes = shown?.hole[index] ?? [];
		const showFaces = holes.length > 0 && (index === 0 || expose && !folded);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SeatSpot, {
			name: nameOf(index),
			stack: seatStack(index),
			button: buttonSeat === index,
			buttonLabel: t("button"),
			acting,
			actingLabel: t("toActBadge"),
			folded,
			foldedLabel: t("folded"),
			bet: allIn ? t("allin") : bet,
			cards: holes,
			showFaces,
			hero,
			cardsLabel: index === 0 ? t("holeYou") : nameOf(index)
		}, index);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs tracking-[0.2em] text-accent uppercase",
			children: t("blinds", {
				sb: 10,
				bb: 20
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-1 font-display text-5xl leading-none",
			children: t("gamePoker")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 max-w-prose text-muted",
			children: t("roomPoker")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "felt-surface mt-6 rounded-card border border-gold-dim px-3 py-4 sm:px-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-3 gap-2",
					children: [
						2,
						3,
						4
					].map((index) => renderSeat(index))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 grid grid-cols-2 gap-2",
					children: [renderSeat(1), renderSeat(5)]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs tracking-[0.16em] text-ivory/70 uppercase",
						children: [
							shown ? t(shown.street) : t("preflop"),
							" · ",
							t("pot"),
							" ",
							fmt(shown?.pot ?? 0)
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex min-h-14 flex-wrap items-center justify-center gap-1.5",
						"aria-label": t("board"),
						children: shown && shown.board.length > 0 ? shown.board.map((card, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayingCard, {
							card,
							small: true
						}, `${card.r}${card.s}${index}`)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-ivory/70",
							children: shown ? t(shown.street) : t("board")
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 border-t border-ivory/15 pt-4",
					children: renderSeat(0, true)
				}),
				holding ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-gold",
						children: holding
					}), shown && !shown.folded[0] ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-ivory/70",
						children: t("handHelp")
					}) : null]
				}) : null
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultLine, {
				text: line,
				tone: shown && shown.status !== "done" ? "idle" : tone
			})
		}),
		refilled && live ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-muted",
			children: t("railRefill")
		}) : null,
		!live ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-5",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoldButton, {
				disabled: !ready || chips < 1,
				onClick: deal,
				children: t("deal")
			})
		}) : null,
		opt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-5 space-y-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-2",
				children: [
					!opt.check ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GhostButton, {
						onClick: () => playerAct({ type: "fold" }),
						children: t("fold")
					}) : null,
					opt.check ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoldButton, {
						onClick: () => playerAct({ type: "check" }),
						children: t("check")
					}) : null,
					opt.call > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoldButton, {
						onClick: () => playerAct({ type: "call" }),
						children: t("call", { n: fmt(opt.call) })
					}) : null,
					opt.minTo != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GhostButton, {
						onClick: () => setSizing((open) => !open),
						children: opt.call > 0 ? t("raise") : t("bet")
					}) : null
				]
			}), sizing && opt.minTo != null && opt.maxTo != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: targets.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(GhostButton, {
					onClick: () => playerAct({
						type: "bet",
						to: item.to
					}),
					children: [
						t(item.id),
						" ",
						fmt(item.to)
					]
				}, item.id))
			}) : null]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-muted",
			children: t("keys")
		}),
		chips < 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm text-muted",
			children: t("needChips")
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BrokeRack, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RuleNote, {
			title: "House rules",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t("holdemRules") })
		})
	] });
}
function winningSeats(table) {
	let best = null;
	let seats = [];
	table.hands.forEach((hand, seat) => {
		if (!hand) return;
		if (!best || compareHands(hand, best) > 0) {
			best = hand;
			seats = [seat];
		} else if (compareHands(hand, best) === 0) seats.push(seat);
	});
	return seats;
}
function describeHolding(table, t, locale) {
	const hole = table.hole[0] ?? [];
	if (hole.length < 2) return "";
	if (table.folded[0]) return t("youFolded");
	const holding = holdingOf(hole, table.board);
	if (!holding) return "";
	const word = (rank, plural = false) => rankWord(locale, rank, plural);
	const high = holding.ranks[0] ?? 0;
	const low = holding.ranks[1] ?? 0;
	switch (holding.key) {
		case "royal": return t("haveRoyal");
		case "straightFlush": return t("haveSf", { rank: word(high) });
		case "quads": return t("haveQuads", { rank: word(high, true) });
		case "fullHouse": return t("haveFull", {
			a: word(high, true),
			b: word(low, true)
		});
		case "flush": return t("haveFlush", { rank: word(high) });
		case "straight": return t("haveStraight", { rank: word(high) });
		case "trips": return t("haveTrips", { rank: word(high, true) });
		case "twoPair": return t("haveTwo", {
			a: word(high, true),
			b: word(low, true)
		});
		case "pair": return t("havePair", { rank: word(high, true) });
		default:
			if (table.board.length < 3 && holding.ranks.length > 1) return holding.suited ? t("haveSuited", {
				high: word(high),
				low: word(low)
			}) : t("haveOff", {
				high: word(high),
				low: word(low)
			});
			return t("haveHigh", { rank: word(high) });
	}
}
function uniqueTargets(table, minTo, maxTo) {
	const highest = Math.max(0, ...table.streetBet);
	const mine = table.streetBet[table.toAct ?? 0] ?? 0;
	const call = Math.max(0, highest - mine);
	const potTo = clamp(highest + call + table.pot, minTo, maxTo);
	const half = clamp(highest + Math.floor((table.pot + call) / 2), minTo, maxTo);
	const items = [
		{
			id: "min",
			to: minTo
		},
		{
			id: "half",
			to: half
		},
		{
			id: "pot",
			to: potTo
		},
		{
			id: "allin",
			to: maxTo
		}
	];
	const seen = /* @__PURE__ */ new Set();
	return items.filter((item) => {
		if (seen.has(item.to)) return false;
		seen.add(item.to);
		return true;
	});
}
function clamp(n, min, max) {
	return Math.max(min, Math.min(max, n));
}
function SeatSpot({ name, stack, button, buttonLabel, acting, actingLabel, folded, foldedLabel, bet, cards, showFaces, hero, cardsLabel }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `min-w-0 rounded-md px-1 py-1 text-center ${acting ? "bg-ink/30 ring-2 ring-gold" : ""}`,
		"aria-current": acting ? "true" : void 0,
		children: [
			cards.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: `relative flex justify-center gap-1 ${folded ? "opacity-45" : ""}`,
				"aria-label": cardsLabel,
				children: cards.map((card, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayingCard, {
					card: showFaces ? card : void 0,
					down: !showFaces,
					small: !hero
				}, `${card.r}${card.s}${index}`))
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: `mt-1 truncate font-display leading-none text-ivory ${hero ? "text-3xl" : "text-xl"}`,
				children: [name, button ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-1 inline-flex size-5 items-center justify-center rounded-full border border-gold bg-gold align-middle text-[10px] font-semibold text-ink",
					title: buttonLabel,
					children: "D"
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "num text-xs text-ivory/80",
				children: stack
			}),
			acting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 inline-flex rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-ink uppercase",
				children: actingLabel
			}) : null,
			folded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 inline-flex rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-ivory uppercase",
				children: foldedLabel
			}) : null,
			bet ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-[11px] tracking-wide text-gold uppercase",
				children: bet
			}) : null
		]
	});
}
function PokerPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HouseShell, {
		wide: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PokerGame, {})
	});
}
//#endregion
export { PokerPage as component };
