import { useEffect, useMemo, useRef, useState } from "react";
import { playCue } from "@/lib/casino/audio";
import { useHouse } from "@/lib/casino/bank";
import { randInt } from "@/lib/casino/rng";
import { evaluateLine, lampName, PAYTABLE, REELS, type Lamp } from "@/lib/casino/slots";
import { DenomPicker, GhostButton, GoldButton, LampMark, ResultLine, RuleNote } from "./bits";
import { BrokeRack } from "./shell";
import { useI18n } from "@/lib/casino/i18n";
import { useReducedMotion } from "./use-reduced-motion";

const REEL_H = 92;
const LOOPS = 5;
const DURATION = [1100, 1600, 2100];
const BETS = [5, 10, 25, 50, 100] as const;

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
      <div className="pointer-events-none absolute inset-x-0 bg-gold/10" style={{ top: REEL_H, height: REEL_H }} />
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
  const pending = useRef<{ id: number; bet: number; mult: number; label: string } | null>(null);
  const timer = useRef(0);

  const flush = (announce: boolean) => {
    const owed = pending.current;
    if (!owed) return;
    pending.current = null;
    window.clearTimeout(timer.current);
    const back = owed.mult * owed.bet;
    useHouse.getState().settle("slots", owed.bet, back, owed.mult ? owed.label : "No line");
    if (!announce) return;
    setSpinning(false);
    if (back > owed.bet) {
      setTone("win");
      setBanner(`${owed.label} · +${fmt(back - owed.bet)}`);
      setHeld([false, false, false]);
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
  };

  useEffect(() => () => flush(false), []);

  const line = stops.map((stop, reel) => REELS[reel]![stop]!) as [Lamp, Lamp, Lamp];

  function spin() {
    if (spinning) return;
    if (held.every(Boolean)) return;
    if (!useHouse.getState().stake(bet)) return;
    const next = stops.map((stop, reel) => (held[reel] ? stop : randInt(REELS[reel]!.length)));
    const outcome = evaluateLine([
      REELS[0]![next[0]!]!,
      REELS[1]![next[1]!]!,
      REELS[2]![next[2]!]!,
    ]);
    const id = spinId + 1;
    pending.current = { id, bet, mult: outcome.mult, label: outcome.label };
    setStops(next);
    setSpinId(id);
    setSpinning(true);
    setTone("idle");
    setBanner("Spinning");
    playCue("spin");
    const wait = reduced ? 40 : Math.max(...DURATION.filter((_, index) => !held[index]), 400);
    timer.current = window.setTimeout(() => flush(true), wait + 40);
  }

  function toggleHold(index: 0 | 1 | 2) {
    if (spinning) return;
    setHeld((prev) => {
      const next: [boolean, boolean, boolean] = [...prev];
      next[index] = !next[index];
      return next;
    });
    playCue("tick");
  }

  return (
    <div>
      <p className="text-xs tracking-[0.2em] text-accent uppercase">{tx("Lamp")}</p>
      <h1 className="mt-1 font-display text-5xl leading-none">{tx("Fruit machine")}</h1>
      <p className="mt-3 max-w-prose text-muted">{tx("Three reels, one line through the middle. Hold a reel and it sits for the next paid spin.")}</p>
      <div className="mt-6 rounded-card border border-gold-dim bg-panel p-3">
        <div className="felt-surface grid grid-cols-3 gap-2 rounded-md p-2" aria-busy={spinning}>
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
              cabinet
              aria-pressed={held[index]}
              disabled={spinning}
              onClick={() => toggleHold(index)}
              className={held[index] ? "border-gold text-gold" : ""}
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
          <p className="mb-2 text-xs tracking-wide text-muted uppercase">{tx("Bet")}</p>
          <DenomPicker value={bet} onChange={setBet} denoms={BETS} disabled={spinning} label="Bet size" />
        </div>
        <GoldButton className="min-w-32 px-8" disabled={spinning || held.every(Boolean) || chips < bet} onClick={spin}>
          {spinning ? tx("Spinning") : `${tx("Spin ")}${fmt(bet)}`}
        </GoldButton>
      </div>
      <BrokeRack />
      <RuleNote title="Paytable">
        <ul className="space-y-1">
          {PAYTABLE.map((row) => (
            <li key={row.label} className="flex justify-between gap-4">
              <span>{tx(row.label)}</span>
              <span className="num text-fg">{row.mult}×</span>
            </li>
          ))}
        </ul>
        <p>{tx("Only the center symbol of each reel counts. Holds clear after a win that beats the stake.")}</p>
      </RuleNote>
    </div>
  );
}
