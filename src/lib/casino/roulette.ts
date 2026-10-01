export const WHEEL = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
] as const;

export const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export type BetKind =
  | { kind: "straight"; n: number }
  | { kind: "split"; a: number; b: number }
  | { kind: "street"; start: number }
  | { kind: "corner"; low: number }
  | { kind: "six"; start: number }
  | { kind: "dozen"; d: 1 | 2 | 3 }
  | { kind: "column"; c: 1 | 2 | 3 }
  | { kind: "red" }
  | { kind: "black" }
  | { kind: "odd" }
  | { kind: "even" }
  | { kind: "low" }
  | { kind: "high" };

export interface PlacedBet {
  bet: BetKind;
  amount: number;
}

export function pocketColor(n: number): "red" | "black" | "green" {
  if (n === 0) return "green";
  return REDS.has(n) ? "red" : "black";
}

export function columnOf(n: number): 1 | 2 | 3 | null {
  if (n < 1 || n > 36) return null;
  const mod = n % 3;
  if (mod === 1) return 1;
  if (mod === 2) return 2;
  return 3;
}

export function splitMates(n: number): number[] {
  if (n < 1 || n > 36) return [];
  const col = Math.ceil(n / 3);
  const level = (n - 1) % 3;
  const mates: number[] = [];
  if (level < 2) mates.push(n + 1);
  if (level > 0) mates.push(n - 1);
  if (col < 12) mates.push(n + 3);
  if (col > 1) mates.push(n - 3);
  return mates;
}

export function streetStart(n: number): number | null {
  if (n < 1 || n > 36) return null;
  return n - ((n - 1) % 3);
}

export function cornersTouching(n: number): number[] {
  if (n < 1 || n > 36) return [];
  const col = Math.ceil(n / 3);
  const level = (n - 1) % 3;
  const lows: number[] = [];
  if (level <= 1 && col < 12) lows.push(n);
  if (level <= 1 && col > 1) lows.push(n - 3);
  if (level >= 1 && col < 12) lows.push(n - 1);
  if (level >= 1 && col > 1) lows.push(n - 4);
  return lows;
}

export function sixesTouching(n: number): number[] {
  const start = streetStart(n);
  if (start == null) return [];
  const starts: number[] = [];
  if (start <= 31) starts.push(start);
  if (start > 1) starts.push(start - 3);
  return starts;
}

export function cornerNumbers(low: number): number[] {
  return [low, low + 1, low + 3, low + 4];
}

export function isLegal(bet: BetKind): boolean {
  switch (bet.kind) {
    case "straight":
      return bet.n >= 0 && bet.n <= 36;
    case "split":
      return bet.a >= 1 && bet.b <= 36 && bet.a < bet.b && splitMates(bet.a).includes(bet.b);
    case "street":
      return bet.start >= 1 && bet.start <= 34 && (bet.start - 1) % 3 === 0;
    case "corner": {
      const col = Math.ceil(bet.low / 3);
      const level = (bet.low - 1) % 3;
      return bet.low >= 1 && bet.low <= 32 && level <= 1 && col < 12;
    }
    case "six":
      return bet.start >= 1 && bet.start <= 31 && (bet.start - 1) % 3 === 0;
    case "dozen":
      return bet.d === 1 || bet.d === 2 || bet.d === 3;
    case "column":
      return bet.c === 1 || bet.c === 2 || bet.c === 3;
    default:
      return true;
  }
}

export function betKey(bet: BetKind): string {
  switch (bet.kind) {
    case "straight":
      return `st:${bet.n}`;
    case "split":
      return `sp:${bet.a}-${bet.b}`;
    case "street":
      return `tr:${bet.start}`;
    case "corner":
      return `co:${bet.low}`;
    case "six":
      return `sx:${bet.start}`;
    case "dozen":
      return `dz:${bet.d}`;
    case "column":
      return `cl:${bet.c}`;
    default:
      return bet.kind;
  }
}

export function describeBet(bet: BetKind): string {
  switch (bet.kind) {
    case "straight":
      return `${bet.n}`;
    case "split":
      return `Split ${bet.a}/${bet.b}`;
    case "street":
      return `Street ${bet.start}–${bet.start + 2}`;
    case "corner":
      return `Corner ${cornerNumbers(bet.low).join("/")}`;
    case "six":
      return `Line ${bet.start}–${bet.start + 5}`;
    case "dozen":
      return (["1st dozen", "2nd dozen", "3rd dozen"] as const)[bet.d - 1];
    case "column":
      return `Column ${bet.c}`;
    case "red":
      return "Red";
    case "black":
      return "Black";
    case "odd":
      return "Odd";
    case "even":
      return "Even";
    case "low":
      return "1–18";
    case "high":
      return "19–36";
  }
}

export function payoutOdds(bet: BetKind): number {
  switch (bet.kind) {
    case "straight":
      return 35;
    case "split":
      return 17;
    case "street":
      return 11;
    case "corner":
      return 8;
    case "six":
      return 5;
    case "dozen":
    case "column":
      return 2;
    default:
      return 1;
  }
}

export function covers(bet: BetKind, n: number): boolean {
  switch (bet.kind) {
    case "straight":
      return bet.n === n;
    case "split":
      return bet.a === n || bet.b === n;
    case "street":
      return n >= bet.start && n < bet.start + 3;
    case "corner":
      return cornerNumbers(bet.low).includes(n);
    case "six":
      return n >= bet.start && n < bet.start + 6;
    case "dozen":
      return n !== 0 && Math.ceil(n / 12) === bet.d;
    case "column":
      return columnOf(n) === bet.c;
    case "red":
      return REDS.has(n);
    case "black":
      return n !== 0 && !REDS.has(n);
    case "odd":
      return n !== 0 && n % 2 === 1;
    case "even":
      return n !== 0 && n % 2 === 0;
    case "low":
      return n >= 1 && n <= 18;
    case "high":
      return n >= 19 && n <= 36;
  }
}

export function settleRoulette(bets: readonly PlacedBet[], n: number): {
  stake: number;
  returned: number;
  note: string;
} {
  let stake = 0;
  let returned = 0;
  const wins: string[] = [];
  for (const placed of bets) {
    stake += placed.amount;
    if (covers(placed.bet, n)) {
      returned += placed.amount * (payoutOdds(placed.bet) + 1);
      wins.push(describeBet(placed.bet));
    }
  }
  const color = pocketColor(n);
  const head = `${n} ${color}`;
  return {
    stake,
    returned,
    note: wins.length ? `${head} · ${wins.join(", ")}` : `${head} · house`,
  };
}

export function wheelIndex(n: number): number {
  return WHEEL.indexOf(n as (typeof WHEEL)[number]);
}
