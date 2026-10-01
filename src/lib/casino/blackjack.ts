import { freshShoe, handTotal, isBlackjack, type Card } from "./cards";

export interface BjHand {
  cards: Card[];
  bet: number;
  stood: boolean;
  doubled: boolean;
  splitAce: boolean;
  wasSplit: boolean;
}

export interface BjSettlement {
  mainReturn: number;
  insuranceReturn: number;
  note: string;
}

export type BjPhase = "bet" | "insurance" | "player" | "dealer" | "done";

export interface Table {
  shoe: Card[];
  dealer: Card[];
  hands: BjHand[];
  active: number;
  phase: BjPhase;
  baseBet: number;
  insuranceBet: number;
  settlement: BjSettlement | null;
}

export function createTable(): Table {
  return {
    shoe: [],
    dealer: [],
    hands: [],
    active: 0,
    phase: "bet",
    baseBet: 0,
    insuranceBet: 0,
    settlement: null,
  };
}

export function clearHand(table: Table): Table {
  return {
    ...table,
    phase: "bet",
    hands: [],
    dealer: [],
    active: 0,
    baseBet: 0,
    insuranceBet: 0,
    settlement: null,
  };
}

function drawOne(shoe: Card[]): { card: Card; shoe: Card[] } {
  const source = shoe.length === 0 ? freshShoe() : shoe;
  return { card: source[0]!, shoe: source.slice(1) };
}

function replace(hands: BjHand[], index: number, hand: BjHand): BjHand[] {
  return hands.map((h, i) => (i === index ? hand : h));
}

export function dealerShouldHit(cards: readonly Card[]): boolean {
  return handTotal(cards).total < 17;
}

export function canHit(table: Table): boolean {
  if (table.phase !== "player") return false;
  const hand = table.hands[table.active];
  if (!hand || hand.stood || hand.splitAce) return false;
  return handTotal(hand.cards).total < 21;
}

export function canStand(table: Table): boolean {
  return table.phase === "player" && !!table.hands[table.active] && !table.hands[table.active]!.stood;
}

export function canDouble(table: Table): boolean {
  if (table.phase !== "player") return false;
  const hand = table.hands[table.active];
  return !!hand && hand.cards.length === 2 && !hand.splitAce && !hand.stood;
}

export function canSplit(table: Table): boolean {
  if (table.phase !== "player" || table.hands.length !== 1) return false;
  const hand = table.hands[0];
  if (!hand || hand.cards.length !== 2 || hand.wasSplit) return false;
  return hand.cards[0]!.r === hand.cards[1]!.r;
}

function advance(table: Table): Table {
  const hand = table.hands[table.active];
  if (!hand) return playDealer(table);
  if (!hand.stood && handTotal(hand.cards).total < 21) return table;
  const hands = replace(table.hands, table.active, { ...hand, stood: true });
  const nextIndex = hands.findIndex((h, i) => i > table.active && !h.stood);
  if (nextIndex >= 0) return { ...table, hands, active: nextIndex };
  return playDealer({ ...table, hands });
}

function playDealer(table: Table): Table {
  const anyLive = table.hands.some((h) => handTotal(h.cards).total <= 21);
  let shoe = table.shoe;
  let dealer = table.dealer.slice();
  if (anyLive) {
    while (dealerShouldHit(dealer)) {
      const drawn = drawOne(shoe);
      dealer = [...dealer, drawn.card];
      shoe = drawn.shoe;
    }
  }
  return settle({ ...table, shoe, dealer, phase: "done", active: -1 });
}

function settle(table: Table): Table {
  const dealerTotal = handTotal(table.dealer).total;
  const dealerBJ = isBlackjack(table.dealer);
  const dealerBust = dealerTotal > 21;
  let mainReturn = 0;
  const parts: string[] = [];
  table.hands.forEach((hand, index) => {
    const total = handTotal(hand.cards).total;
    const natural = isBlackjack(hand.cards) && !hand.wasSplit;
    const prefix = table.hands.length > 1 ? (index === 0 ? "Left " : "Right ") : "";
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
      mainReturn += hand.bet + Math.round((hand.bet * 3) / 2);
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
    } else {
      parts.push("Insurance loses");
    }
  }
  const note = parts
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" · ");
  return {
    ...table,
    phase: "done",
    active: -1,
    settlement: { mainReturn, insuranceReturn, note: note || "Settled" },
  };
}

export function deal(table: Table, bet: number): Table {
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
  const hand: BjHand = {
    cards: [p1, p2],
    bet,
    stood: false,
    doubled: false,
    splitAce: false,
    wasSplit: false,
  };
  const dealer = [up, hole];
  let phase: BjPhase = "player";
  if (up.r === "A") phase = "insurance";
  else if (isBlackjack(dealer) || isBlackjack([p1, p2])) phase = "done";
  const next: Table = {
    shoe,
    dealer,
    hands: [hand],
    active: 0,
    phase,
    baseBet: bet,
    insuranceBet: 0,
    settlement: null,
  };
  return phase === "done" ? settle(next) : next;
}

export function resolveInsurance(table: Table, take: boolean): Table {
  if (table.phase !== "insurance") return table;
  const next: Table = {
    ...table,
    insuranceBet: take ? Math.floor(table.baseBet / 2) : 0,
    phase: "player",
  };
  if (isBlackjack(next.dealer) || isBlackjack(next.hands[0]!.cards)) return settle(next);
  return next;
}

export function hit(table: Table): Table {
  if (!canHit(table)) return table;
  const drawn = drawOne(table.shoe);
  const hand = table.hands[table.active]!;
  const cards = [...hand.cards, drawn.card];
  const total = handTotal(cards).total;
  const updated: BjHand = { ...hand, cards, stood: total >= 21 };
  return advance({ ...table, shoe: drawn.shoe, hands: replace(table.hands, table.active, updated) });
}

export function stand(table: Table): Table {
  if (!canStand(table)) return table;
  const hand = table.hands[table.active]!;
  return advance({ ...table, hands: replace(table.hands, table.active, { ...hand, stood: true }) });
}

export function doubleDown(table: Table): Table {
  if (!canDouble(table)) return table;
  const drawn = drawOne(table.shoe);
  const hand = table.hands[table.active]!;
  const cards = [...hand.cards, drawn.card];
  const updated: BjHand = { ...hand, cards, bet: hand.bet * 2, doubled: true, stood: true };
  return advance({ ...table, shoe: drawn.shoe, hands: replace(table.hands, table.active, updated) });
}

export function splitHand(table: Table): Table {
  if (!canSplit(table)) return table;
  const hand = table.hands[0]!;
  const leftDraw = drawOne(table.shoe);
  const rightDraw = drawOne(leftDraw.shoe);
  const ace = hand.cards[0]!.r === "A";
  const leftTotal = handTotal([hand.cards[0]!, leftDraw.card]).total;
  const rightTotal = handTotal([hand.cards[1]!, rightDraw.card]).total;
  const left: BjHand = {
    cards: [hand.cards[0]!, leftDraw.card],
    bet: hand.bet,
    stood: ace || leftTotal >= 21,
    doubled: false,
    splitAce: ace,
    wasSplit: true,
  };
  const right: BjHand = {
    cards: [hand.cards[1]!, rightDraw.card],
    bet: hand.bet,
    stood: ace || rightTotal >= 21,
    doubled: false,
    splitAce: ace,
    wasSplit: true,
  };
  return advance({ ...table, shoe: rightDraw.shoe, hands: [left, right], active: 0 });
}

export function insuranceCost(table: Table): number {
  return Math.floor(table.baseBet / 2);
}
