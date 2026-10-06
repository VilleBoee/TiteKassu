import { useEffect, useRef, useState } from "react";
import { playCue } from "@/lib/casino/audio";
import { useHouse } from "@/lib/casino/bank";
import { useI18n, type CopyKey } from "@/lib/casino/i18n";
import { randInt } from "@/lib/casino/rng";
import { resolveSpin, waysFor, type Cell, type Frame, type Sym } from "@/lib/casino/segfault";
import { Console, DenomPicker, GhostButton, GoldButton, ResultLine, RuleNote } from "./bits";
import { BrokeRack } from "./shell";
import { useReducedMotion } from "./use-reduced-motion";

const BETS = [10, 25, 50, 100] as const;
const AUTO = [10, 25, 50, 100] as const;

const PAY_ROWS: { key: CopyKey; sym: Sym }[] = [
  { key: "sfPayBit", sym: "bit" },
  { key: "sfPayPing", sym: "ping" },
  { key: "sfPayHash", sym: "hash" },
  { key: "sfPayLink", sym: "link" },
  { key: "sfPayLock", sym: "lock" },
  { key: "sfPayChip", sym: "chip" },
  { key: "sfPayRack", sym: "rack" },
  { key: "sfPayCore", sym: "core" },
];

const IDLE: Sym[][] = [
  ["nop", "nop", "nop", "hash", "nop", "bit"],
  ["nop", "nop", "nop", "nop", "link", "ping"],
  ["nop", "nop", "nop", "lock", "nop", "nop"],
  ["nop", "nop", "nop", "nop", "chip", "lock"],
  ["nop", "nop", "nop", "rack", "nop", "bug"],
  ["nop", "nop", "nop", "nop", "core", "root"],
];

const GLYPH: Record<Sym, string> = {
  bit: "💠",
  ping: "📡",
  hash: "🔶",
  link: "🔗",
  lock: "🔒",
  chip: "💻",
  rack: "🗄️",
  core: "💎",
  bug: "🐞",
  root: "🐚",
  nop: "·",
};

function Glyph({ sym }: { sym: Sym }) {
  return (
    <span className={`sf-glyph leading-none select-none ${sym === "nop" ? "text-ivory/35" : ""}`} role="img" aria-label={sym}>
      {GLYPH[sym]}
    </span>
  );
}

function beat(frame: Frame, reduced: boolean): number {
  if (reduced) return 80;
  if (frame.kind === "mine") return 1200;
  if (frame.kind === "blast" || frame.kind === "shell") return 1080;
  if (frame.kind === "win") return 960;
  if (frame.banner === "open") return 840;
  return 720;
}

function veilFor(frame: Frame | undefined): string {
  if (!frame) return "";
  if (frame.banner === "cap") return "sf-veil-cap";
  if (frame.kind === "blast") return "sf-veil-blast";
  if (frame.kind === "mine") return "sf-veil-mine";
  if (frame.mode === "shell") return "sf-veil-shell";
  if (frame.kind === "win") return "sf-veil-win";
  if (frame.banner === "open") return "sf-veil-open";
  return "";
}

function tone(sym: Sym): string {
  if (sym === "bug") return "border-crimson bg-crimson/25 text-ivory";
  if (sym === "root") return "border-phosphor bg-phosphor/15 text-phosphor";
  if (sym === "nop") return "border-term-line bg-ink/50 text-ivory/40";
  if (sym === "core" || sym === "rack") return "border-phosphor/60 bg-ink/35 text-phosphor";
  if (sym === "chip" || sym === "lock" || sym === "link") return "border-line bg-ink/35 text-ivory";
  return "border-line bg-ink/35 text-ivory/80";
}

export function SegfaultGame() {
  const reduced = useReducedMotion();
  const { t, tx, fmt } = useI18n();
  const chips = useHouse((s) => s.chips);
  const [bet, setBet] = useState(25);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [cursor, setCursor] = useState(0);
  const [running, setRunning] = useState(false);
  const [banner, setBanner] = useState<Frame["banner"]>("idle");
  const [bannerN, setBannerN] = useState(3);
  const [toneName, setToneName] = useState<"win" | "push" | "lose" | "idle">("idle");
  const [autoLeft, setAutoLeft] = useState(0);
  const owed = useRef<{ stake: number; back: number; note: string } | null>(null);
  const autoRef = useRef(0);
  const gapTimer = useRef(0);
  const betRef = useRef(bet);
  const runningRef = useRef(false);
  betRef.current = bet;

  const stopAuto = () => {
    autoRef.current = 0;
    setAutoLeft(0);
    window.clearTimeout(gapTimer.current);
  };

  const runRef = useRef<() => boolean>(() => false);
  const flushRef = useRef<(announce: boolean) => void>(() => {});

  flushRef.current = (announce: boolean) => {
    const due = owed.current;
    if (!due) return;
    owed.current = null;
    runningRef.current = false;
    useHouse.getState().settle("segfault", due.stake, due.back, due.note);
    if (!announce) return;
    setRunning(false);
    if (due.back > due.stake) {
      setToneName("win");
      playCue("win");
    } else if (due.back === due.stake) {
      setToneName("push");
      playCue("tick");
    } else {
      setToneName("lose");
      playCue("lose");
    }
    if (autoRef.current > 1) {
      autoRef.current -= 1;
      setAutoLeft(autoRef.current);
      const gap = 100 + randInt(151);
      gapTimer.current = window.setTimeout(() => {
        if (autoRef.current <= 0) return;
        if (!runRef.current()) stopAuto();
      }, gap);
    } else if (autoRef.current === 1) {
      stopAuto();
    }
  };

  runRef.current = () => {
    if (runningRef.current) return false;
    const stake = betRef.current;
    if (!useHouse.getState().stake(stake)) return false;
    const script = resolveSpin(stake);
    const total = script[script.length - 1]?.total ?? 0;
    const shell = script.some((frame) => frame.mode === "shell");
    owed.current = { stake, back: total, note: shell ? "Root shell" : "Segfault" };
    runningRef.current = true;
    setFrames(script);
    setCursor(0);
    setToneName("idle");
    setBanner("idle");
    setBannerN(3);
    setRunning(true);
    playCue("spin");
    return true;
  };

  function startAuto(count: number) {
    if (autoRef.current || runningRef.current) return;
    autoRef.current = count;
    setAutoLeft(count);
    if (!runRef.current()) stopAuto();
  }

  useEffect(
    () => () => {
      window.clearTimeout(gapTimer.current);
      autoRef.current = 0;
      flushRef.current(false);
    },
    [],
  );

  useEffect(() => {
    if (!running) return;
    const frame = frames[cursor];
    if (!frame) return;
    setBanner(frame.banner);
    setBannerN(frame.kind === "done" ? frame.total : frame.bannerN);
    if (frame.banner === "win" || frame.banner === "shellWin" || frame.banner === "cap") setToneName("win");
    else if (cursor < frames.length - 1) setToneName("idle");
    if (frame.kind === "blast" || frame.kind === "mine" || frame.banner === "open") playCue("tick");
    else if (frame.kind === "shell") playCue("chip");
    if (cursor >= frames.length - 1) {
      flushRef.current(true);
      return;
    }
    const id = window.setTimeout(() => setCursor((value) => value + 1), beat(frame, reduced));
    return () => window.clearTimeout(id);
  }, [running, cursor, frames, reduced]);

  function run() {
    if (autoRef.current) return;
    runRef.current();
  }

  const autoOn = autoLeft > 0;

  const frame = frames[cursor];
  const prev = cursor > 0 ? frames[cursor - 1] : undefined;
  const lit = new Set((frame?.lit ?? []).map((hit) => `${hit.c}:${hit.r}`));
  const veil = reduced ? "" : veilFor(frame);
  const line =
    banner === "win"
      ? t("sfWin", { n: fmt(bannerN) })
      : banner === "blast"
        ? t("sfBlast", { n: bannerN })
        : banner === "mine"
          ? t("sfMine")
          : banner === "shell"
            ? t("sfShell", { n: bannerN })
            : banner === "shellWin"
              ? t("sfShellWin", { n: fmt(bannerN) })
              : banner === "cap"
                ? t("sfCap", { n: fmt(bannerN) })
              : banner === "none"
                ? t("sfNone")
                : banner === "open"
                  ? t("sfOpen", { n: bannerN })
                  : t("sfIdle");

  return (
    <Console pid="05" unit="rack.segfault" title={t("gameSegfault")} blurb={t("sfIntro")} live={running || autoOn}>
      <div className="term-stage sf-fit relative overflow-hidden p-2">
        {veil ? <div key={cursor} className={`sf-veil ${veil}`} aria-hidden /> : null}
        <div className="relative mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-xs tracking-wide text-term-muted uppercase">
          <span>{t("sfRows", { n: frame?.open ?? 3 })}</span>
          <span key={frame?.mult ?? 1} className={`num text-phosphor ${frame && frame.mult > 1 && frame.kind === "blast" ? "sf-mult" : ""}`}>
            {t("sfMult", { n: frame?.mult ?? 1 })}
          </span>
          <span className="num text-phosphor">{t("sfWays", { n: fmt(waysFor(frame?.open ?? 3)) })}</span>
        </div>
        <div className="mb-2 grid grid-cols-6 gap-1 text-center font-mono text-xs tracking-widest text-term-muted">
          {Array.from({ length: 6 }, (_, c) => (
            <span key={c}>0{c + 1}</span>
          ))}
        </div>
        <div className="relative grid grid-cols-6 gap-1" aria-busy={running}>
          {Array.from({ length: 6 }, (_, c) => (
            <div key={c} className="grid gap-1">
              {Array.from({ length: 6 }, (_, r) => {
                if (frame?.mode === "shell" && r < 3) return <div key={r} className="h-2" />;
                const cell: Cell = frame?.grid[c]?.[r] ?? { sym: IDLE[c]?.[r] ?? "nop" };
                const locked = frame?.mode !== "shell" && r < 6 - (frame?.open ?? 3);
                const wasLocked = Boolean(prev && prev.mode !== "shell" && frame?.mode !== "shell" && r < 6 - prev.open);
                const on = lit.has(`${c}:${r}`);
                let fx = "";
                if (!reduced && frame && !locked) {
                  if (frame.kind === "blast" && on) fx = "sf-blast";
                  else if (frame.kind === "mine" && on) fx = "sf-mine";
                  else if ((frame.kind === "win" || frame.banner === "cap") && on) fx = "sf-win";
                  else if (frame.kind === "shell" && (cell.cash || cell.sym === "root")) fx = cell.hot ? "sf-hot" : "sf-pop";
                  else if (wasLocked) fx = "sf-unlock";
                  else if (frame.kind === "drop") fx = "sf-fall";
                }
                const ring = frame?.kind === "blast" && on ? "ring-2 ring-crimson" : on ? "ring-2 ring-phosphor" : "";
                return (
                  <div
                    key={fx ? `${cursor}-${r}` : r}
                    className={`sf-cell relative flex aspect-square items-center justify-center rounded-sm border ${locked ? "border-term-line bg-ink/70" : tone(cell.sym)} ${ring} ${cell.hot ? "ring-2 ring-ivory" : ""} ${fx}`}
                    style={fx ? { animationDelay: `${c * 28 + (5 - r) * 16}ms` } : undefined}
                  >
                    {locked ? <span className="h-px w-5 bg-term-muted" /> : cell.cash ? (
                      <span className="num text-xs leading-none">{cell.cash}</span>
                    ) : (
                      <Glyph sym={cell.sym} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {frame?.mode === "shell" ? (
          <p key={frame.shellLeft} className="relative mt-2 text-center font-mono text-xs tracking-wide text-phosphor uppercase sf-mult">
            {t("sfShell", { n: frame.shellLeft ?? 0 })}
          </p>
        ) : null}
      </div>
      <div className="mt-3">
        <ResultLine text={line} tone={toneName} />
      </div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 font-mono text-xs tracking-wide text-term-muted uppercase">{t("betSize")}</p>
          <DenomPicker value={bet} onChange={setBet} denoms={BETS} disabled={running || autoOn} label="Bet size" />
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {autoOn ? (
            <GoldButton className="min-w-32 px-8" onClick={stopAuto}>
              {tx("Stop auto")} · {autoLeft}
            </GoldButton>
          ) : (
            <GoldButton className="min-w-32 px-8" disabled={running || chips < bet} onClick={run}>
              {running ? t("sfRunning") : t("sfRun", { n: fmt(bet) })}
            </GoldButton>
          )}
          <div className="flex flex-wrap gap-2">
            {AUTO.map((count) => (
              <GhostButton key={count} disabled={autoOn || running || chips < bet} onClick={() => startAuto(count)}>
                {tx(`${count} spins`)}
              </GhostButton>
            ))}
          </div>
        </div>
      </div>
      <BrokeRack />
      <RuleNote title="House rules">
        <p>{t("sfRules1")}</p>
        <p>{t("sfRules2")}</p>
        <p>{t("sfRules3")}</p>
        <ul className="space-y-1">
          {PAY_ROWS.map((row) => (
            <li key={row.sym}>{t(row.key)}</li>
          ))}
        </ul>
      </RuleNote>
    </Console>
  );
}
