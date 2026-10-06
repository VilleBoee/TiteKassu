import { useEffect, useMemo, useRef, useState } from "react";
import { playCue } from "@/lib/casino/audio";
import { useHouse } from "@/lib/casino/bank";
import { randInt } from "@/lib/casino/rng";
import { evaluateLine, lampName, PAYTABLE, REELS, type Lamp } from "@/lib/casino/slots";
import { DenomPicker, Console, GhostButton, GoldButton, LampMark, ResultLine, RuleNote } from "./bits";
import { BrokeRack } from "./shell";
import { useI18n } from "@/lib/casino/i18n";
import { useReducedMotion } from "./use-reduced-motion";

const REEL_H = 72;
const LOOPS = 5;
const DURATION = [1100, 1600, 2100];
const BETS = [5, 10, 25, 50, 100] as const;
const AUTO_SPINS = [10, 25, 50] as const;

function Reel({
  strip,
  stopIndex,
  spinId,
  frozen,
  duration,
  reduced,
}: {
  strip: readonly Lamp[];
  stopIndex: number;
  spinId: number;
  frozen: boolean;
  duration: number;
  reduced: boolean;
}) {
  const list = useMemo(() => {
    const copies = LOOPS + 3;
    return Array.from({ length: strip.length * copies }, (_, i) => strip[i % strip.length]!);
  }, [strip]);
  const [y, setY] = useState((1 - (strip.length + stopIndex)) * REEL_H);
  const [animate, setAnimate] = useState(false);
  const yRef = useRef(y);
  yRef.current = y;

  useEffect(() => {
    if (spinId === 0 || frozen) return;
    const period = strip.length;
    const currentIndex = 1 - yRef.current / REEL_H;
    const landed = ((Math.round(currentIndex) % period) + period) % period;
    const base = landed + period;
    const startY = (1 - base) * REEL_H;
    const delta = (stopIndex - landed + period) % period;
    const endIndex = base + LOOPS * period + delta;
    const endY = (1 - endIndex) * REEL_H;
    setAnimate(false);
    setY(startY);
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        if (!reduced) setAnimate(true);
        setY(endY);
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [spinId, frozen, stopIndex, strip.length, reduced]);

  return (
    <div className="relative overflow-hidden rounded-md bg-ink" style={{ height: REEL_H * 3 }}>
      <div
        className="absolute inset-x-0"
        style={{
          transform: `translateY(${y}px)`,
          transition: animate ? `transform ${duration}ms cubic-bezier(0.12, 0.7, 0.08, 1)` : "none",
        }}
      >
        {list.map((lamp, index) => (
          <div key={index} className="flex items-center justify-center" style={{ height: REEL_H }}>
            <LampMark lamp={lamp} />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 border-y border-phosphor/50 bg-phosphor/10" style={{ top: REEL_H, height: REEL_H }} />
    </div>
  );
}

export function SlotsGame() {
  const reduced = useReducedMotion();
  const { tx, fmt } = useI18n();
  const chips = useHouse((s) => s.chips);
  const [bet, setBet] = useState<number>(10);
  const [stops, setStops] = useState<number[]>([0, 0, 0]);
  const [held, setHeld] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [spinId, setSpinId] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [banner, setBanner] = useState("Center line pays.");
  const [tone, setTone] = useState<"win" | "push" | "lose" | "idle">("idle");
  const [autoLeft, setAutoLeft] = useState(0);
  const pending = useRef<{ id: number; bet: number; mult: number; label: string } | null>(null);
  const timer = useRef(0);
  const gapTimer = useRef(0);
  const autoRef = useRef(0);
  const betRef = useRef(bet);
  const heldRef = useRef(held);
  const stopsRef = useRef(stops);
  const spinningRef = useRef(false);
  const spinIdRef = useRef(0);
  betRef.current = bet;
  heldRef.current = held;
  stopsRef.current = stops;

  const releaseHolds = () => {
    heldRef.current = [false, false, false];
    setHeld([false, false, false]);
  };

  const stopAuto = () => {
    autoRef.current = 0;
    setAutoLeft(0);
    window.clearTimeout(gapTimer.current);
  };

  const flushRef = useRef<(announce: boolean) => void>(() => {});
  const spinRef = useRef<() => boolean>(() => false);

  flushRef.current = (announce) => {
    const owed = pending.current;
    if (!owed) return;
    pending.current = null;
    window.clearTimeout(timer.current);
    const back = owed.mult * owed.bet;
    useHouse.getState().settle("slots", owed.bet, back, owed.mult ? owed.label : "No line");
    releaseHolds();
    spinningRef.current = false;
    if (!announce) return;
    setSpinning(false);
    if (back > owed.bet) {
      setTone("win");
      setBanner(`${owed.label} · +${fmt(back - owed.bet)}`);
      playCue("win");
    } else if (back === owed.bet) {
      setTone("push");
      setBanner(`${owed.label} · stake back`);
      playCue("tick");
    } else {
      setTone("lose");
      setBanner(owed.label === "No line" ? "No line" : `${owed.label} · −${fmt(owed.bet - back)}`);
      playCue("lose");
    }
    if (autoRef.current > 1) {
      autoRef.current -= 1;
      setAutoLeft(autoRef.current);
      const gap = 100 + randInt(151);
      gapTimer.current = window.setTimeout(() => {
        if (autoRef.current <= 0) return;
        if (!spinRef.current()) stopAuto();
      }, gap);
    } else if (autoRef.current === 1) {
      stopAuto();
    }
  };

  spinRef.current = () => {
    if (spinningRef.current) return false;
    const locks = heldRef.current;
    if (locks.every(Boolean)) return false;
    const stake = betRef.current;
    if (!useHouse.getState().stake(stake)) return false;
    const current = stopsRef.current;
    const next = current.map((stop, reel) => (locks[reel] ? stop : randInt(REELS[reel]!.length)));
    const outcome = evaluateLine([
      REELS[0]![next[0]!]!,
      REELS[1]![next[1]!]!,
      REELS[2]![next[2]!]!,
    ]);
    const id = spinIdRef.current + 1;
    spinIdRef.current = id;
    pending.current = { id, bet: stake, mult: outcome.mult, label: outcome.label };
    stopsRef.current = next;
    setStops(next);
    setSpinId(id);
    spinningRef.current = true;
    setSpinning(true);
    setTone("idle");
    setBanner("Spinning");
    playCue("spin");
    const wait = reduced ? 40 : Math.max(...DURATION.filter((_, index) => !locks[index]), 400);
    timer.current = window.setTimeout(() => flushRef.current(true), wait + 40);
    return true;
  };

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      window.clearTimeout(gapTimer.current);
      flushRef.current(false);
    },
    [],
  );

  const line = stops.map((stop, reel) => REELS[reel]![stop]!) as [Lamp, Lamp, Lamp];
  const autoOn = autoLeft > 0;

  function startAuto(count: number) {
    if (autoRef.current) return;
    autoRef.current = count;
    setAutoLeft(count);
    if (spinningRef.current) return;
    if (!spinRef.current()) stopAuto();
  }

  function toggleHold(index: 0 | 1 | 2) {
    if (spinningRef.current) return;
    setHeld((prev) => {
      const next: [boolean, boolean, boolean] = [...prev];
      next[index] = !next[index];
      heldRef.current = next;
      return next;
    });
    playCue("tick");
  }

  return (
    <Console
      pid="01"
      unit="reel.fruit"
      title={tx("Fruit machine")}
      blurb={tx("Three reels, one line through the middle. Hold a reel and it stays for one spin only.")}
      live={spinning || autoOn}
    >
      <div className="term-stage p-3">
        <div className="grid grid-cols-3 gap-2" aria-busy={spinning}>
          {REELS.map((strip, index) => (
            <Reel
              key={index}
              strip={strip}
              stopIndex={stops[index] ?? 0}
              spinId={spinId}
              frozen={held[index] ?? false}
              duration={DURATION[index] ?? 1000}
              reduced={reduced}
            />
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          {spinning ? tx("Spinning") : line.map((lamp) => tx(lampName(lamp))).join(", ")}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {([0, 1, 2] as const).map((index) => (
            <GhostButton
              key={index}
              aria-pressed={held[index]}
              disabled={spinning}
              onClick={() => toggleHold(index)}
              className={held[index] ? "border-phosphor bg-phosphor/15 text-phosphor" : ""}
            >
              {tx(held[index] ? "Held" : "Hold")}
            </GhostButton>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <ResultLine text={banner} tone={tone} />
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-xs tracking-wide text-term-muted uppercase">{tx("Bet")}</p>
          <DenomPicker value={bet} onChange={setBet} denoms={BETS} disabled={spinning || autoOn} label="Bet size" />
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {autoOn ? (
            <GoldButton className="min-w-32 px-8" onClick={stopAuto}>
              {tx("Stop auto")} · {autoLeft}
            </GoldButton>
          ) : (
            <GoldButton
              className="min-w-32 px-8"
              disabled={spinning || held.every(Boolean) || chips < bet}
              onClick={() => spinRef.current()}
            >
              {spinning ? tx("Spinning") : `${tx("Spin ")}${fmt(bet)}`}
            </GoldButton>
          )}
          <div className="flex flex-wrap gap-2">
            {AUTO_SPINS.map((count) => (
              <GhostButton
                key={count}
                disabled={autoOn || spinning || held.every(Boolean) || chips < bet}
                onClick={() => startAuto(count)}
              >
                {tx(`${count} spins`)}
              </GhostButton>
            ))}
          </div>
        </div>
      </div>
      <BrokeRack />
      <RuleNote title="Paytable">
        <ul className="space-y-1">
          {PAYTABLE.map((row) => (
            <li key={row.label} className="flex justify-between gap-4">
              <span>{tx(row.label)}</span>
              <span className="num text-term-fg">{row.mult}×</span>
            </li>
          ))}
        </ul>
        <p>{tx("Only the center symbol of each reel counts. A hold lasts one spin, then every reel is free again.")}</p>
      </RuleNote>
    </Console>
  );
}
