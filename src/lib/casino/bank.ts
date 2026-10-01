import { create } from "zustand";

export type GameId = "slots" | "blackjack" | "roulette" | "poker" | "house";

export interface LedgerRow {
  id: string;
  game: GameId;
  stake: number;
  payout: number;
  net: number;
  note: string;
  at: number;
}

interface Persisted {
  version: 1;
  chips: number;
  wagered: number;
  returned: number;
  peak: number;
  hands: number;
  ledger: LedgerRow[];
  sound: boolean;
}

const KEY = "marlowe.house.v1";
export const BUY_IN = 2500;

const blank = (): Persisted => ({
  version: 1,
  chips: BUY_IN,
  wagered: 0,
  returned: 0,
  peak: BUY_IN,
  hands: 0,
  ledger: [],
  sound: true,
});

function clampInt(n: unknown, fallback: number): number {
  return typeof n === "number" && Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
}

function readSave(): Persisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
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
      ledger: Array.isArray(parsed.ledger) ? parsed.ledger.slice(0, 40) : [],
    };
  } catch {
    return null;
  }
}

function writeSave(data: Persisted): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode or quota — keep playing in memory */
  }
}

interface House extends Persisted {
  hydrated: boolean;
  hydrate: () => void;
  canStake: (n: number) => boolean;
  stake: (n: number) => boolean;
  pay: (n: number) => void;
  refund: (n: number) => void;
  record: (row: Omit<LedgerRow, "id" | "at">) => void;
  settle: (game: GameId, stake: number, payout: number, note: string) => void;
  rebuy: () => void;
  reset: () => void;
  toggleSound: () => void;
}

function snapshot(s: House): Persisted {
  return {
    version: 1,
    chips: s.chips,
    wagered: s.wagered,
    returned: s.returned,
    peak: s.peak,
    hands: s.hands,
    ledger: s.ledger,
    sound: s.sound,
  };
}

export const useHouse = create<House>((set, get) => ({
  ...blank(),
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    const saved = readSave();
    set(saved ? { ...saved, hydrated: true } : { hydrated: true });
  },
  canStake: (n) => Number.isInteger(n) && n > 0 && get().chips >= n,
  stake: (n) => {
    if (!get().canStake(n)) return false;
    const chips = get().chips - n;
    set({ chips, wagered: get().wagered + n });
    writeSave(snapshot(get()));
    return true;
  },
  pay: (n) => {
    const add = Math.max(0, Math.round(n));
    const chips = get().chips + add;
    set({
      chips,
      returned: get().returned + add,
      peak: Math.max(get().peak, chips),
    });
    writeSave(snapshot(get()));
  },
  refund: (n) => {
    const add = Math.max(0, Math.round(n));
    set({
      chips: get().chips + add,
      wagered: Math.max(0, get().wagered - add),
    });
    writeSave(snapshot(get()));
  },
  record: (row) => {
    const entry: LedgerRow = {
      ...row,
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      at: Date.now(),
    };
    set({
      ledger: [entry, ...get().ledger].slice(0, 40),
      hands: row.game === "house" ? get().hands : get().hands + 1,
    });
    writeSave(snapshot(get()));
  },
  settle: (game, stake, payout, note) => {
    get().pay(payout);
    get().record({ game, stake, payout, net: payout - stake, note });
  },
  rebuy: () => {
    const chips = get().chips + BUY_IN;
    set({ chips, peak: Math.max(get().peak, chips) });
    get().record({
      game: "house",
      stake: 0,
      payout: BUY_IN,
      net: BUY_IN,
      note: "Buy-in",
    });
    writeSave(snapshot(get()));
  },
  reset: () => {
    const sound = get().sound;
    set({ ...blank(), sound, hydrated: true });
    writeSave(snapshot(get()));
  },
  toggleSound: () => {
    set({ sound: !get().sound });
    writeSave(snapshot(get()));
  },
}));

export function formatChips(n: number, locale: "en" | "fi" = "en"): string {
  return Math.round(n).toLocaleString(locale === "fi" ? "fi-FI" : "en-US");
}

export const GAME_LABEL: Record<GameId, string> = {
  slots: "Fruit machine",
  blackjack: "Blackjack",
  roulette: "Roulette",
  poker: "Texas Hold'em",
  house: "House",
};

if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") writeSave(snapshot(useHouse.getState()));
  });
}
