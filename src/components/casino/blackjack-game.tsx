import { useEffect, useRef, useState } from "react";
import { playCue } from "@/lib/casino/audio";
import { useHouse } from "@/lib/casino/bank";
import {
  canDouble,
  canHit,
  canSplit,
  canStand,
  clearHand,
  createTable,
  deal,
  doubleDown,
  hit,
  insuranceCost,
  resolveInsurance,
  splitHand,
  stand,
  type Table,
} from "@/lib/casino/blackjack";
import { handTotal, type Card } from "@/lib/casino/cards";
import { DenomPicker, Console, GhostButton, GoldButton, PlayingCard, ResultLine, RuleNote } from "./bits";
import { BrokeRack } from "./shell";
import { useI18n } from "@/lib/casino/i18n";
import { useReducedMotion } from "./use-reduced-motion";

const DENOMS = [10, 25, 100, 500] as const;

export function BlackjackGame() {
  const reduced = useReducedMotion();
  const { t, fmt } = useI18n();
  const chips = useHouse((s) => s.chips);
  const [wager, setWager] = useState(25);
  const [denom, setDenom] = useState(25);
  const [table, setTable] = useState<Table>(() => createTable());
  const [banner, setBanner] = useState("Place a bet.");
  const [tone, setTone] = useState<"win" | "push" | "lose" | "idle">("idle");
  const [view, setView] = useState({ players: [] as number[], dealer: 0, hole: false });
  const [busy, setBusy] = useState(false);
  const tableRef = useRef(table);
  const owed = useRef<{ stake: number; back: number; note: string } | null>(null);
  const timer = useRef(0);
  const gen = useRef(0);

  const flushRef = useRef<(announce: boolean) => void>(() => {});
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

  useEffect(
    () => () => {
      gen.current += 1;
      window.clearTimeout(timer.current);
      flushRef.current(false);
    },
    [],
  );

  const runRef = useRef<(next: Table, kind: "deal" | "peek" | "play") => void>(() => {});
  runRef.current = (next, kind) => {
    const id = gen.current + 1;
    gen.current = id;
    const live = () => gen.current === id;
    const pace = (ms: number) =>
      new Promise<void>((resolve) => {
        timer.current = window.setTimeout(resolve, reduced ? 70 : ms);
      });
    if (next.phase === "done" && next.settlement) {
      const stake = next.hands.reduce((sum, hand) => sum + hand.bet, 0) + next.insuranceBet;
      owed.current = {
        stake,
        back: next.settlement.mainReturn + next.settlement.insuranceReturn,
        note: next.settlement.note,
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
      setView({ players: showHands(), dealer: Math.min(2, next.dealer.length), hole: false });
      playCue("card");
      while (n < next.dealer.length) {
        await pace(440);
        if (!live()) return;
        n += 1;
        setView({ players: showHands(), dealer: n, hole: false });
        playCue("tick");
      }
      await pace(560);
      if (!live()) return;
      flushRef.current(true);
    };

    void (async () => {
      if (kind === "deal") {
        setBanner("Dealing");
        setView({ players: [0], dealer: 0, hole: false });
        await pace(90);
        if (!live()) return;
        setView({ players: [1], dealer: 0, hole: false });
        playCue("card");
        await pace(460);
        if (!live()) return;
        setView({ players: [1], dealer: 1, hole: false });
        playCue("card");
        await pace(460);
        if (!live()) return;
        setView({ players: [2], dealer: 1, hole: false });
        playCue("card");
        await pace(460);
        if (!live()) return;
        setView({ players: [2], dealer: 1, hole: true });
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
        hole: next.dealer.length > 1,
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

  function present(next: Table, kind: "deal" | "peek" | "play") {
    runRef.current(next, kind);
  }

  function onDeal(amount = wager) {
    if (busy) return;
    const ready = tableRef.current.phase === "done" ? clearHand(tableRef.current) : tableRef.current;
    if (ready.phase !== "bet") return;
    if (!useHouse.getState().stake(amount)) return;
    present(deal(ready, amount), "deal");
  }

  function act(kind: "hit" | "stand" | "double" | "split") {
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

  function insure(take: boolean) {
    if (busy) return;
    const prev = tableRef.current;
    const cost = insuranceCost(prev);
    if (take && !useHouse.getState().stake(cost)) return;
    const next = resolveInsurance(prev, take);
    if (next === prev && take) useHouse.getState().refund(cost);
    if (next !== prev) present(next, "peek");
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
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
  const scoreOf = (cards: readonly Card[]) => {
    const { total, soft } = handTotal(cards);
    if (total > 21) return t("bjBust");
    if (soft && total !== 21) return t("bjSoft", { n: total });
    return t("bjTotal", { n: total });
  };
  const dealerTotal = !holeDown && dealerUp.length >= 2 ? scoreOf(dealerUp) : "";

  return (
    <Console pid="02" unit="table.blackjack" title={t("gameBlackjack")} blurb={t("bjIntro")} live={busy}>
      <div className="felt-surface rounded-md border border-term-line px-4 py-5">
        <p className="font-mono text-xs tracking-wide text-ivory/75 uppercase">
          {t("bjDealer")}
          {dealerTotal ? ` · ${dealerTotal}` : ""}
        </p>
        <div className="mt-3 flex gap-2">
          {dealerUp.map((card, index) => (
            <PlayingCard key={`${card.r}${card.s}${index}`} card={card} enter />
          ))}
          {holeDown ? <PlayingCard down enter /> : null}
          {table.dealer.length === 0 ? <PlayingCard down /> : null}
        </div>
        <div className={`mt-6 grid gap-4 ${table.hands.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {table.hands.length === 0 ? (
            <p className="text-sm text-ivory/80">{t("bjWait")}</p>
          ) : (
            table.hands.map((hand, index) => {
              const live = phase === "player" && index === table.active && !busy;
              const shownCards = hand.cards.slice(0, view.players[index] ?? 0);
              return (
                <div key={index} className={`rounded-md border p-3 ${live ? "border-phosphor bg-ink/20" : "border-transparent"}`}>
                  <p className="font-mono text-xs tracking-wide text-ivory/75 uppercase">
                    {table.hands.length > 1 ? t(index === 0 ? "bjLeft" : "bjRight") : t("you")}
                    {shownCards.length ? ` · ${scoreOf(shownCards)}` : ""} · {t("betOf", { n: fmt(hand.bet) })}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {shownCards.map((card, cardIndex) => (
                      <PlayingCard key={`${card.r}${card.s}${cardIndex}`} card={card} enter />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="mt-5">
        <ResultLine text={banner} tone={tone} />
      </div>
      {phase === "bet" || (phase === "done" && !busy) ? (
        <div className="mt-5 space-y-4">
          <div>
            <p className="mb-2 font-mono text-xs tracking-wide text-term-muted uppercase">{t("bjAdd", { n: fmt(wager) })}</p>
            <DenomPicker
              value={denom}
              onChange={(value) => {
                setDenom(value);
                setWager((prev) => Math.min(prev + value, Math.max(value, chips)));
                playCue("chip");
              }}
              denoms={DENOMS}
              disabled={busy}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <GoldButton disabled={busy || wager < 10 || chips < wager} onClick={() => onDeal(wager)}>
              {t("bjDeal", { n: fmt(wager) })}
            </GoldButton>
            <GhostButton
              disabled={busy}
              onClick={() => {
                setWager(0);
              }}
            >
              {t("bjClear")}
            </GhostButton>
          </div>
        </div>
      ) : null}
      {phase === "insurance" && !busy ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <GoldButton disabled={busy || chips < insuranceCost(table)} onClick={() => insure(true)}>
            {t("bjInsure", { n: fmt(insuranceCost(table)) })}
          </GoldButton>
          <GhostButton disabled={busy} onClick={() => insure(false)}>
            {t("bjDecline")}
          </GhostButton>
        </div>
      ) : null}
      {phase === "player" && active && !busy ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <GoldButton disabled={!canHit(table)} onClick={() => act("hit")}>
            {t("bjHit")}
          </GoldButton>
          <GhostButton disabled={!canStand(table)} onClick={() => act("stand")}>
            {t("bjStand")}
          </GhostButton>
          <GhostButton disabled={!canDouble(table) || chips < active.bet} onClick={() => act("double")}>
            {t("bjDouble")}
          </GhostButton>
          <GhostButton disabled={!canSplit(table) || chips < active.bet} onClick={() => act("split")}>
            {t("bjSplit")}
          </GhostButton>
        </div>
      ) : null}
      <p className="mt-3 font-mono text-xs text-term-muted">{t("bjKeys")}</p>
      <BrokeRack />
      <RuleNote title="House rules">
        <p>{t("bjRules1")}</p>
        <p>{t("bjRules2")}</p>
      </RuleNote>
    </Console>
  );
}
