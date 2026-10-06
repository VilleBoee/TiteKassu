import { useEffect, useRef, useState } from "react";
import { playCue } from "@/lib/casino/audio";
import { useHouse } from "@/lib/casino/bank";
import { randInt } from "@/lib/casino/rng";
import {
  betKey,
  cornersTouching,
  describeBet,
  isLegal,
  pocketColor,
  settleRoulette,
  sixesTouching,
  streetStart,
  wheelIndex,
  WHEEL,
  type BetKind,
  type PlacedBet,
} from "@/lib/casino/roulette";
import { Console, DenomPicker, GhostButton, GoldButton, ResultLine, RuleNote } from "./bits";
import { BrokeRack } from "./shell";
import { useI18n } from "@/lib/casino/i18n";
import { useReducedMotion } from "./use-reduced-motion";

const DENOMS = [10, 25, 100, 500] as const;
const CELL_W = 48;
const CELL_H = 46;
const ZERO_W = 48;
const STEP = 360 / 37;
const SPIN_MS = 20000;
const MODES = ["straight", "split", "street", "corner", "six"] as const;
type Mode = (typeof MODES)[number];

function landingRotation(current: number, n: number, ballAngle: number): number {
  const mid = wheelIndex(n) * STEP + STEP / 2;
  const desired = (((ballAngle - mid) % 360) + 360) % 360;
  let target = current + 360 * (14 + randInt(3));
  const mod = ((target % 360) + 360) % 360;
  target += (desired - mod + 360) % 360;
  return target;
}

/** Next ball angle. Several turns, and not back to the pointer at the top. */
function nextBallStop(current: number): number {
  const offset = 55 + randInt(250);
  const turns = 14 + randInt(4);
  const base = current - 360 * turns;
  const mod = ((base % 360) + 360) % 360;
  return base - ((mod - offset + 360) % 360);
}

function wedge(cx: number, cy: number, r: number, half: number): string {
  const a0 = ((-90 - half) * Math.PI) / 180;
  const a1 = ((-90 + half) * Math.PI) / 180;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  return `M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`;
}

function orderedSplit(a: number, b: number): BetKind {
  return { kind: "split", a: Math.min(a, b), b: Math.max(a, b) };
}

export function RouletteGame() {
  const reduced = useReducedMotion();
  const { tx, fmt } = useI18n();
  const chips = useHouse((s) => s.chips);
  const [denom, setDenom] = useState(25);
  const [bets, setBets] = useState<PlacedBet[]>([]);
  const [mode, setMode] = useState<Mode>("straight");
  const [pending, setPending] = useState<number | null>(null);
  const [choices, setChoices] = useState<{ label: string; bet: BetKind }[] | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(-STEP / 2);
  const [ball, setBall] = useState(0);
  const [winning, setWinning] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [banner, setBanner] = useState("Lay chips, then spin.");
  const [tone, setTone] = useState<"win" | "push" | "lose" | "idle">("idle");
  const betsRef = useRef(bets);
  const rotRef = useRef(rotation);
  const ballRef = useRef(ball);
  const owed = useRef<{ stake: number; back: number; note: string } | null>(null);
  const timer = useRef(0);
  betsRef.current = bets;
  rotRef.current = rotation;
  ballRef.current = ball;

  const flush = (announce: boolean) => {
    const due = owed.current;
    if (!due) return;
    owed.current = null;
    window.clearTimeout(timer.current);
    useHouse.getState().settle("roulette", due.stake, due.back, due.note);
    if (!announce) return;
    setSpinning(false);
    const net = due.back - due.stake;
    setBanner(net > 0 ? `${due.note} · +${fmt(net)}` : due.note);
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
  };

  useEffect(() => () => flush(false), []);

  const onTable = bets.reduce((sum, bet) => sum + bet.amount, 0);

  function add(bet: BetKind) {
    if (spinning || !isLegal(bet)) return;
    const prev = betsRef.current;
    const used = prev.reduce((sum, item) => sum + item.amount, 0);
    if (used + denom > useHouse.getState().chips) return;
    const key = betKey(bet);
    const index = prev.findIndex((item) => betKey(item.bet) === key);
    const next = prev.slice();
    if (index >= 0) next[index] = { bet, amount: next[index]!.amount + denom };
    else next.push({ bet, amount: denom });
    betsRef.current = next;
    setBets(next);
    playCue("chip");
  }

  function remove(key: string) {
    if (spinning) return;
    const next = betsRef.current.filter((item) => betKey(item.bet) !== key);
    betsRef.current = next;
    setBets(next);
  }

  function clear() {
    if (spinning) return;
    betsRef.current = [];
    setBets([]);
    setPending(null);
    setChoices(null);
  }

  function onNumber(n: number) {
    if (spinning) return;
    if (mode === "straight" || n === 0) {
      add({ kind: "straight", n });
      return;
    }
    if (mode === "street") {
      const start = streetStart(n);
      if (start) add({ kind: "street", start });
      return;
    }
    if (mode === "split") {
      if (pending == null) {
        setPending(n);
        return;
      }
      if (pending === n) {
        setPending(null);
        return;
      }
      const bet = orderedSplit(pending, n);
      if (isLegal(bet)) add(bet);
      else setBanner("Those two don't share an edge.");
      setPending(null);
      return;
    }
    if (mode === "corner") {
      const lows = cornersTouching(n);
      if (lows.length === 1) add({ kind: "corner", low: lows[0]! });
      else setChoices(lows.map((low) => ({ label: describeBet({ kind: "corner", low }), bet: { kind: "corner", low } })));
      return;
    }
    const starts = sixesTouching(n);
    if (starts.length === 1) add({ kind: "six", start: starts[0]! });
    else setChoices(starts.map((start) => ({ label: describeBet({ kind: "six", start }), bet: { kind: "six", start } })));
  }

  function spin() {
    if (spinning) return;
    const layout = betsRef.current;
    const stake = layout.reduce((sum, bet) => sum + bet.amount, 0);
    if (stake <= 0 || !useHouse.getState().stake(stake)) return;
    const n = randInt(37);
    const result = settleRoulette(layout, n);
    owed.current = { stake: result.stake, back: result.returned, note: result.note };
    setSpinning(true);
    setTone("idle");
    setBanner("No more bets");
    setChoices(null);
    setPending(null);
    playCue("spin");
    const nextBall = nextBallStop(ballRef.current);
    const ballAngle = ((nextBall % 360) + 360) % 360;
    ballRef.current = nextBall;
    setBall(nextBall);
    const nextRot = landingRotation(rotRef.current, n, ballAngle);
    rotRef.current = nextRot;
    setRotation(nextRot);
    timer.current = window.setTimeout(() => {
      setWinning(n);
      setHistory((prev) => [n, ...prev].slice(0, 16));
      flush(true);
    }, reduced ? 40 : SPIN_MS + 80);
  }

  const straightOf = (n: number) => bets.find((item) => item.bet.kind === "straight" && item.bet.n === n)?.amount ?? 0;

  return (
    <Console
      pid="03"
      unit="wheel.roulette"
      title={tx("Roulette")}
      blurb={tx("European wheel, thirty-seven pockets. Even-money bets lose on zero.")}
      live={spinning}
    >
      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="relative mx-auto w-full max-w-xs">
            <svg viewBox="0 0 320 320" className="w-full" role="img" aria-label={winning == null ? tx("Roulette wheel") : `${tx("Landed on ")}${winning}`}>
              <g
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: "160px 160px",
                  transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.07, 0.72, 0.04, 1)` : "none",
                }}
              >
                {WHEEL.map((n, index) => {
                  const color = pocketColor(n);
                  const fill = color === "red" ? "var(--color-crimson)" : color === "green" ? "var(--color-felt)" : "var(--color-ink)";
                  return (
                    <g key={n} transform={`rotate(${index * STEP + STEP / 2} 160 160)`}>
                      <path d={wedge(160, 160, 148, STEP / 2)} fill={fill} stroke="var(--color-gold-dim)" strokeWidth="0.6" />
                      <text x="160" y="30" textAnchor="middle" fill="var(--color-ivory)" fontSize="11" fontFamily="Outfit, sans-serif">
                        {n}
                      </text>
                    </g>
                  );
                })}
                <circle cx="160" cy="160" r="78" fill="var(--color-felt-deep)" stroke="var(--color-gold-dim)" />
                <circle cx="160" cy="160" r="18" fill="var(--color-gold)" />
              </g>
            </svg>
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                transform: `rotate(${ball}deg)`,
                transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.45, 0.02, 1)` : "none",
              }}
            >
              <span className="absolute top-3 left-1/2 size-3.5 -translate-x-1/2 rounded-full border border-gold-dim bg-ivory" />
            </div>
          </div>
          <div className="mt-3 flex gap-1 overflow-x-auto" aria-label={tx("Recent numbers")}>
            {history.map((n, index) => {
              const color = pocketColor(n);
              const toneClass = color === "red" ? "bg-crimson text-ivory" : color === "green" ? "bg-felt text-ivory" : "bg-ink text-ivory border border-line";
              return (
                <span key={`${n}-${index}`} className={`num inline-flex h-8 min-w-8 items-center justify-center rounded-full px-1.5 text-sm ${toneClass}`}>
                  {n}
                </span>
              );
            })}
          </div>
        </div>
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2" role="radiogroup" aria-label={tx("Inside bet")}>
            {MODES.map((item) => (
              <button
                key={item}
                type="button"
                role="radio"
                aria-checked={mode === item}
                disabled={spinning}
                onClick={() => {
                  setMode(item);
                  setPending(null);
                  setChoices(null);
                }}
                className={`min-h-11 rounded-md px-4 text-sm capitalize disabled:opacity-40 ${mode === item ? "bg-phosphor text-phosphor-ink" : "border border-term-line bg-term-elev text-term-fg"}`}
              >
                {tx(item === "six" ? "Line" : item)}
              </button>
            ))}
          </div>
          <p className="mb-2 text-sm text-term-muted">
            {mode === "straight" && tx("Tap a number for a straight-up bet.")}
            {mode === "split" && (pending == null ? tx("Tap the first number of a split.") : `${tx("Now a neighbor of ")}${pending}.`)}
            {mode === "street" && tx("Tap any number to bet its street of three.")}
            {mode === "corner" && tx("Tap a number, then choose the corner.")}
            {mode === "six" && tx("Tap a number, then choose the six-line.")}
          </p>
          <div className="max-w-full overflow-x-auto rounded-md border border-line">
            <div className="relative bg-felt-deep" style={{ width: ZERO_W + 12 * CELL_W + 56, height: CELL_H * 3 }}>
              <button
                type="button"
                disabled={spinning}
                onClick={() => add({ kind: "straight", n: 0 })}
                className={`absolute flex items-center justify-center rounded-sm bg-felt text-sm font-semibold text-ivory ${winning === 0 ? "ring-2 ring-gold" : ""} ${straightOf(0) ? "outline outline-2 outline-gold" : ""}`}
                style={{ left: 2, top: 2, width: ZERO_W - 6, height: CELL_H * 3 - 4 }}
              >
                0
              </button>
              {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => {
                const col = Math.ceil(n / 3);
                const level = (n - 1) % 3;
                const row = 2 - level;
                const color = pocketColor(n);
                const toneClass = color === "red" ? "bg-crimson text-ivory" : "bg-ink text-ivory";
                return (
                  <button
                    key={n}
                    type="button"
                    disabled={spinning}
                    onClick={() => onNumber(n)}
                    className={`absolute flex items-center justify-center rounded-sm text-sm font-semibold disabled:opacity-80 ${toneClass} ${winning === n ? "ring-2 ring-gold" : ""} ${pending === n ? "outline outline-2 outline-ivory" : ""} ${straightOf(n) ? "outline outline-2 outline-gold" : ""}`}
                    style={{ left: ZERO_W + (col - 1) * CELL_W + 1, top: row * CELL_H + 1, width: CELL_W - 2, height: CELL_H - 2 }}
                  >
                    {n}
                  </button>
                );
              })}
              {([3, 2, 1] as const).map((column, row) => (
                <button
                  key={column}
                  type="button"
                  disabled={spinning}
                  onClick={() => add({ kind: "column", c: column })}
                  className="absolute flex items-center justify-center rounded-sm bg-felt text-sm font-semibold text-ivory"
                  style={{ left: ZERO_W + 12 * CELL_W + 2, top: row * CELL_H + 1, width: 50, height: CELL_H - 2 }}
                >
                  2:1
                </button>
              ))}
            </div>
          </div>
          {choices ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {choices.map((choice) => (
                <GhostButton
                  key={choice.label}
                  onClick={() => {
                    add(choice.bet);
                    setChoices(null);
                  }}
                >
                  {tx(choice.label)}
                </GhostButton>
              ))}
              <GhostButton onClick={() => setChoices(null)}>{tx("Cancel")}</GhostButton>
            </div>
          ) : null}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Outside label="1st 12" bet={{ kind: "dozen", d: 1 }} bets={bets} spinning={spinning} onAdd={add} />
            <Outside label="2nd 12" bet={{ kind: "dozen", d: 2 }} bets={bets} spinning={spinning} onAdd={add} />
            <Outside label="3rd 12" bet={{ kind: "dozen", d: 3 }} bets={bets} spinning={spinning} onAdd={add} />
            <Outside label="Column 1" bet={{ kind: "column", c: 1 }} bets={bets} spinning={spinning} onAdd={add} />
            <Outside label="Column 2" bet={{ kind: "column", c: 2 }} bets={bets} spinning={spinning} onAdd={add} />
            <Outside label="Column 3" bet={{ kind: "column", c: 3 }} bets={bets} spinning={spinning} onAdd={add} />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Outside label="1–18" bet={{ kind: "low" }} bets={bets} spinning={spinning} onAdd={add} />
            <Outside label="Even" bet={{ kind: "even" }} bets={bets} spinning={spinning} onAdd={add} />
            <Outside label="Red" bet={{ kind: "red" }} bets={bets} spinning={spinning} onAdd={add} hot="red" />
            <Outside label="Black" bet={{ kind: "black" }} bets={bets} spinning={spinning} onAdd={add} hot="black" />
            <Outside label="Odd" bet={{ kind: "odd" }} bets={bets} spinning={spinning} onAdd={add} />
            <Outside label="19–36" bet={{ kind: "high" }} bets={bets} spinning={spinning} onAdd={add} />
          </div>
        </div>
      </div>
      <div className="mt-5">
        <ResultLine text={banner} tone={tone} />
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-xs tracking-wide text-term-muted uppercase">{tx("Chip")} · {tx("Bet")} {fmt(onTable)}</p>
          <DenomPicker value={denom} onChange={setDenom} denoms={DENOMS} disabled={spinning} />
        </div>
        <div className="flex flex-wrap gap-2">
          <GhostButton disabled={spinning || bets.length === 0} onClick={clear}>
            {tx("Clear")}
          </GhostButton>
          <GoldButton disabled={spinning || onTable === 0 || chips < onTable} onClick={spin}>
            {spinning ? tx("Spinning") : tx("Spin ")}
          </GoldButton>
        </div>
      </div>
      {bets.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {bets.map((item) => {
            const key = betKey(item.bet);
            return (
              <li key={key} className="flex items-center justify-between gap-3 border-t border-term-line pt-2 text-sm">
                <span>{tx(describeBet(item.bet))}</span>
                <span className="flex items-center gap-3">
                  <span className="num text-phosphor">{fmt(item.amount)}</span>
                  <button type="button" className="min-h-11 px-2 text-term-muted" disabled={spinning} onClick={() => remove(key)}>
                    {tx("Remove")}
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
      <BrokeRack />
      <RuleNote title="Payouts">
        <p>{tx("Straight 35 to 1. Split 17 to 1. Street 11 to 1. Corner 8 to 1. Six-line 5 to 1. Dozens and columns 2 to 1. Red, black, odd, even, and halves pay 1 to 1, and lose if the ball finds zero.")}</p>
        <p>{tx("Column 1 is 1, 4, 7… Column 2 is 2, 5, 8… Column 3 is 3, 6, 9…")}</p>
      </RuleNote>
    </Console>
  );
}

function Outside({
  label,
  bet,
  bets,
  spinning,
  onAdd,
  hot,
}: {
  label: string;
  bet: BetKind;
  bets: PlacedBet[];
  spinning: boolean;
  onAdd: (bet: BetKind) => void;
  hot?: "red" | "black";
}) {
  const amount = bets.find((item) => betKey(item.bet) === betKey(bet))?.amount ?? 0;
  const { tx, fmt } = useI18n();
  const tone = hot === "red" ? "bg-crimson text-ivory" : hot === "black" ? "border border-line bg-ink text-ivory" : "bg-felt text-ivory";
  return (
    <button type="button" disabled={spinning} onClick={() => onAdd(bet)} className={`min-h-8 rounded-md px-1.5 py-0.5 text-sm disabled:opacity-40 ${tone}`}>
      <span className="block">{tx(label)}</span>
      {amount > 0 ? <span className="num block text-ivory">{fmt(amount)}</span> : null}
    </button>
  );
}
