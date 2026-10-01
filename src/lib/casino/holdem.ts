import { makeDeck, pokerRank, type Card } from "./cards";
import { randInt, shuffle } from "./rng";

export const SB = 10;
export const BB = 20;
export const SEATS = 6;

export type Street = "preflop" | "flop" | "turn" | "river";
export type HandKey =
  | "royal"
  | "straightFlush"
  | "quads"
  | "fullHouse"
  | "flush"
  | "straight"
  | "trips"
  | "twoPair"
  | "pair"
  | "highCard";

export interface HandRank {
  key: HandKey;
  score: number[];
}

export type PlayerAct = { type: "fold" } | { type: "check" } | { type: "call" } | { type: "bet"; to: number };

export interface Table {
  button: number;
  street: Street;
  deck: Card[];
  board: Card[];
  pot: number;
  stacks: number[];
  streetBet: number[];
  committed: number[];
  hole: Card[][];
  folded: boolean[];
  inHand: boolean[];
  acted: boolean[];
  mayRaise: boolean[];
  minRaise: number;
  sb: number;
  bb: number;
  sbSeat: number;
  bbSeat: number;
  toAct: number | null;
  status: "act" | "reveal" | "done";
  winner: number | "split" | null;
  byFold: boolean;
  hands: (HandRank | null)[];
  youHand: HandRank | null;
  railHand: HandRank | null;
  startYou: number;
  startRail: number;
  startStacks: number[];
}

export interface Options {
  fold: boolean;
  check: boolean;
  call: number;
  minTo: number | null;
  maxTo: number | null;
}

export interface Holding {
  key: HandKey;
  ranks: number[];
  suited: boolean;
}

function zeros(n = SEATS): boolean[] {
  return Array.from({ length: n }, () => false);
}

function nums(n = SEATS, value = 0): number[] {
  return Array.from({ length: n }, () => value);
}

function straightHigh(ranks: readonly number[]): number | null {
  const unique = [...new Set(ranks)].sort((a, b) => a - b);
  if (unique.length < 5) return null;
  if (unique.length === 5 && unique[4]! - unique[0]! === 4) return unique[4]!;
  if (unique.join(",") === "2,3,4,5,14") return 5;
  return null;
}

function fiveScore(cards: readonly Card[]): HandRank {
  const ranks = cards.map((card) => pokerRank(card.r)).sort((a, b) => b - a);
  const flush = cards.every((card) => card.s === cards[0]!.s);
  const counts = new Map<number, number>();
  for (const rank of ranks) counts.set(rank, (counts.get(rank) ?? 0) + 1);
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const high = straightHigh(ranks);
  if (flush && high != null) return { key: high === 14 ? "royal" : "straightFlush", score: [8, high] };
  const top = groups[0]!;
  if (top[1] === 4) {
    const kicker = groups.find((group) => group[1] === 1)?.[0] ?? 0;
    return { key: "quads", score: [7, top[0], kicker] };
  }
  if (top[1] === 3 && groups[1]?.[1] === 2) return { key: "fullHouse", score: [6, top[0], groups[1]![0]] };
  if (flush) return { key: "flush", score: [5, ...ranks] };
  if (high != null) return { key: "straight", score: [4, high] };
  if (top[1] === 3) {
    const kicks = groups.filter((group) => group[1] === 1).map((group) => group[0]);
    return { key: "trips", score: [3, top[0], ...kicks] };
  }
  if (top[1] === 2 && groups[1]?.[1] === 2) {
    const pairs = groups
      .filter((group) => group[1] === 2)
      .map((group) => group[0])
      .sort((a, b) => b - a);
    const kicker = groups.find((group) => group[1] === 1)?.[0] ?? 0;
    return { key: "twoPair", score: [2, pairs[0]!, pairs[1]!, kicker] };
  }
  if (top[1] === 2) {
    const kicks = groups
      .filter((group) => group[1] === 1)
      .map((group) => group[0])
      .sort((a, b) => b - a);
    return { key: "pair", score: [1, top[0], ...kicks] };
  }
  return { key: "highCard", score: [0, ...ranks] };
}

export function compareHands(a: HandRank, b: HandRank): number {
  const length = Math.max(a.score.length, b.score.length);
  for (let i = 0; i < length; i++) {
    const delta = (a.score[i] ?? 0) - (b.score[i] ?? 0);
    if (delta) return delta > 0 ? 1 : -1;
  }
  return 0;
}

function choose5(cards: readonly Card[], start: number, picked: Card[], best: HandRank | null): HandRank | null {
  if (picked.length === 5) {
    const rank = fiveScore(picked);
    if (!best || compareHands(rank, best) > 0) return rank;
    return best;
  }
  const need = 5 - picked.length;
  for (let i = start; i <= cards.length - need; i++) {
    picked.push(cards[i]!);
    best = choose5(cards, i + 1, picked, best);
    picked.pop();
  }
  return best;
}

export function bestHand(cards: readonly Card[]): HandRank {
  if (cards.length < 5) return { key: "highCard", score: [0] };
  if (cards.length === 5) return fiveScore(cards);
  return choose5(cards, 0, [], null) ?? fiveScore(cards.slice(0, 5));
}

export function holdingOf(hole: readonly Card[], board: readonly Card[]): Holding | null {
  if (hole.length < 2) return null;
  if (board.length < 3) {
    const a = pokerRank(hole[0]!.r);
    const b = pokerRank(hole[1]!.r);
    if (a === b) return { key: "pair", ranks: [a], suited: false };
    const hi = Math.max(a, b);
    const lo = Math.min(a, b);
    return { key: "highCard", ranks: [hi, lo], suited: hole[0]!.s === hole[1]!.s };
  }
  const rank = bestHand([...hole, ...board]);
  if (rank.key === "twoPair" || rank.key === "fullHouse") return { key: rank.key, ranks: [rank.score[1] ?? 0, rank.score[2] ?? 0], suited: false };
  return { key: rank.key, ranks: [rank.score[1] ?? 0], suited: false };
}

function live(table: Table): number[] {
  const seats: number[] = [];
  table.inHand.forEach((playing, seat) => {
    if (playing && !table.folded[seat]) seats.push(seat);
  });
  return seats;
}

function maxBet(table: Table): number {
  return Math.max(0, ...table.streetBet);
}

function roundComplete(table: Table): boolean {
  const seats = live(table);
  if (seats.length <= 1) return true;
  const highest = maxBet(table);
  return seats.every((seat) => table.stacks[seat] === 0 || (table.acted[seat] && table.streetBet[seat] === highest));
}

function pendingActor(table: Table, prefer: number): number | null {
  const highest = maxBet(table);
  for (let step = 0; step < SEATS; step++) {
    const seat = (prefer + step) % SEATS;
    if (!table.inHand[seat] || table.folded[seat] || table.stacks[seat] === 0) continue;
    if (!table.acted[seat] || table.streetBet[seat] < highest) return seat;
  }
  return null;
}

function returnUncalled(table: Table): Table {
  const seats = live(table);
  if (seats.length < 2) return table;
  const ranked = seats.map((seat) => table.streetBet[seat]).sort((a, b) => b - a);
  const cap = ranked[1] ?? 0;
  const stacks = table.stacks.slice();
  const committed = table.committed.slice();
  const streetBet = table.streetBet.slice();
  let pot = table.pot;
  for (const seat of seats) {
    if (streetBet[seat]! <= cap) continue;
    const extra = streetBet[seat]! - cap;
    stacks[seat] = (stacks[seat] ?? 0) + extra;
    committed[seat] = (committed[seat] ?? 0) - extra;
    streetBet[seat] = cap;
    pot -= extra;
  }
  return { ...table, stacks, committed, streetBet, pot };
}

function givePot(table: Table, winner: number): Table {
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
    railHand: null,
  };
}

function clockwise(button: number, seats: readonly number[]): number[] {
  const wanted = new Set(seats);
  const order: number[] = [];
  for (let step = 1; step <= SEATS; step++) {
    const seat = (button + step) % SEATS;
    if (wanted.has(seat)) order.push(seat);
  }
  return order;
}

function bestTied(table: Table, eligible: readonly number[]): number[] {
  let best: HandRank | null = null;
  let tied: number[] = [];
  for (const seat of eligible) {
    const rank = bestHand([...table.hole[seat]!, ...table.board]);
    if (!best || compareHands(rank, best) > 0) {
      best = rank;
      tied = [seat];
    } else if (compareHands(rank, best) === 0) tied.push(seat);
  }
  return tied;
}

function showdown(table: Table): Table {
  const hands = table.hole.map((hole, seat) =>
    table.inHand[seat] && !table.folded[seat] ? bestHand([...hole, ...table.board]) : null,
  );
  const contrib = table.committed.slice();
  const stacks = table.stacks.slice();
  const levels = [...new Set(contrib.filter((amount) => amount > 0))].sort((a, b) => a - b);
  let prev = 0;
  let mainSize = 0;
  let mainWinners: number[] = [];
  for (const level of levels) {
    const slice = level - prev;
    const involved: number[] = [];
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
    winner: mainWinners.length === 1 ? (mainWinners[0] ?? null) : "split",
    byFold: false,
    hands,
    youHand: hands[0] ?? null,
    railHand: hands[1] ?? null,
  };
}

function nextLive(table: Table, after: number): number | null {
  for (let step = 1; step <= SEATS; step++) {
    const seat = (after + step) % SEATS;
    if (table.inHand[seat] && !table.folded[seat] && table.stacks[seat]! > 0) return seat;
  }
  return null;
}

function dealAndAct(table: Table): Table {
  const count = table.board.length === 0 ? 3 : 1;
  const board = [...table.board, ...table.deck.slice(1, 1 + count)];
  const street: Street = board.length >= 5 ? "river" : board.length === 4 ? "turn" : "flop";
  const next: Table = {
    ...table,
    deck: table.deck.slice(1 + count),
    board,
    street,
    streetBet: nums(),
    acted: zeros(),
    mayRaise: table.inHand.map(() => true),
  };
  const withChips = live(next).filter((seat) => next.stacks[seat]! > 0);
  if (withChips.length < 2) {
    if (next.board.length >= 5) return showdown(next);
    return { ...next, status: "reveal", toAct: null };
  }
  const actor = nextLive(next, next.button);
  return open(next, actor ?? next.button);
}

function endStreet(table: Table): Table {
  const returned = returnUncalled(table);
  const seats = live(returned);
  if (seats.length <= 1) return givePot(returned, seats[0] ?? 0);
  if (returned.board.length >= 5) return showdown(returned);
  const withChips = seats.filter((seat) => returned.stacks[seat]! > 0);
  if (withChips.length < 2) {
    return { ...returned, streetBet: nums(), acted: zeros(), status: "reveal", toAct: null };
  }
  return dealAndAct(returned);
}

function open(table: Table, prefer: number): Table {
  if (roundComplete(table)) return endStreet(table);
  const actor = pendingActor(table, prefer);
  if (actor == null) return endStreet(table);
  return { ...table, toAct: actor, status: "act" };
}

function post(table: Table, seat: number, amount: number): Table {
  const pay = Math.min(table.stacks[seat] ?? 0, amount);
  const stacks = table.stacks.slice();
  const streetBet = table.streetBet.slice();
  const committed = table.committed.slice();
  stacks[seat] = (stacks[seat] ?? 0) - pay;
  streetBet[seat] = (streetBet[seat] ?? 0) + pay;
  committed[seat] = (committed[seat] ?? 0) + pay;
  return { ...table, stacks, streetBet, committed, pot: table.pot + pay };
}

function nextWithChips(stacks: readonly number[], after: number): number | null {
  for (let step = 1; step <= SEATS; step++) {
    const seat = (after + step) % SEATS;
    if ((stacks[seat] ?? 0) >= 1) return seat;
  }
  return null;
}

export function startHand(args: { you?: number; rail?: number; stacks?: number[]; button: number; deck?: Card[] }): Table | null {
  const stacks = (args.stacks ?? [args.you ?? 0, args.rail ?? 0, 0, 0, 0, 0]).slice(0, SEATS);
  while (stacks.length < SEATS) stacks.push(0);
  const playing = stacks.map((stack) => stack >= 1);
  if (playing.filter(Boolean).length < 2) return null;
  const deck = args.deck ? args.deck.slice() : shuffle(makeDeck());
  const button = ((args.button % SEATS) + SEATS) % SEATS;
  const active = playing
    .map((on, seat) => (on ? seat : -1))
    .filter((seat) => seat >= 0);
  const headsUp = active.length === 2 && playing[button];
  const sbSeat = headsUp ? button : (nextWithChips(stacks, button) ?? button);
  const bbSeat = headsUp ? (active.find((seat) => seat !== button) ?? sbSeat) : (nextWithChips(stacks, sbSeat) ?? sbSeat);
  const hole = Array.from({ length: SEATS }, () => [] as Card[]);
  const order: number[] = [];
  for (let step = 0; step < SEATS; step++) {
    const seat = (sbSeat + step) % SEATS;
    if (playing[seat]) order.push(seat);
  }
  let cursor = 0;
  for (let round = 0; round < 2; round++) {
    for (const seat of order) hole[seat]!.push(deck[cursor++]!);
  }
  let table: Table = {
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
    minRaise: BB,
    sb: SB,
    bb: BB,
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
    startStacks: stacks.slice(),
  };
  table = post(table, sbSeat, SB);
  table = post(table, bbSeat, BB);
  const first = headsUp ? sbSeat : ((bbSeat + 1) % SEATS);
  return open(table, first);
}

export function options(table: Table, seat: number): Options {
  const none: Options = { fold: false, check: false, call: 0, minTo: null, maxTo: null };
  if (table.status !== "act" || table.toAct !== seat) return none;
  const highest = maxBet(table);
  const toCall = Math.max(0, highest - (table.streetBet[seat] ?? 0));
  const maxTo = (table.streetBet[seat] ?? 0) + (table.stacks[seat] ?? 0);
  let minTo: number | null = null;
  if ((table.stacks[seat] ?? 0) > 0 && maxTo > (table.streetBet[seat] ?? 0)) {
    if (highest === 0) minTo = Math.min(maxTo, table.bb);
    else if (table.mayRaise[seat] && maxTo > highest) minTo = Math.min(maxTo, highest + table.minRaise);
  }
  return {
    fold: true,
    check: toCall === 0,
    call: toCall === 0 ? 0 : Math.min(toCall, table.stacks[seat] ?? 0),
    minTo,
    maxTo: minTo == null ? null : maxTo,
  };
}

function commit(table: Table, seat: number, betTo: number): Table {
  const put = betTo - (table.streetBet[seat] ?? 0);
  const stacks = table.stacks.slice();
  const streetBet = table.streetBet.slice();
  const committed = table.committed.slice();
  stacks[seat] = (stacks[seat] ?? 0) - put;
  streetBet[seat] = betTo;
  committed[seat] = (committed[seat] ?? 0) + put;
  return { ...table, stacks, streetBet, committed, pot: table.pot + put };
}

export function act(table: Table, seat: number, action: PlayerAct): Table {
  if (table.status !== "act" || table.toAct !== seat) return table;
  const opt = options(table, seat);
  if (action.type === "fold") {
    if (!opt.fold) return table;
    const folded = table.folded.slice();
    folded[seat] = true;
    const seats = live({ ...table, folded });
    if (seats.length <= 1) return givePot({ ...table, folded }, seats[0] ?? 0);
    const acted = table.acted.slice();
    acted[seat] = true;
    return open({ ...table, folded, acted }, (seat + 1) % SEATS);
  }
  if (action.type === "check") {
    if (!opt.check) return table;
    const acted = table.acted.slice();
    acted[seat] = true;
    return open({ ...table, acted }, (seat + 1) % SEATS);
  }
  if (action.type === "call") {
    if (opt.call <= 0) return table;
    const betTo = Math.min(maxBet(table), (table.streetBet[seat] ?? 0) + (table.stacks[seat] ?? 0));
    const next = commit(table, seat, betTo);
    const acted = next.acted.slice();
    acted[seat] = true;
    return open({ ...next, acted }, (seat + 1) % SEATS);
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
    for (let other = 0; other < SEATS; other++) {
      if (other === seat || next.folded[other] || !next.inHand[other]) continue;
      if ((next.stacks[other] ?? 0) === 0) continue;
      acted[other] = false;
      mayRaise[other] = full || !table.acted[other];
    }
  }
  return open({ ...next, acted, mayRaise, minRaise }, (seat + 1) % SEATS);
}

export function reveal(table: Table): Table {
  if (table.status !== "reveal") return table;
  return dealAndAct(table);
}

function drawBoost(hole: readonly Card[], board: readonly Card[]): number {
  const cards = [...hole, ...board];
  const suits = new Map<string, number>();
  for (const card of cards) suits.set(card.s, (suits.get(card.s) ?? 0) + 1);
  let bonus = 0;
  for (const [suit, count] of suits) {
    if (count === 4 && hole.some((card) => card.s === suit)) bonus += 0.12;
  }
  const ranks = [...new Set(cards.map((card) => pokerRank(card.r)))].sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) {
    let run = 1;
    for (let j = i + 1; j < ranks.length && ranks[j] === ranks[j - 1]! + 1; j++) run += 1;
    if (run >= 4) bonus += 0.08;
  }
  return bonus;
}

function equity(hole: readonly Card[], board: readonly Card[]): number {
  if (board.length < 3) {
    const a = pokerRank(hole[0]!.r);
    const b = pokerRank(hole[1]!.r);
    const hi = Math.max(a, b);
    const lo = Math.min(a, b);
    let score = hi / 22;
    if (a === b) score = 0.48 + hi / 55;
    else {
      if (hole[0]!.s === hole[1]!.s) score += 0.05;
      const gap = hi - lo;
      if (gap === 1) score += 0.04;
      else if (gap >= 5) score -= 0.08;
      if (hi < 11) score -= 0.08;
    }
    return Math.max(0.05, Math.min(0.9, score));
  }
  const cat = bestHand([...hole, ...board]).score[0] ?? 0;
  const base = [0.22, 0.48, 0.7, 0.82, 0.88, 0.91, 0.96, 0.98, 0.99][cat] ?? 0.22;
  return Math.min(0.99, cat >= 4 ? base : base + drawBoost(hole, board));
}

export function botAct(table: Table): PlayerAct {
  if (table.toAct == null) return { type: "check" };
  const seat = table.toAct;
  const opt = options(table, seat);
  const players = live(table).length;
  const tighten = players > 2 ? 0.08 : 0;
  const eq = equity(table.hole[seat] ?? [], table.board) + (randInt(9) - 4) / 100 - tighten;
  const toCall = opt.call;
  const price = toCall === 0 ? 0 : toCall / (table.pot + toCall);
  if (toCall > 0) {
    if (opt.minTo != null && opt.maxTo != null && eq > 0.82 && randInt(100) < 55) {
      return { type: "bet", to: sized(table, eq, opt.minTo, opt.maxTo) };
    }
    if (eq + 0.02 >= price) return { type: "call" };
    if (opt.check) return { type: "check" };
    return { type: "fold" };
  }
  if (opt.minTo != null && opt.maxTo != null && (eq > 0.64 || randInt(100) < 6)) {
    return { type: "bet", to: sized(table, eq, opt.minTo, opt.maxTo) };
  }
  if (opt.check) return { type: "check" };
  if (opt.call > 0) return { type: "call" };
  return { type: "fold" };
}

function sized(table: Table, eq: number, minTo: number, maxTo: number): number {
  const highest = maxBet(table);
  const potTarget = highest + table.pot;
  const halfTarget = highest + Math.floor(table.pot / 2);
  const raw = eq > 0.92 ? maxTo : eq > 0.78 ? potTarget : Math.max(minTo, halfTarget);
  return Math.max(minTo, Math.min(maxTo, raw));
}
