import { shuffle } from "./rng";

export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
export const SUITS = ["S", "H", "D", "C"] as const;

export type Rank = (typeof RANKS)[number];
export type Suit = (typeof SUITS)[number];
export interface Card {
  r: Rank;
  s: Suit;
}

export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const s of SUITS) {
    for (const r of RANKS) deck.push({ r, s });
  }
  return deck;
}

export function freshShoe(decks = 6): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < decks; i++) cards.push(...makeDeck());
  return shuffle(cards);
}

export function bjValue(rank: Rank): number {
  if (rank === "A") return 11;
  if (rank === "K" || rank === "Q" || rank === "J") return 10;
  return Number(rank);
}

export function handTotal(cards: readonly Card[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.r === "A") {
      aces += 1;
      total += 11;
    } else {
      total += bjValue(card.r);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return { total, soft: aces > 0 };
}

export function isBlackjack(cards: readonly Card[]): boolean {
  return cards.length === 2 && handTotal(cards).total === 21;
}

export function pokerRank(rank: Rank): number {
  if (rank === "A") return 14;
  if (rank === "K") return 13;
  if (rank === "Q") return 12;
  if (rank === "J") return 11;
  return Number(rank);
}

export function cardLabel(card: Card): string {
  const suit = { S: "spades", H: "hearts", D: "diamonds", C: "clubs" }[card.s];
  const rank = { A: "ace", K: "king", Q: "queen", J: "jack" }[card.r as "A" | "K" | "Q" | "J"] ?? card.r;
  return `${rank} of ${suit}`;
}
