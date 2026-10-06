import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, S as require_jsx_runtime, b as Link, p as useRouterState } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Spade, c as Heart, f as Club, i as Sun, n as Volume2, o as ScrollText, s as Moon, t as VolumeX, u as Diamond } from "../_libs/lucide-react.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shell-WYw15Y_j.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var ctx = null;
var master = null;
var muted = false;
function context() {
	if (typeof window === "undefined") return null;
	const AC = window.AudioContext;
	if (!ctx) {
		ctx = new AC({ latencyHint: "interactive" });
		master = ctx.createGain();
		master.gain.value = muted ? 0 : .22;
		master.connect(ctx.destination);
	}
	return ctx;
}
function unlockAudio() {
	const audio = context();
	if (audio && audio.state === "suspended") audio.resume();
}
function setMuted(next) {
	muted = next;
	const audio = ctx;
	if (!audio || !master) return;
	master.gain.setTargetAtTime(next ? 0 : .22, audio.currentTime, .02);
}
function envGain(when, peak, dur) {
	if (!ctx || !master) return null;
	const g = ctx.createGain();
	g.gain.setValueAtTime(1e-4, when);
	g.gain.exponentialRampToValueAtTime(Math.max(2e-4, peak), when + .012);
	g.gain.exponentialRampToValueAtTime(1e-4, when + dur);
	g.connect(master);
	return g;
}
function tone(freq, dur, type, peak, delay = 0) {
	const audio = context();
	if (!audio || !master || muted || audio.state !== "running") return;
	const when = audio.currentTime + delay;
	const osc = audio.createOscillator();
	const g = envGain(when, peak, dur);
	if (!g) return;
	osc.type = type;
	osc.frequency.setValueAtTime(freq, when);
	osc.connect(g);
	osc.start(when);
	osc.stop(when + dur + .03);
	osc.onended = () => {
		osc.disconnect();
		g.disconnect();
	};
}
function noise(dur, peak, delay = 0) {
	const audio = context();
	if (!audio || !master || muted || audio.state !== "running") return;
	const when = audio.currentTime + delay;
	const len = Math.max(1, Math.floor(audio.sampleRate * dur));
	const buffer = audio.createBuffer(1, len, audio.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
	const src = audio.createBufferSource();
	src.buffer = buffer;
	const filter = audio.createBiquadFilter();
	filter.type = "highpass";
	filter.frequency.value = 900;
	const g = envGain(when, peak, dur);
	if (!g) return;
	src.connect(filter);
	filter.connect(g);
	src.start(when);
	src.onended = () => {
		src.disconnect();
		filter.disconnect();
		g.disconnect();
	};
}
function playCue(cue) {
	if (muted) return;
	const wobble = .94 + Math.random() * .12;
	if (cue === "chip") {
		noise(.04, .12);
		tone(1680 * wobble, .05, "triangle", .08);
	} else if (cue === "card") {
		noise(.05, .1);
		tone(420 * wobble, .06, "sine", .05);
	} else if (cue === "tick") tone(980 * wobble, .03, "square", .03);
	else if (cue === "spin") {
		noise(.18, .08);
		tone(180, .22, "sine", .05);
	} else if (cue === "win") {
		tone(523, .12, "triangle", .1, 0);
		tone(659, .12, "triangle", .1, .09);
		tone(784, .2, "triangle", .11, .18);
	} else if (cue === "lose") {
		tone(196, .18, "sine", .07);
		tone(146, .22, "sine", .05, .08);
	}
}
if (typeof document !== "undefined") document.addEventListener("visibilitychange", () => {
	if (document.visibilityState === "visible") unlockAudio();
});
var KEY$1 = "marlowe.house.v1";
var BUY_IN = 2500;
var blank = () => ({
	version: 1,
	chips: BUY_IN,
	wagered: 0,
	returned: 0,
	peak: BUY_IN,
	hands: 0,
	ledger: [],
	sound: true
});
function clampInt(n, fallback) {
	return typeof n === "number" && Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
}
function readSave() {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(KEY$1);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (parsed.version !== 1) return null;
		const base = blank();
		return {
			version: 1,
			chips: clampInt(parsed.chips, base.chips),
			wagered: clampInt(parsed.wagered, 0),
			returned: clampInt(parsed.returned, 0),
			peak: clampInt(parsed.peak, base.chips),
			hands: clampInt(parsed.hands, 0),
			sound: parsed.sound !== false,
			ledger: Array.isArray(parsed.ledger) ? parsed.ledger.slice(0, 40) : []
		};
	} catch {
		return null;
	}
}
function writeSave(data) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(KEY$1, JSON.stringify(data));
	} catch {}
}
function snapshot(s) {
	return {
		version: 1,
		chips: s.chips,
		wagered: s.wagered,
		returned: s.returned,
		peak: s.peak,
		hands: s.hands,
		ledger: s.ledger,
		sound: s.sound
	};
}
var useHouse = create((set, get) => ({
	...blank(),
	hydrated: false,
	hydrate: () => {
		if (get().hydrated) return;
		const saved = readSave();
		set(saved ? {
			...saved,
			hydrated: true
		} : { hydrated: true });
	},
	canStake: (n) => Number.isInteger(n) && n > 0 && get().chips >= n,
	stake: (n) => {
		if (!get().canStake(n)) return false;
		set({
			chips: get().chips - n,
			wagered: get().wagered + n
		});
		writeSave(snapshot(get()));
		return true;
	},
	pay: (n) => {
		const add = Math.max(0, Math.round(n));
		const chips = get().chips + add;
		set({
			chips,
			returned: get().returned + add,
			peak: Math.max(get().peak, chips)
		});
		writeSave(snapshot(get()));
	},
	refund: (n) => {
		const add = Math.max(0, Math.round(n));
		set({
			chips: get().chips + add,
			wagered: Math.max(0, get().wagered - add)
		});
		writeSave(snapshot(get()));
	},
	record: (row) => {
		set({
			ledger: [{
				...row,
				id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
				at: Date.now()
			}, ...get().ledger].slice(0, 40),
			hands: row.game === "house" ? get().hands : get().hands + 1
		});
		writeSave(snapshot(get()));
	},
	settle: (game, stake, payout, note) => {
		get().pay(payout);
		get().record({
			game,
			stake,
			payout,
			net: payout - stake,
			note
		});
	},
	rebuy: () => {
		const chips = get().chips + BUY_IN;
		set({
			chips,
			peak: Math.max(get().peak, chips)
		});
		get().record({
			game: "house",
			stake: 0,
			payout: BUY_IN,
			net: BUY_IN,
			note: "Buy-in"
		});
		writeSave(snapshot(get()));
	},
	reset: () => {
		const sound = get().sound;
		set({
			...blank(),
			sound,
			hydrated: true
		});
		writeSave(snapshot(get()));
	},
	toggleSound: () => {
		set({ sound: !get().sound });
		writeSave(snapshot(get()));
	}
}));
function formatChips(n, locale = "en") {
	return Math.round(n).toLocaleString(locale === "fi" ? "fi-FI" : "en-US");
}
if (typeof window !== "undefined") window.addEventListener("visibilitychange", () => {
	if (document.visibilityState === "hidden") writeSave(snapshot(useHouse.getState()));
});
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
var KEY = "marlowe.prefs.v1";
function readSaved() {
	if (typeof window === "undefined") return null;
	try {
		const raw = window.localStorage.getItem(KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		const locale = parsed.locale === "fi" ? "fi" : parsed.locale === "en" ? "en" : null;
		const theme = parsed.theme === "light" ? "light" : parsed.theme === "dark" ? "dark" : null;
		if (!locale || !theme) return null;
		return {
			locale,
			theme
		};
	} catch {
		return null;
	}
}
function writeSaved(data) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(KEY, JSON.stringify(data));
	} catch {}
}
function apply(locale, theme) {
	if (typeof document === "undefined") return;
	document.documentElement.lang = locale === "fi" ? "fi" : "en";
	document.documentElement.dataset.theme = theme;
}
var usePrefs = create((set, get) => ({
	locale: "en",
	theme: "dark",
	hydrated: false,
	hydrate: () => {
		if (get().hydrated) return;
		const saved = readSaved();
		const locale = saved?.locale ?? "en";
		const theme = saved?.theme ?? "dark";
		apply(locale, theme);
		set({
			locale,
			theme,
			hydrated: true
		});
	},
	setLocale: (locale) => {
		apply(locale, get().theme);
		set({ locale });
		writeSaved({
			locale,
			theme: get().theme
		});
	},
	setTheme: (theme) => {
		apply(get().locale, theme);
		set({ theme });
		writeSaved({
			locale: get().locale,
			theme
		});
	},
	toggleTheme: () => {
		get().setTheme(get().theme === "dark" ? "light" : "dark");
	}
}));
var en = {
	navSlots: "Fruit",
	navBlackjack: "Blackjack",
	navRoulette: "Roulette",
	navPoker: "Hold'em",
	chips: "Chips",
	mute: "Mute sound",
	unmute: "Play sound",
	openLedger: "Open ledger",
	tables: "Tables",
	ledger: "Ledger",
	evening: "The evening",
	close: "Close",
	bank: "Bank",
	peak: "Peak",
	wagered: "Wagered",
	paidBack: "Paid back",
	net: "Net",
	hands: "Hands",
	buyIn: "Buy in {n}",
	resetEvening: "Reset evening",
	confirmReset: "Confirm reset",
	playMoney: "Chips stay in this browser. Nothing here is real money.",
	noHands: "No hands yet.",
	rackEmpty: "The rack is empty.",
	buyInNote: "Buy-in",
	gameSlots: "Fruit machine",
	gameBlackjack: "Blackjack",
	gameRoulette: "Roulette",
	gamePoker: "Texas Hold'em",
	gameHouse: "House",
	rooms: "Private rooms",
	hero: "Five tables. One bankroll.",
	heroLine: "TiteKassu keeps a house ledger on this device. You start with {n} play chips. The rules are the ones a floor would post, and nothing is staked in real money.",
	roomSlots: "Three reels, a center payline, and holds on the glass.",
	roomBlackjack: "Six-deck blackjack. The dealer stands on every 17. Naturals pay three to two.",
	roomRoulette: "Single zero. The full layout, from splits to six-lines.",
	roomPoker: "Six seats. You, five regulars, and a full betting round.",
	lang: "Language",
	theme: "Theme",
	themeDark: "Dark room",
	themeLight: "Light room",
	you: "You",
	rail: "The rail",
	pot: "Pot",
	blinds: "Blinds {sb}/{bb}",
	deal: "Deal",
	fold: "Fold",
	check: "Check",
	call: "Call {n}",
	bet: "Bet",
	raise: "Raise",
	min: "Min",
	half: "Half",
	allin: "All-in",
	to: "to {n}",
	thinking: "{name} is thinking.",
	yourTurn: "Your action.",
	reveal: "Running it out.",
	foldWin: "Everyone folds. You win {n}.",
	foldLose: "You fold.",
	winShow: "You win {n} with {hand}.",
	loseShow: "{name} wins with {hand}. You lose {n}.",
	splitShow: "Split pot. {hand}.",
	sit: "Post the blinds and take two cards.",
	youFolded: "You fold.",
	foldTaken: "{name} takes the pot. You lose {n}.",
	folded: "Folded",
	betOf: "Bet {n}",
	havePair: "You have a pair of {rank}",
	haveHigh: "You have {rank} high",
	haveSuited: "You have {high}-{low}, suited",
	haveOff: "You have {high}-{low}, offsuit",
	haveTwo: "You have two pair, {a} and {b}",
	haveTrips: "You have three of a kind, {rank}",
	haveStraight: "You have a straight, {rank} high",
	haveFlush: "You have a flush, {rank} high",
	haveFull: "You have a full house, {a} over {b}",
	haveQuads: "You have four of a kind, {rank}",
	haveSf: "You have a straight flush, {rank} high",
	haveRoyal: "You have a royal flush",
	bjIntro: "Six-deck blackjack. The dealer stands on every 17, including soft. A natural pays three to two.",
	bjRules1: "Blackjack pays 3 to 2, rounded to the nearest chip. Split once, same rank only. Split aces take one card and stand. Double any first two cards, including after a split. Insurance is half the original bet and pays 2 to 1.",
	bjRules2: "The dealer peeks on an ace or a ten. The shoe is reshuffled when fewer than 78 cards remain.",
	bjKeys: "Keys: H hit, S stand, D double, P split.",
	bjWait: "Waiting for a wager.",
	bjAdd: "Add chips · wager {n}",
	bjDeal: "Deal {n}",
	bjClear: "Clear bet",
	bjInsure: "Insure {n}",
	bjDecline: "Decline",
	bjHit: "Hit",
	bjStand: "Stand",
	bjDouble: "Double",
	bjSplit: "Split",
	bjDealer: "Dealer",
	bjPlace: "Place a bet.",
	bjAsk: "Insurance?",
	bjYours: "Your hand",
	bjPlays: "Dealer plays",
	bjSoft: "Soft {n}",
	bjBust: "Bust",
	bjLeft: "Left",
	bjRight: "Right",
	railRefill: "A regular sits back down with a fresh stack.",
	needChips: "You need a chip to sit.",
	holeYou: "Your hole cards",
	holeRail: "Rail hole cards",
	board: "Board",
	button: "Button",
	preflop: "Preflop",
	flop: "Flop",
	turn: "Turn",
	river: "River",
	rules: "House rules",
	holdemRules: "Six-handed no-limit. The button deals. Blinds are posted to the left of the button, and action starts left of the big blind. A raise must match the last full raise. On a split, the odd chip goes to the first seat left of the button. The regulars refill when they are felted.",
	keys: "Keys: F fold, C check or call, B bet or min-raise, A all-in.",
	handRoyal: "a royal flush",
	handStraightFlush: "a straight flush",
	handQuads: "four of a kind",
	handFullHouse: "a full house",
	handFlush: "a flush",
	handStraight: "a straight",
	handTrips: "three of a kind",
	handTwoPair: "two pair",
	handPair: "a pair",
	handHighCard: "high card",
	chip: "Chip",
	betSize: "Bet size",
	botAino: "Aino",
	botEero: "Eero",
	botSaima: "Saima",
	botOnni: "Onni",
	botHelmi: "Helmi",
	handHelp: "Best five cards from your two hole cards and the board.",
	toActBadge: "To act",
	bjTotal: "Total {n}",
	bjShoe: "Shoe",
	navSegfault: "Segfault",
	gameSegfault: "Segfault",
	roomSegfault: "Six racks. Rows open as the stack collapses. Bugs blow the neighbors.",
	sfRack: "Rack",
	sfIntro: "Six racks, three rows live. Match a symbol on three racks from the left and the stack collapses, opening the next row. A nop is empty. A bug is a wild that blows its neighbors. Three roots open a root shell.",
	sfIdle: "Three rows are live. A paying collapse opens the next.",
	sfOpen: "{n} rows open",
	sfRun: "Run {n}",
	sfRunning: "Running",
	sfRows: "{n} rows",
	sfWays: "{n} routes",
	sfMult: "Next drop {n}×",
	sfWin: "Stack pays {n}",
	sfBlast: "Bug clears the neighbors. Next drop {n}×",
	sfMine: "A dead row became bugs and cleared the cells above.",
	sfShell: "Root shell · {n}",
	sfShellWin: "Root shell pays {n}",
	sfNone: "No route",
	sfCap: "Capped at {n}",
	sfRules1: "A win is three or more of a kind on consecutive racks from the left. Each route pays. A bug fills the best symbol it can, and that bug serves only one symbol. Every paying collapse opens one row, up to six. Six rows is 46,656 routes.",
	sfRules2: "When a bug detonates on a win, it clears the symbols around it. Roots stay, and the next drop gains +1, up to 5×. A bug on a dead spin still detonates, without raising the multiplier. Four or more of the same symbol in a line that did not pay become bugs and clear the cells above them.",
	sfRules3: "Three or more roots open a root shell: a 6 by 3 board and three respins. Tokens stick. A new token resets the count. A hotfix doubles every token once. One run caps at 400 times the stake.",
	sfPayBit: "💠 Bit · 3 to 6 · 0.25×, 0.60×, 1.40×, 3.20× a route",
	sfPayPing: "📡 Ping · 3 to 6 · 0.30×, 0.80×, 1.80×, 4× a route",
	sfPayHash: "🔶 Hash · 3 to 6 · 0.40×, 1×, 2.20×, 5× a route",
	sfPayLink: "🔗 Link · 3 to 6 · 0.50×, 1.30×, 3×, 6.50× a route",
	sfPayLock: "🔒 Lock · 3 to 6 · 0.70×, 1.80×, 4.20×, 9× a route",
	sfPayChip: "💻 Chip · 3 to 6 · 1×, 2.60×, 6×, 13× a route",
	sfPayRack: "🗄️ Rack · 3 to 6 · 1.50×, 4×, 9×, 20× a route",
	sfPayCore: "💎 Core · 3 to 6 · 2.50×, 6.50×, 16×, 34× a route"
};
var fi = {
	navSlots: "Hedelmät",
	navBlackjack: "Blackjack",
	navRoulette: "Ruletti",
	navPoker: "Hold'em",
	chips: "Merkit",
	mute: "Mykistä",
	unmute: "Äänet päälle",
	openLedger: "Avaa kirjanpito",
	tables: "Pöydät",
	ledger: "Kirjanpito",
	evening: "Ilta",
	close: "Sulje",
	bank: "Kassa",
	peak: "Huippu",
	wagered: "Panostettu",
	paidBack: "Palautettu",
	net: "Tulos",
	hands: "Kädet",
	buyIn: "Lisää {n}",
	resetEvening: "Nollaa ilta",
	confirmReset: "Vahvista nollaus",
	playMoney: "Merkit pysyvät tässä selaimessa. Tässä ei pelata oikealla rahalla.",
	noHands: "Ei käsiä vielä.",
	rackEmpty: "Kassa on tyhjä.",
	buyInNote: "Lisäys",
	gameSlots: "Hedelmäpeli",
	gameBlackjack: "Blackjack",
	gameRoulette: "Ruletti",
	gamePoker: "Texas Hold'em",
	gameHouse: "Talo",
	rooms: "Omat salit",
	hero: "Viisi pöytää. Yksi kassa.",
	heroLine: "TiteKassu pitää kirjanpitoa tällä laitteella. Aloitat {n} pelimerkillä. Säännöt ovat ne, jotka sali julkaisisi, eikä oikeaa rahaa panosteta.",
	roomSlots: "Kolme rullaa, keskilinja ja pidot lasissa.",
	roomBlackjack: "Kuuden pakan blackjack. Jakaja jää jokaiseen 17:ään. Blackjack maksaa 3:2.",
	roomRoulette: "Yksi nolla. Koko kenttä spliteistä kuuden linjoihin.",
	roomPoker: "Kuusi paikkaa. Sinä, viisi vakioasiakasta ja täysi kierros.",
	lang: "Kieli",
	theme: "Teema",
	themeDark: "Tumma sali",
	themeLight: "Vaalea sali",
	you: "Sinä",
	rail: "Vastustaja",
	pot: "Potti",
	blinds: "Blindit {sb}/{bb}",
	deal: "Jaa",
	fold: "Luovuta",
	check: "Sökö",
	call: "Maksa {n}",
	bet: "Panosta",
	raise: "Korota",
	min: "Minimi",
	half: "Puolikas",
	allin: "All-in",
	to: "summaan {n}",
	thinking: "{name} miettii.",
	yourTurn: "Sinun vuorosi.",
	reveal: "Kortit juoksevat.",
	foldWin: "Muut luovuttavat. Voitat {n}.",
	foldLose: "Luovutat.",
	winShow: "Voitat {n}. Käsi: {hand}.",
	loseShow: "{name} voittaa ({hand}). Häviät {n}.",
	splitShow: "Potti jakoon. {hand}.",
	sit: "Maksa blindit ja ota kaksi korttia.",
	youFolded: "Luovutat.",
	foldTaken: "{name} vie potin. Häviät {n}.",
	folded: "Luovuttanut",
	betOf: "Panos {n}",
	havePair: "Sinulla on pari {rank}",
	haveHigh: "Sinulla on {rank} korkein",
	haveSuited: "Sinulla on {high}-{low}, samaa maata",
	haveOff: "Sinulla on {high}-{low}, eri maata",
	haveTwo: "Sinulla on kaksi paria, {a} ja {b}",
	haveTrips: "Sinulla on kolmoset, {rank}",
	haveStraight: "Sinulla on suora, {rank} korkein",
	haveFlush: "Sinulla on väri, {rank} korkein",
	haveFull: "Sinulla on täyskäsi, {a} yli {b}",
	haveQuads: "Sinulla on neloset, {rank}",
	haveSf: "Sinulla on värisuora, {rank} korkein",
	haveRoyal: "Sinulla on kuningasvärisuora",
	bjIntro: "Kuuden pakan blackjack. Jakaja jää jokaiseen 17:ään, myös pehmeään. Blackjack maksaa 3:2.",
	bjRules1: "Blackjack maksaa 3:2, pyöristettynä lähimpään merkkiin. Jako kerran, vain sama arvo. Jaetut ässät saavat yhden kortin ja jäävät. Tuplaus kahdelle ensimmäiselle kortille, myös jaon jälkeen. Vakuutus on puolet alkuperäisestä panoksesta ja maksaa 2:1.",
	bjRules2: "Jakaja kurkkaa ässän tai kympin. Kenkä sekoitetaan uudelleen, kun kortteja on alle 78.",
	bjKeys: "Näppäimet: H lisää, S jää, D tuplaa, P jaa.",
	bjWait: "Odotetaan panosta.",
	bjAdd: "Lisää merkkejä · panos {n}",
	bjDeal: "Jaa {n}",
	bjClear: "Tyhjennä panos",
	bjInsure: "Vakuuta {n}",
	bjDecline: "Ei kiitos",
	bjHit: "Lisää",
	bjStand: "Jää",
	bjDouble: "Tuplaa",
	bjSplit: "Jaa",
	bjDealer: "Jakaja",
	bjPlace: "Aseta panos.",
	bjAsk: "Vakuutus?",
	bjYours: "Sinun kätesi",
	bjPlays: "Jakaja pelaa",
	bjSoft: "Pehmeä {n}",
	bjBust: "Yli",
	bjLeft: "Vasen",
	bjRight: "Oikea",
	railRefill: "Vakioasiakas istuu uudelleen tuoreella pinolla.",
	needChips: "Tarvitset merkin istuaksesi.",
	holeYou: "Taskukorttisi",
	holeRail: "Vastustajan taskukortit",
	board: "Pöytä",
	button: "Nappi",
	preflop: "Preflop",
	flop: "Floppi",
	turn: "Turn",
	river: "River",
	rules: "Säännöt",
	holdemRules: "Kuuden hengen no-limit. Nappi jakaa. Blindit maksetaan napin vasemmalle puolelle, ja toiminta alkaa isoblindin vasemmalta puolelta. Korotuksen on oltava vähintään edellisen täyden korotuksen kokoinen. Tasapelissä ylimääräinen merkki menee ensimmäiselle paikalle napin vasemmalla puolella. Vakioasiakkaat täyttävät pinon, kun se häviää.",
	keys: "Näppäimet: F luovutus, C sökö tai maksu, B panos tai minimikorotus, A all-in.",
	handRoyal: "kuningasvärisuora",
	handStraightFlush: "värisuora",
	handQuads: "neloset",
	handFullHouse: "täyskäsi",
	handFlush: "väri",
	handStraight: "suora",
	handTrips: "kolmoset",
	handTwoPair: "kaksi paria",
	handPair: "pari",
	handHighCard: "korkein kortti",
	chip: "Merkki",
	betSize: "Panos",
	botAino: "Aino",
	botEero: "Eero",
	botSaima: "Saima",
	botOnni: "Onni",
	botHelmi: "Helmi",
	handHelp: "Parhaat viisi korttia kahdesta taskukortistasi ja pöydältä.",
	toActBadge: "Vuorossa",
	bjTotal: "Yhteensä {n}",
	bjShoe: "Kenkä",
	navSegfault: "Segfault",
	gameSegfault: "Segfault",
	roomSegfault: "Kuusi telinettä. Rivit aukeavat, kun pino romahtaa. Bugit räjäyttävät naapurit.",
	sfRack: "Teline",
	sfIntro: "Kuusi telinettä, kolme riviä auki. Sama symboli kolmella telineellä vasemmalta romauttaa pinon ja avaa seuraavan rivin. Nop on tyhjä. Bugi on wild, joka räjäyttää naapurit. Kolme rootia avaa root-shellin.",
	sfIdle: "Kolme riviä on auki. Maksava romahdus avaa seuraavan.",
	sfOpen: "{n} riviä auki",
	sfRun: "Aja {n}",
	sfRunning: "Käynnissä",
	sfRows: "{n} riviä",
	sfWays: "{n} reittiä",
	sfMult: "Seuraava pudotus {n}×",
	sfWin: "Pino maksaa {n}",
	sfBlast: "Bugi tyhjentää naapurit. Seuraava pudotus {n}×",
	sfMine: "Jumissa ollut rivi muuttui bugeiksi ja tyhjensi yläpuolen.",
	sfShell: "Root shell · {n}",
	sfShellWin: "Root shell maksaa {n}",
	sfNone: "Ei reittiä",
	sfCap: "Katto {n}",
	sfRules1: "Voitto on kolme tai useampi sama symboli vierekkäisillä telineillä vasemmalta. Jokainen reitti maksaa. Bugi täyttää parhaan symbolin, ja yksi bugi palvelee vain yhtä symbolia. Jokainen maksava romahdus avaa yhden rivin, enintään kuusi. Kuudella rivillä reittejä on 46 656.",
	sfRules2: "Kun bugi räjähtää osumassa, se tyhjentää viereiset symbolit. Rootit jäävät, ja seuraava pudotus saa +1, enintään 5×. Tyhjällä kierroksella bugi räjähtää, mutta kerroin ei nouse. Neljä tai useampi sama symboli vaakaan ilman voittoa muuttuu bugeiksi ja tyhjentää niiden yläpuolen.",
	sfRules3: "Kolme tai useampi root avaa root-shellin: 6×3 ja kolme uudelleenpyöräytystä. Tokenit jäävät. Uusi token nollaa laskurin. Hotfix tuplaa tokenit kerran. Yhden ajon katto on 400× panos.",
	sfPayBit: "💠 Bit · 3–6 · 0,25×, 0,60×, 1,40×, 3,20× per reitti",
	sfPayPing: "📡 Ping · 3–6 · 0,30×, 0,80×, 1,80×, 4× per reitti",
	sfPayHash: "🔶 Hash · 3–6 · 0,40×, 1×, 2,20×, 5× per reitti",
	sfPayLink: "🔗 Link · 3–6 · 0,50×, 1,30×, 3×, 6,50× per reitti",
	sfPayLock: "🔒 Lock · 3–6 · 0,70×, 1,80×, 4,20×, 9× per reitti",
	sfPayChip: "💻 Chip · 3–6 · 1×, 2,60×, 6×, 13× per reitti",
	sfPayRack: "🗄️ Rack · 3–6 · 1,50×, 4×, 9×, 20× per reitti",
	sfPayCore: "💎 Core · 3–6 · 2,50×, 6,50×, 16×, 34× per reitti"
};
var phrases = [
	["Dealer busts. You win", "Jakaja menee yli. Voitat"],
	["You lose to a blackjack", "Häviät blackjackille"],
	["Left loses to a blackjack", "Vasen häviää blackjackille"],
	["You bust", "Menet yli"],
	["You win", "Voitat"],
	["You lose", "Häviät"],
	["Right loses to a blackjack", "Oikea häviää blackjackille"],
	["Loses to a blackjack", "Häviää blackjackille"],
	["Cherry on the first reel", "Kirsikka ensimmäisessä rullassa"],
	["Those two don't share an edge.", "Nuo kaksi eivät jaa sivua."],
	["Tap a number for a straight-up bet.", "Napauta numeroa suoralle panokselle."],
	["Tap the first number of a split.", "Napauta splitin ensimmäinen numero."],
	["Tap any number to bet its street of three.", "Napauta numeroa, niin panostat sen kolmen kadun."],
	["Tap a number, then choose the corner.", "Napauta numeroa ja valitse kulma."],
	["Tap a number, then choose the six-line.", "Napauta numeroa ja valitse kuuden linja."],
	["Now a neighbor of ", "Nyt naapuri numerolle "],
	["Six decks. The dealer stands on every 17, including soft. A natural pays three to two.", "Kuusi pakkaa. Jakaja jää jokaiseen 17:ään, myös pehmeään. Blackjack maksaa 3:2."],
	["Three reels, one line through the middle. Hold a reel and it stays for one spin only.", "Kolme rullaa, yksi linja keskellä. Pidä rulla, niin se jää vain yhteen pyöräytykseen."],
	["European wheel, thirty-seven pockets. Even-money bets lose on zero.", "Eurooppalainen pyörä, 37 taskua. Tasapanokset häviävät nollalle."],
	["Blackjack pays 3 to 2, rounded to the nearest chip. Split once, same rank only. Split aces take one card and stand. Double any first two cards, including after a split. Insurance is half the original bet and pays 2 to 1.", "Blackjack maksaa 3:2, pyöristettynä lähimpään merkkiin. Jako kerran, vain sama arvo. Jaetut ässät saavat yhden kortin ja jäävät. Tuplaus kahdelle ensimmäiselle kortille, myös jaon jälkeen. Vakuutus on puolet alkuperäisestä panoksesta ja maksaa 2:1."],
	["The dealer peeks on an ace or a ten. The shoe is reshuffled when fewer than 78 cards remain.", "Jakaja kurkkaa ässän tai kympin. Kenkä sekoitetaan uudelleen, kun kortteja on alle 78."],
	["Only the center symbol of each reel counts. A hold lasts one spin, then every reel is free again.", "Vain kunkin rullan keskimmäinen merkki lasketaan. Pito kestää yhden pyöräytyksen, sitten rullat vapautuvat."],
	["10 spins", "10 pyöräytystä"],
	["25 spins", "25 pyöräytystä"],
	["50 spins", "50 pyöräytystä"],
	["Stop auto", "Pysäytä auto"],
	["Straight 35 to 1. Split 17 to 1. Street 11 to 1. Corner 8 to 1. Six-line 5 to 1. Dozens and columns 2 to 1. Red, black, odd, even, and halves pay 1 to 1, and lose if the ball finds zero.", "Suora 35:1. Split 17:1. Street 11:1. Kulma 8:1. Kuuden linja 5:1. Tusinat ja kolumnit 2:1. Punainen, musta, pariton, parillinen ja puolikkaat maksavat 1:1 ja häviävät, jos pallo löytää nollan."],
	["Column 1 is 1, 4, 7… Column 2 is 2, 5, 8… Column 3 is 3, 6, 9…", "Kolumni 1 on 1, 4, 7… Kolumni 2 on 2, 5, 8… Kolumni 3 on 3, 6, 9…"],
	["Keys: H hit, S stand, D double, P split.", "Näppäimet: H lisää, S jää, D tuplaa, P jaa."],
	["Add chips · wager ", "Lisää merkkejä · panos "],
	["Center line pays.", "Keskilinja maksaa."],
	["Lay chips, then spin.", "Aseta merkit ja pyöräytä."],
	["No more bets", "Ei enempää panoksia"],
	["Place a bet.", "Aseta panos."],
	["Waiting for a wager.", "Odotetaan panosta."],
	["Dealer plays", "Jakaja pelaa"],
	["Dealing", "Jaetaan"],
	["Your hand", "Sinun kätesi"],
	["Insurance?", "Vakuutus?"],
	["Clear bet", "Tyhjennä panos"],
	["House rules", "Säännöt"],
	["Paytable", "Voittotaulu"],
	["Payouts", "Maksut"],
	["Insurance pays", "Vakuutus voittaa"],
	["Insurance loses", "Vakuutus häviää"],
	["Dealer busts", "Jakaja menee yli"],
	["Three sevens", "Kolme seiskaa"],
	["Three bars", "Kolme BARia"],
	["Three bells", "Kolme kelloa"],
	["Three plums", "Kolme luumua"],
	["Three oranges", "Kolme appelsiinia"],
	["Three lemons", "Kolme sitruunaa"],
	["Three cherries", "Kolme kirsikkaa"],
	["Two cherries", "Kaksi kirsikkaa"],
	["1st dozen", "1. tusina"],
	["2nd dozen", "2. tusina"],
	["3rd dozen", "3. tusina"],
	["1st 12", "1. 12"],
	["2nd 12", "2. 12"],
	["3rd 12", "3. 12"],
	["Column 1", "Kolumni 1"],
	["Column 2", "Kolumni 2"],
	["Column 3", "Kolumni 3"],
	["stake back", "panos takaisin"],
	["No line", "Ei linjaa"],
	["Left blackjack", "Vasen blackjack"],
	["Right blackjack", "Oikea blackjack"],
	["Left wins", "Vasen voittaa"],
	["Right wins", "Oikea voittaa"],
	["Left loses", "Vasen häviää"],
	["Right loses", "Oikea häviää"],
	["Left bust", "Vasen yli"],
	["Right bust", "Oikea yli"],
	["Left push", "Vasen tasapeli"],
	["Right push", "Oikea tasapeli"],
	["Buy-in", "Lisäys"],
	["Roulette wheel", "Rulettipyörä"],
	["Landed on ", "Pallo numerossa "],
	["Recent numbers", "Viime numerot"],
	["Inside bet", "Sisäpanos"],
	["Soft ", "Pehmeä "],
	["Straight ", "Suora "],
	["Street ", "Street "],
	["Corner ", "Kulma "],
	["Column ", "Kolumni "],
	["Split ", "Split "],
	["Line ", "Linja "],
	["Blackjack", "Blackjack"],
	["Roulette", "Ruletti"],
	["Line", "Linja"],
	["Spinning", "Pyörii"],
	["Decline", "Ei kiitos"],
	["Double", "Tuplaa"],
	["Split", "Jaa"],
	["Stand", "Jää"],
	["Clear", "Tyhjennä"],
	["Remove", "Poista"],
	["Cancel", "Peru"],
	["Dealer", "Jakaja"],
	["Insure ", "Vakuuta "],
	["Deal ", "Jaa "],
	["Spin ", "Pyöräytä "],
	["Hold", "Pidä"],
	["Held", "Pidossa"],
	["Chip", "Merkki"],
	["Bet size", "Panoksen koko"],
	["Bet", "Panos"],
	["Wins", "Voitto"],
	["Loses", "Häviö"],
	["Bust", "Yli"],
	["Push", "Tasapeli"],
	["Cherry", "Kirsikka"],
	["Seven", "Seiska"],
	["Lemon", "Sitruuna"],
	["Orange", "Appelsiini"],
	["Plum", "Luumu"],
	["Bell", "Kello"],
	["Bar", "BAR"],
	[" · house", " · talo"],
	[" green", " vihreä"],
	[" black", " musta"],
	[" red", " punainen"],
	["Black", "Musta"],
	["Even", "Parillinen"],
	["Left", "Vasen"],
	["Right", "Oikea"],
	["You", "Sinä"],
	["Red", "Punainen"],
	["Odd", "Pariton"],
	["Hit", "Lisää"],
	["straight", "suora"],
	["split", "split"],
	["street", "street"],
	["corner", "kulma"],
	["Lamp", "Lamppu"],
	["Shoe", "Kenkä"],
	["Wheel", "Pyörä"],
	["Draw", "Veto"],
	["Fruit machine", "Hedelmäpeli"],
	["Vingt-et-un", "Blackjack"],
	["Jacks or better", "Jacks or better"]
];
phrases.sort((a, b) => b[0].length - a[0].length);
function localize(locale, text) {
	if (locale !== "fi" || !text) return text;
	let out = text;
	for (const [from, to] of phrases) {
		const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		out = out.replace(new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, "gu"), to);
	}
	return out;
}
function rankWord(locale, rank, plural) {
	const pair = (locale === "fi" ? {
		14: ["ässä", "ässiä"],
		13: ["kuningas", "kuninkaita"],
		12: ["rouva", "rouvia"],
		11: ["jätkä", "jätkiä"],
		10: ["kymppi", "kymppejä"],
		9: ["ysi", "ysejä"],
		8: ["kasi", "kaseja"],
		7: ["seiska", "seiskoja"],
		6: ["kutonen", "kutosia"],
		5: ["vitonen", "vitosia"],
		4: ["nelonen", "nelosia"],
		3: ["kolmonen", "kolmosia"],
		2: ["kakkonen", "kakkosia"]
	} : {
		14: ["ace", "aces"],
		13: ["king", "kings"],
		12: ["queen", "queens"],
		11: ["jack", "jacks"],
		10: ["ten", "tens"],
		9: ["nine", "nines"],
		8: ["eight", "eights"],
		7: ["seven", "sevens"],
		6: ["six", "sixes"],
		5: ["five", "fives"],
		4: ["four", "fours"],
		3: ["three", "threes"],
		2: ["two", "twos"]
	})[rank] ?? ["?", "?"];
	return plural ? pair[1] : pair[0];
}
function fill(template, vars) {
	if (!vars) return template;
	let out = template;
	for (const [key, value] of Object.entries(vars)) out = out.replaceAll(`{${key}}`, String(value));
	return out;
}
function useI18n() {
	const locale = usePrefs((s) => s.locale);
	return {
		locale,
		setLocale: usePrefs((s) => s.setLocale),
		theme: usePrefs((s) => s.theme),
		toggleTheme: usePrefs((s) => s.toggleTheme),
		t: (0, import_react.useCallback)((key, vars) => fill(locale === "fi" ? fi[key] : en[key], vars), [locale]),
		tx: (0, import_react.useCallback)((text) => localize(locale, text), [locale]),
		fmt: (0, import_react.useCallback)((n) => formatChips(n, locale), [locale])
	};
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
				className: `num inline-flex h-11 min-w-11 items-center justify-center rounded-md border px-2 font-mono text-sm font-medium disabled:opacity-40 ${on ? "border-phosphor bg-phosphor text-phosphor-ink" : "border-term-line bg-term-elev text-term-fg"}`,
				children: denom
			}, denom);
		})
	});
}
function GoldButton({ className = "", children, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		...props,
		type: "button",
		className: `inline-flex min-h-11 items-center justify-center rounded-md bg-phosphor px-5 text-sm font-semibold text-phosphor-ink disabled:opacity-40 ${className}`,
		children
	});
}
function GhostButton({ className = "", cabinet = false, children, ...props }) {
	const tone = cabinet ? "border-term-line bg-term text-term-fg" : "border-term-line bg-term-elev text-term-fg";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		...props,
		type: "button",
		className: `inline-flex min-h-11 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors disabled:opacity-40 ${tone} ${className}`,
		children
	});
}
function RuleNote({ title, children }) {
	const { tx } = useI18n();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
		className: "mt-3 border-t border-term-line pt-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
			className: "min-h-9 cursor-pointer list-none font-mono text-xs tracking-wide text-phosphor uppercase",
			children: tx(title)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 space-y-2 text-sm leading-relaxed text-term-muted",
			children
		})]
	});
}
function ResultLine({ text, tone }) {
	const { tx } = useI18n();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: `flex items-baseline gap-3 rounded-md border border-term-line bg-term-elev px-3 py-2 font-mono text-sm leading-snug ${tone === "win" ? "text-phosphor" : tone === "lose" ? "text-alert" : "text-term-fg"}`,
		"aria-live": "polite",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-term-muted",
			"aria-hidden": true,
			children: ">"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: tx(text) })]
	});
}
function Console({ pid, unit, title, blurb, live = false, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "term-shell",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "term-bar",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `term-led ${live ? "term-led-run" : ""}`,
					"aria-hidden": true
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-mono text-xs text-term-muted",
					children: ["pid ", pid]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "truncate font-mono text-xs text-term-fg",
					children: unit
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-auto font-mono text-xs text-term-muted",
					children: live ? "run" : "ready"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "term-body",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-3xl leading-none text-term-fg",
					children: title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 max-w-prose text-sm leading-snug text-term-muted",
					children: blurb
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3",
					children
				})
			]
		})]
	});
}
var VERSION = "v0.1.5";
var NAV = [
	{
		to: "/slots",
		key: "navSlots"
	},
	{
		to: "/blackjack",
		key: "navBlackjack"
	},
	{
		to: "/roulette",
		key: "navRoulette"
	},
	{
		to: "/poker",
		key: "navPoker"
	},
	{
		to: "/segfault",
		key: "navSegfault"
	}
];
var GAME_KEY = {
	slots: "gameSlots",
	blackjack: "gameBlackjack",
	roulette: "gameRoulette",
	poker: "gamePoker",
	segfault: "gameSegfault",
	house: "gameHouse"
};
function HouseShell({ children, wide = false }) {
	const path = useRouterState({ select: (s) => s.location.pathname });
	const chips = useHouse((s) => s.chips);
	const sound = useHouse((s) => s.sound);
	const hydrated = useHouse((s) => s.hydrated);
	const hydrate = useHouse((s) => s.hydrate);
	const toggleSound = useHouse((s) => s.toggleSound);
	const hydratePrefs = usePrefs((s) => s.hydrate);
	const { t, fmt, locale, setLocale, theme, toggleTheme } = useI18n();
	const [ledger, setLedger] = (0, import_react.useState)(false);
	(0, import_react.useLayoutEffect)(() => {
		hydratePrefs();
	}, [hydratePrefs]);
	(0, import_react.useEffect)(() => {
		hydrate();
	}, [hydrate]);
	(0, import_react.useEffect)(() => {
		setMuted(!sound);
	}, [sound]);
	(0, import_react.useEffect)(() => {
		const unlock = () => unlockAudio();
		window.addEventListener("pointerdown", unlock);
		window.addEventListener("keydown", unlock);
		return () => {
			window.removeEventListener("pointerdown", unlock);
			window.removeEventListener("keydown", unlock);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "border-b border-stroke",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 lg:flex-nowrap",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/",
								className: "font-display text-2xl leading-none tracking-wide text-fg",
								children: "TiteKassu"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs tracking-wide text-muted",
								children: VERSION
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							className: "order-last flex w-full gap-1.5 overflow-x-auto lg:order-none lg:w-auto lg:flex-1",
							"aria-label": t("tables"),
							children: NAV.map((item) => {
								const on = path === item.to;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: item.to,
									className: `inline-flex min-h-9 shrink-0 items-center rounded-full px-3 text-sm ${on ? "bg-accent text-accent-ink" : "border border-stroke text-muted"}`,
									"aria-current": on ? "page" : void 0,
									children: t(item.key)
								}, item.to);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ml-auto flex items-center gap-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "num rounded-full border border-stroke bg-surface px-3 py-1.5 text-sm text-accent",
									"aria-live": "polite",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "sr-only",
										children: [t("chips"), " "]
									}), hydrated ? fmt(chips) : fmt(BUY_IN)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "inline-flex h-9 overflow-hidden rounded-full border border-stroke",
									role: "group",
									"aria-label": t("lang"),
									children: ["fi", "en"].map((code) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-pressed": locale === code,
										className: `min-w-9 px-2.5 text-xs font-semibold tracking-wide ${locale === code ? "bg-accent text-accent-ink" : "text-muted"}`,
										onClick: () => setLocale(code),
										children: code === "fi" ? "FI" : "EN"
									}, code))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "inline-flex size-9 items-center justify-center rounded-full border border-stroke text-fg",
									"aria-pressed": theme === "light",
									"aria-label": theme === "light" ? t("themeDark") : t("themeLight"),
									onClick: toggleTheme,
									children: theme === "light" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "inline-flex size-9 items-center justify-center rounded-full border border-stroke text-fg",
									"aria-pressed": !sound,
									"aria-label": sound ? t("mute") : t("unmute"),
									onClick: () => {
										unlockAudio();
										toggleSound();
										if (!sound) playCue("tick");
									},
									children: sound ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "inline-flex size-9 items-center justify-center rounded-full border border-stroke text-fg",
									"aria-expanded": ledger,
									"aria-label": t("openLedger"),
									onClick: () => setLedger(true),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScrollText, { className: "size-4" })
								})
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: `mx-auto px-4 py-3 ${wide ? "max-w-6xl" : "max-w-3xl"}`,
				children
			}),
			ledger ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ledger, { onClose: () => setLedger(false) }) : null
		]
	});
}
function Ledger({ onClose }) {
	const ledger = useHouse((s) => s.ledger);
	const chips = useHouse((s) => s.chips);
	const wagered = useHouse((s) => s.wagered);
	const returned = useHouse((s) => s.returned);
	const peak = useHouse((s) => s.peak);
	const hands = useHouse((s) => s.hands);
	const reset = useHouse((s) => s.reset);
	const rebuy = useHouse((s) => s.rebuy);
	const { t, tx, fmt } = useI18n();
	const [confirm, setConfirm] = (0, import_react.useState)(false);
	const net = returned - wagered;
	(0, import_react.useEffect)(() => {
		const onKey = (event) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex justify-end bg-ink/80",
		role: "presentation",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			role: "dialog",
			"aria-label": t("ledger"),
			className: "flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-stroke bg-surface px-5 py-5 text-fg",
			onClick: (event) => event.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-[0.18em] text-accent uppercase",
						children: t("ledger")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-4xl leading-none",
						children: t("evening")
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "inline-flex min-h-11 items-center rounded-full border border-stroke px-4 text-sm",
						onClick: onClose,
						children: t("close")
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "mt-6 grid grid-cols-2 gap-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: t("bank"),
							value: fmt(chips)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: t("peak"),
							value: fmt(peak)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: t("wagered"),
							value: fmt(wagered)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: t("paidBack"),
							value: fmt(returned)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: t("net"),
							value: `${net > 0 ? "+" : ""}${fmt(net)}`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
							label: t("hands"),
							value: fmt(hands)
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "min-h-11 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink",
						onClick: () => {
							rebuy();
							playCue("chip");
						},
						children: t("buyIn", { n: fmt(BUY_IN) })
					}), confirm ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "min-h-11 rounded-full border border-crimson px-4 text-sm text-crimson",
						onClick: () => {
							reset();
							setConfirm(false);
						},
						children: t("confirmReset")
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "min-h-11 rounded-full border border-stroke px-4 text-sm text-muted",
						onClick: () => setConfirm(true),
						children: t("resetEvening")
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: t("playMoney")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
					className: "mt-6 space-y-3",
					children: [ledger.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-sm text-muted",
						children: t("noHands")
					}) : null, ledger.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "border-t border-stroke pt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-baseline justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm",
								children: t(GAME_KEY[row.game])
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: `num text-sm ${row.net > 0 ? "text-accent" : row.net < 0 ? "text-crimson" : "text-muted"}`,
								children: [row.net > 0 ? "+" : "", fmt(row.net)]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: tx(row.note)
						})]
					}, row.id))]
				})
			]
		})
	});
}
function Stat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-card border border-stroke px-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-xs tracking-wide text-muted uppercase",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "num mt-1 text-lg",
			children: value
		})]
	});
}
function BrokeRack() {
	const chips = useHouse((s) => s.chips);
	const rebuy = useHouse((s) => s.rebuy);
	const { t, fmt } = useI18n();
	if (chips >= 10) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-term-line bg-term-elev px-4 py-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-term-muted",
			children: t("rackEmpty")
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "min-h-11 rounded-md bg-phosphor px-4 text-sm font-semibold text-phosphor-ink",
			onClick: () => rebuy(),
			children: t("buyIn", { n: fmt(BUY_IN) })
		})]
	});
}
//#endregion
export { useI18n as S, pokerRank as _, GhostButton as a, shuffle as b, LampMark as c, RuleNote as d, freshShoe as f, playCue as g, makeDeck as h, DenomPicker as i, PlayingCard as l, isBlackjack as m, BrokeRack as n, GoldButton as o, handTotal as p, Console as r, HouseShell as s, BUY_IN as t, ResultLine as u, randInt as v, useHouse as x, rankWord as y };
