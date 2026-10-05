import { useEffect, useRef, useState } from "react";
import { playCue } from "@/lib/casino/audio";
import { useHouse } from "@/lib/casino/bank";
import type { Card } from "@/lib/casino/cards";
import {
  act,
  BB,
  botAct,
  compareHands,
  holdingOf,
  options,
  reveal,
  SB,
  SEATS,
  startHand,
  type HandKey,
  type HandRank,
  type PlayerAct,
  type Table,
} from "@/lib/casino/holdem";
import { rankWord, useI18n, type CopyKey } from "@/lib/casino/i18n";
import { Console, GhostButton, GoldButton, PlayingCard, ResultLine, RuleNote } from "./bits";
import { BrokeRack } from "./shell";
import { useReducedMotion } from "./use-reduced-motion";

const RAIL_KEY = "marlowe.holdem.v1";
const RAIL_BUY = 2000;
const BOT_MS = 2200;
const REVEAL_MS = 1100;
const BOT_KEY = ["botAino", "botEero", "botSaima", "botOnni", "botHelmi"] as const;

const HAND_KEY: Record<HandKey, CopyKey> = {
  royal: "handRoyal",
  straightFlush: "handStraightFlush",
  quads: "handQuads",
  fullHouse: "handFullHouse",
  flush: "handFlush",
  straight: "handStraight",
  trips: "handTrips",
  twoPair: "handTwoPair",
  pair: "handPair",
  highCard: "handHighCard",
};

interface SeatSave {
  bots: number[];
  button: number;
}

function freshSeat(): SeatSave {
  return { bots: Array.from({ length: SEATS - 1 }, () => RAIL_BUY), button: 0 };
}

function readSeat(): SeatSave {
  if (typeof window === "undefined") return freshSeat();
  try {
    const raw = window.localStorage.getItem(RAIL_KEY);
    if (!raw) return freshSeat();
    const parsed = JSON.parse(raw) as { rail?: number; button?: number; bots?: number[] };
    const button =
      typeof parsed.button === "number" && parsed.button >= 0 && parsed.button < SEATS ? Math.floor(parsed.button) : 0;
    const bots = Array.from({ length: SEATS - 1 }, (_, index) => {
      const saved = Array.isArray(parsed.bots) ? parsed.bots[index] : index === 0 ? parsed.rail : undefined;
      return typeof saved === "number" && saved >= 1 ? Math.round(saved) : RAIL_BUY;
    });
    return { bots, button };
  } catch {
    return freshSeat();
  }
}

function writeSeat(seat: SeatSave) {
  try {
    window.localStorage.setItem(RAIL_KEY, JSON.stringify(seat));
  } catch {
    /* ignore */
  }
}

export function PokerGame() {
  const reduced = useReducedMotion();
  const chips = useHouse((s) => s.chips);
  const { t, fmt, locale } = useI18n();
  const [seat, setSeat] = useState<SeatSave>(freshSeat);
  const [ready, setReady] = useState(false);
  const [hand, setHand] = useState<Table | null>(null);
  const [tone, setTone] = useState<"win" | "push" | "lose" | "idle">("idle");
  const [sizing, setSizing] = useState(false);
  const [refilled, setRefilled] = useState(false);
  const handRef = useRef<Table | null>(null);
  const invested = useRef(0);
  const settled = useRef(true);

  useEffect(() => {
    setSeat(readSeat());
    setReady(true);
  }, []);

  useEffect(
    () => () => {
      if (settled.current) return;
      useHouse.getState().refund(invested.current);
      invested.current = 0;
      settled.current = true;
    },
    [],
  );

  function nameOf(index: number): string {
    if (index <= 0) return t("you");
    return t(BOT_KEY[index - 1] ?? "botAino");
  }

  function outcome(table: Table): string {
    const net = table.stacks[0] - table.startYou;
    const yours = table.hands[0] ? t(HAND_KEY[table.hands[0].key]) : "";
    if (table.byFold && table.winner === 0) return t("foldWin", { n: fmt(net) });
    if (table.byFold && table.folded[0]) {
      if (net === 0 || typeof table.winner !== "number") return t("youFolded");
      return t("foldTaken", { name: nameOf(table.winner), n: fmt(Math.abs(net)) });
    }
    if (net > 0 && table.winner === 0) return t("winShow", { n: fmt(net), hand: yours });
    if (net >= 0 && table.winner === "split") return t("splitShow", { hand: yours });
    if (net === 0) return t("splitShow", { hand: yours });
    const rivals = (typeof table.winner === "number" ? [table.winner] : winningSeats(table)).filter((index) => index !== 0);
    const who = rivals.map(nameOf).join(", ") || t("rail");
    const shownHand = table.hands[rivals[0] ?? -1];
    return t("loseShow", { name: who, n: fmt(Math.abs(net)), hand: shownHand ? t(HAND_KEY[shownHand.key]) : yours });
  }

  function syncStack(prev: number, next: number, done: boolean) {
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

  function finish(next: Table) {
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
      note,
    });
    settled.current = true;
    invested.current = 0;
    const saved = { bots: next.stacks.slice(1, SEATS).map((stack) => Math.round(stack)), button: (next.button + 1) % SEATS };
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

  function apply(next: Table, prevStack: number) {
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
    while (bots.length < SEATS - 1) {
      bots.push(RAIL_BUY);
      didRefill = true;
    }
    const next = startHand({ stacks: [bank, ...bots.slice(0, SEATS - 1)], button: seat.button });
    if (!next) return;
    settled.current = false;
    invested.current = 0;
    setRefilled(didRefill);
    setTone("idle");
    playCue("card");
    apply(next, bank);
  }

  function playerAct(action: PlayerAct) {
    const current = handRef.current;
    if (!current || current.status !== "act" || current.toAct !== 0) return;
    const next = act(current, 0, action);
    if (next === current) return;
    playCue(action.type === "fold" ? "lose" : "chip");
    apply(next, current.stacks[0]);
  }

  useEffect(() => {
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
        const fallback: PlayerAct = opt.check ? { type: "check" } : opt.call > 0 ? { type: "call" } : { type: "fold" };
        next = act(live, seatNow, fallback);
      }
      if (next !== live) apply(next, live.stacks[0]);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [hand, reduced]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
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
      else if (key === "a" && opt.maxTo != null) playerAct({ type: "bet", to: opt.maxTo });
      else if (key === "b" && opt.minTo != null) playerAct({ type: "bet", to: opt.minTo });
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
  const line =
    shown?.status === "done"
      ? outcome(shown)
      : shown?.status === "reveal"
        ? t("reveal")
        : actor != null && actor !== 0
          ? t("thinking", { name: nameOf(actor) })
          : actor === 0
            ? t("yourTurn")
            : t("sit");
  const holding = shown ? describeHolding(shown, t, locale) : "";

  function seatStack(index: number): string {
    if (shown) return fmt(shown.stacks[index] ?? 0);
    if (index === 0) return fmt(chips);
    return fmt(seat.bots[index - 1] ?? RAIL_BUY);
  }

  function renderSeat(index: number, hero = false) {
    const folded = Boolean(shown?.inHand[index] && shown.folded[index]);
    const acting = shown?.status === "act" && shown.toAct === index;
    const allIn = Boolean(shown && shown.inHand[index] && !shown.folded[index] && shown.stacks[index] === 0 && shown.status !== "done");
    const bet = shown && !folded && !allIn && (shown.streetBet[index] ?? 0) > 0 ? t("betOf", { n: fmt(shown.streetBet[index] ?? 0) }) : "";
    const holes = shown?.hole[index] ?? [];
    const showFaces = holes.length > 0 && (index === 0 || (expose && !folded));
    return (
      <SeatSpot
        key={index}
        name={nameOf(index)}
        stack={seatStack(index)}
        button={buttonSeat === index}
        buttonLabel={t("button")}
        acting={acting}
        actingLabel={t("toActBadge")}
        folded={folded}
        foldedLabel={t("folded")}
        bet={allIn ? t("allin") : bet}
        cards={holes}
        showFaces={showFaces}
        hero={hero}
        cardsLabel={index === 0 ? t("holeYou") : nameOf(index)}
      />
    );
  }

  return (
    <Console pid="04" unit="table.holdem" title={t("gamePoker")} blurb={t("roomPoker")} live={Boolean(live)}>
      <p className="mb-3 font-mono text-xs text-term-muted">{t("blinds", { sb: SB, bb: BB })}</p>
      <div className="felt-surface rounded-md border border-term-line px-3 py-4 sm:px-5">
        <div className="grid grid-cols-3 gap-2">{[2, 3, 4].map((index) => renderSeat(index))}</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {renderSeat(1)}
          {renderSeat(5)}
        </div>
        <div className="mt-4 text-center">
          <p className="font-mono text-xs tracking-wide text-ivory/75 uppercase">
            {shown ? t(shown.street) : t("preflop")} · {t("pot")} {fmt(shown?.pot ?? 0)}
          </p>
          <div className="mt-2 flex min-h-14 flex-wrap items-center justify-center gap-1.5" aria-label={t("board")}>
            {shown && shown.board.length > 0 ? (
              shown.board.map((card, index) => <PlayingCard key={`${card.r}${card.s}${index}`} card={card} small />)
            ) : (
              <p className="text-sm text-ivory/70">{shown ? t(shown.street) : t("board")}</p>
            )}
          </div>
        </div>
        <div className="mt-4 border-t border-ivory/15 pt-4">{renderSeat(0, true)}</div>
        {holding ? (
          <div className="mt-3 text-center">
            <p className="text-sm text-phosphor">{holding}</p>
            {shown && !shown.folded[0] ? <p className="mt-1 text-xs text-ivory/70">{t("handHelp")}</p> : null}
          </div>
        ) : null}
      </div>
      <div className="mt-5">
        <ResultLine text={line} tone={shown && shown.status !== "done" ? "idle" : tone} />
      </div>
      {refilled && live ? <p className="mt-2 text-sm text-term-muted">{t("railRefill")}</p> : null}
      {!live ? (
        <div className="mt-5">
          <GoldButton disabled={!ready || chips < 1} onClick={deal}>
            {t("deal")}
          </GoldButton>
        </div>
      ) : null}
      {opt ? (
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            {!opt.check ? <GhostButton onClick={() => playerAct({ type: "fold" })}>{t("fold")}</GhostButton> : null}
            {opt.check ? <GoldButton onClick={() => playerAct({ type: "check" })}>{t("check")}</GoldButton> : null}
            {opt.call > 0 ? (
              <GoldButton onClick={() => playerAct({ type: "call" })}>{t("call", { n: fmt(opt.call) })}</GoldButton>
            ) : null}
            {opt.minTo != null ? (
              <GhostButton onClick={() => setSizing((open) => !open)}>{opt.call > 0 ? t("raise") : t("bet")}</GhostButton>
            ) : null}
          </div>
          {sizing && opt.minTo != null && opt.maxTo != null ? (
            <div className="flex flex-wrap gap-2">
              {targets.map((item) => (
                <GhostButton key={item.id} onClick={() => playerAct({ type: "bet", to: item.to })}>
                  {t(item.id)} {fmt(item.to)}
                </GhostButton>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      <p className="mt-3 font-mono text-xs text-term-muted">{t("keys")}</p>
      {chips < 1 ? <p className="mt-2 text-sm text-term-muted">{t("needChips")}</p> : null}
      <BrokeRack />
      <RuleNote title="House rules">
        <p>{t("holdemRules")}</p>
      </RuleNote>
    </Console>
  );
}

function winningSeats(table: Table): number[] {
  let best: HandRank | null = null;
  let seats: number[] = [];
  table.hands.forEach((hand, seat) => {
    if (!hand) return;
    if (!best || compareHands(hand, best) > 0) {
      best = hand;
      seats = [seat];
    } else if (compareHands(hand, best) === 0) seats.push(seat);
  });
  return seats;
}

function describeHolding(
  table: Table,
  t: (key: CopyKey, vars?: Record<string, string | number>) => string,
  locale: "en" | "fi",
): string {
  const hole = table.hole[0] ?? [];
  if (hole.length < 2) return "";
  if (table.folded[0]) return t("youFolded");
  const holding = holdingOf(hole, table.board);
  if (!holding) return "";
  const word = (rank: number, plural = false) => rankWord(locale, rank, plural);
  const high = holding.ranks[0] ?? 0;
  const low = holding.ranks[1] ?? 0;
  switch (holding.key) {
    case "royal":
      return t("haveRoyal");
    case "straightFlush":
      return t("haveSf", { rank: word(high) });
    case "quads":
      return t("haveQuads", { rank: word(high, true) });
    case "fullHouse":
      return t("haveFull", { a: word(high, true), b: word(low, true) });
    case "flush":
      return t("haveFlush", { rank: word(high) });
    case "straight":
      return t("haveStraight", { rank: word(high) });
    case "trips":
      return t("haveTrips", { rank: word(high, true) });
    case "twoPair":
      return t("haveTwo", { a: word(high, true), b: word(low, true) });
    case "pair":
      return t("havePair", { rank: word(high, true) });
    default:
      if (table.board.length < 3 && holding.ranks.length > 1) {
        return holding.suited ? t("haveSuited", { high: word(high), low: word(low) }) : t("haveOff", { high: word(high), low: word(low) });
      }
      return t("haveHigh", { rank: word(high) });
  }
}

function uniqueTargets(table: Table, minTo: number, maxTo: number): { id: CopyKey; to: number }[] {
  const highest = Math.max(0, ...table.streetBet);
  const mine = table.streetBet[table.toAct ?? 0] ?? 0;
  const call = Math.max(0, highest - mine);
  const potTo = clamp(highest + call + table.pot, minTo, maxTo);
  const half = clamp(highest + Math.floor((table.pot + call) / 2), minTo, maxTo);
  const items: { id: CopyKey; to: number }[] = [
    { id: "min", to: minTo },
    { id: "half", to: half },
    { id: "pot", to: potTo },
    { id: "allin", to: maxTo },
  ];
  const seen = new Set<number>();
  return items.filter((item) => {
    if (seen.has(item.to)) return false;
    seen.add(item.to);
    return true;
  });
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function SeatSpot({
  name,
  stack,
  button,
  buttonLabel,
  acting,
  actingLabel,
  folded,
  foldedLabel,
  bet,
  cards,
  showFaces,
  hero,
  cardsLabel,
}: {
  name: string;
  stack: string;
  button: boolean;
  buttonLabel: string;
  acting: boolean;
  actingLabel: string;
  folded: boolean;
  foldedLabel: string;
  bet: string;
  cards: Card[];
  showFaces: boolean;
  hero: boolean;
  cardsLabel: string;
}) {
  return (
    <div
      className={`min-w-0 rounded-md px-1 py-1 text-center ${acting ? "bg-ink/30 ring-2 ring-phosphor" : ""}`}
      aria-current={acting ? "true" : undefined}
    >
      {cards.length > 0 ? (
        <div className={`relative flex justify-center gap-1 ${folded ? "opacity-45" : ""}`} aria-label={cardsLabel}>
          {cards.map((card, index) => (
            <PlayingCard key={`${card.r}${card.s}${index}`} card={showFaces ? card : undefined} down={!showFaces} small={!hero} />
          ))}
        </div>
      ) : null}
      <p className={`mt-1 truncate font-display leading-none text-ivory ${hero ? "text-3xl" : "text-xl"}`}>
        {name}
        {button ? (
          <span
            className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-phosphor align-middle font-mono text-[10px] font-semibold text-phosphor-ink"
            title={buttonLabel}
          >
            D
          </span>
        ) : null}
      </p>
      <p className="num text-xs text-ivory/80">{stack}</p>
      {acting ? (
        <p className="mt-1 inline-flex rounded-full bg-phosphor px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-phosphor-ink uppercase">
          {actingLabel}
        </p>
      ) : null}
      {folded ? (
        <p className="mt-1 inline-flex rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-ivory uppercase">
          {foldedLabel}
        </p>
      ) : null}
      {bet ? <p className="mt-1 font-mono text-[11px] tracking-wide text-phosphor uppercase">{bet}</p> : null}
    </div>
  );
}
