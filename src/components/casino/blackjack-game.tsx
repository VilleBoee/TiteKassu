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
import { DenomPicker, GhostButton, GoldButton, PlayingCard, ResultLine, RuleNote } from "./bits";
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
  const [shown, setShown] = useState(1);
  const [busy, setBusy] = useState(false);
  const tableRef = useRef(table);
  const owed = useRef<{ stake: number; back: number; note: string } | null>(null);
  const timer = useRef(0);

  const flush = (announce: boolean) => {
    const due = owed.current;
    if (!due) return;
    owed.current = null;
    window.clearInterval(timer.current);
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

  useEffect(() => () => flush(false), []);

  function present(next: Table) {
    tableRef.current = next;
    setTable(next);
    if (next.phase !== "done" || !next.settlement) {
      setShown(1);
      setBanner(next.phase === "insurance" ? "Insurance?" : "Your hand");
      setTone("idle");
      playCue("card");
      return;
    }
    const stake = next.hands.reduce((sum, hand) => sum + hand.bet, 0) + next.insuranceBet;
    const back = next.settlement.mainReturn + next.settlement.insuranceReturn;
    owed.current = { stake, back, note: next.settlement.note };
    const count = next.dealer.length;
    if (reduced || count <= 2) {
      setShown(count);
      flush(true);
      return;
    }
    setBusy(true);
    setShown(2);
    setBanner("Dealer plays");
    setTone("idle");
    playCue("card");
    let n = 2;
    timer.current = window.setInterval(() => {
      n += 1;
      setShown(n);
      playCue("tick");
      if (n >= count) flush(true);
    }, 420);
  }

  function onDeal(amount = wager) {
    if (busy) return;
    const ready = tableRef.current.phase === "done" ? clearHand(tableRef.current) : tableRef.current;
    if (ready.phase !== "bet") return;
    if (!useHouse.getState().stake(amount)) return;
    present(deal(ready, amount));
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
      present(next);
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
      present(next);
      return;
    }
    const next = kind === "hit" ? hit(prev) : stand(prev);
    if (next === prev) return;
    present(next);
  }

  function insure(take: boolean) {
    if (busy) return;
    const prev = tableRef.current;
    const cost = insuranceCost(prev);
    if (take && !useHouse.getState().stake(cost)) return;
    const next = resolveInsurance(prev, take);
    if (next === prev && take) useHouse.getState().refund(cost);
    if (next !== prev) present(next);
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
  const dealerShown = phase === "done" ? table.dealer.slice(0, shown) : table.dealer.slice(0, 1);
  const holeDown = phase === "player" || phase === "insurance";
  const active = table.hands[table.active];
  const scoreOf = (cards: readonly Card[]) => {
    const { total, soft } = handTotal(cards);
    if (total > 21) return t("bjBust");
    if (soft && total !== 21) return t("bjSoft", { n: total });
    return t("bjTotal", { n: total });
  };
  const dealerTotal = !holeDown && dealerShown.length >= 2 ? scoreOf(dealerShown) : "";

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-accent uppercase">{t("bjShoe")}</p>
      <h1 className="mt-1 font-display text-5xl leading-none">{t("gameBlackjack")}</h1>
      <p className="mt-3 max-w-prose text-muted">{t("bjIntro")}</p>
      <div className="felt-surface mt-6 rounded-card border border-gold-dim px-4 py-5">
        <p className="text-xs tracking-[0.16em] text-ivory/70 uppercase">
          {t("bjDealer")}
          {dealerTotal ? ` · ${dealerTotal}` : ""}
        </p>
        <div className="mt-2 flex gap-2">
          {dealerShown.map((card, index) => (
            <PlayingCard key={`${card.r}${card.s}${index}`} card={card} />
          ))}
          {holeDown && table.dealer.length > 1 ? <PlayingCard down /> : null}
          {table.dealer.length === 0 ? <PlayingCard down /> : null}
        </div>
        <div className={`mt-6 grid gap-4 ${table.hands.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {table.hands.length === 0 ? (
            <p className="text-sm text-ivory/80">{t("bjWait")}</p>
          ) : (
            table.hands.map((hand, index) => {
              const live = phase === "player" && index === table.active;
              return (
                <div key={index} className={`rounded-md p-2 ${live ? "ring-2 ring-gold" : ""}`}>
                  <p className="text-xs tracking-[0.16em] text-ivory/70 uppercase">
                    {table.hands.length > 1 ? t(index === 0 ? "bjLeft" : "bjRight") : t("you")} · {scoreOf(hand.cards)} ·{" "}
                    {t("betOf", { n: fmt(hand.bet) })}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {hand.cards.map((card, cardIndex) => (
                      <PlayingCard key={`${card.r}${card.s}${cardIndex}`} card={card} />
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
      {phase === "bet" || phase === "done" ? (
        <div className="mt-5 space-y-4">
          <div>
            <p className="mb-2 text-xs tracking-wide text-muted uppercase">{t("bjAdd", { n: fmt(wager) })}</p>
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
      {phase === "insurance" ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <GoldButton disabled={busy || chips < insuranceCost(table)} onClick={() => insure(true)}>
            {t("bjInsure", { n: fmt(insuranceCost(table)) })}
          </GoldButton>
          <GhostButton disabled={busy} onClick={() => insure(false)}>
            {t("bjDecline")}
          </GhostButton>
        </div>
      ) : null}
      {phase === "player" && active ? (
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
      <p className="mt-3 text-sm text-muted">{t("bjKeys")}</p>
      <BrokeRack />
      <RuleNote title="House rules">
        <p>{t("bjRules1")}</p>
        <p>{t("bjRules2")}</p>
      </RuleNote>
    </div>
  );
}
