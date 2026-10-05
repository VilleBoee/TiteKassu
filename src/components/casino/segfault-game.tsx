import { useEffect, useRef, useState } from "react";
import { playCue } from "@/lib/casino/audio";
import { useHouse } from "@/lib/casino/bank";
import { useI18n, type CopyKey } from "@/lib/casino/i18n";
import { resolveSpin, waysFor, type Cell, type Frame, type Sym } from "@/lib/casino/segfault";
import { Console, DenomPicker, GoldButton, ResultLine, RuleNote } from "./bits";
import { BrokeRack } from "./shell";
import { useReducedMotion } from "./use-reduced-motion";

const BETS = [10, 25, 50, 100] as const;

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
    <span className={`leading-none select-none ${sym === "nop" ? "text-lg text-ivory/35" : "text-3xl"}`} role="img" aria-label={sym}>
      {GLYPH[sym]}
    </span>
  );
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
  const { t, fmt } = useI18n();
  const chips = useHouse((s) => s.chips);
  const [bet, setBet] = useState(25);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [cursor, setCursor] = useState(0);
  const [running, setRunning] = useState(false);
  const [banner, setBanner] = useState<Frame["banner"]>("idle");
  const [bannerN, setBannerN] = useState(3);
  const [toneName, setToneName] = useState<"win" | "push" | "lose" | "idle">("idle");
  const owed = useRef<{ stake: number; back: number; note: string } | null>(null);

  const flush = (announce: boolean) => {
    const due = owed.current;
    if (!due) return;
    owed.current = null;
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
  };

  useEffect(() => () => flush(false), []);

  useEffect(() => {
    if (!running) return;
    const frame = frames[cursor];
    if (!frame) return;
    setBanner(frame.banner);
    setBannerN(frame.kind === "done" ? frame.total : frame.bannerN);
    if (frame.banner === "win" || frame.banner === "shellWin" || frame.banner === "cap") setToneName("win");
    else if (cursor < frames.length - 1) setToneName("idle");
    if (cursor >= frames.length - 1) {
      flush(true);
      return;
    }
    const id = window.setTimeout(() => setCursor((value) => value + 1), reduced ? 70 : 480);
    return () => window.clearTimeout(id);
  }, [running, cursor, frames, reduced]);

  function run() {
    if (running) return;
    if (!useHouse.getState().stake(bet)) return;
    const script = resolveSpin(bet);
    const total = script[script.length - 1]?.total ?? 0;
    const shell = script.some((frame) => frame.mode === "shell");
    owed.current = { stake: bet, back: total, note: shell ? "Root shell" : "Segfault" };
    setFrames(script);
    setCursor(0);
    setToneName("idle");
    setBanner("idle");
    setBannerN(3);
    setRunning(true);
    playCue("spin");
  }

  const frame = frames[cursor];
  const lit = new Set((frame?.lit ?? []).map((hit) => `${hit.c}:${hit.r}`));
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
    <Console pid="05" unit="rack.segfault" title={t("gameSegfault")} blurb={t("sfIntro")} live={running}>
      <div className="term-stage p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 font-mono text-xs tracking-wide text-term-muted uppercase">
          <span>{t("sfRows", { n: frame?.open ?? 3 })}</span>
          <span className="num text-phosphor">{t("sfWays", { n: fmt(waysFor(frame?.open ?? 3)) })}</span>
          <span>{t("sfMult", { n: frame?.mult ?? 1 })}</span>
        </div>
        <div className="mb-2 grid grid-cols-6 gap-1 text-center font-mono text-xs tracking-widest text-term-muted">
          {Array.from({ length: 6 }, (_, c) => (
            <span key={c}>0{c + 1}</span>
          ))}
        </div>
        <div className="grid grid-cols-6 gap-1" aria-busy={running}>
          {Array.from({ length: 6 }, (_, c) => (
            <div key={c} className="grid gap-1">
              {Array.from({ length: 6 }, (_, r) => {
                if (frame?.mode === "shell" && r < 3) return <div key={r} className="h-2" />;
                const cell: Cell = frame?.grid[c]?.[r] ?? { sym: IDLE[c]?.[r] ?? "nop" };
                const locked = frame?.mode !== "shell" && r < 6 - (frame?.open ?? 3);
                const on = lit.has(`${c}:${r}`);
                const falling = Boolean(frame && frame.kind === "drop" && !locked);
                const ring = frame?.kind === "blast" && on ? "ring-2 ring-crimson" : on ? "ring-2 ring-phosphor" : "";
                return (
                  <div
                    key={`${cursor}-${r}`}
                    className={`relative flex aspect-square items-center justify-center rounded-sm border ${locked ? "border-term-line bg-ink/70" : tone(cell.sym)} ${ring} ${cell.hot ? "ring-2 ring-ivory" : ""} ${falling ? "sf-fall" : ""}`}
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
          <p className="mt-2 text-center font-mono text-xs tracking-wide text-phosphor uppercase">{t("sfShell", { n: frame.shellLeft ?? 0 })}</p>
        ) : null}
      </div>
      <div className="mt-5">
        <ResultLine text={line} tone={toneName} />
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-xs tracking-wide text-term-muted uppercase">{t("betSize")}</p>
          <DenomPicker value={bet} onChange={setBet} denoms={BETS} disabled={running} label="Bet size" />
        </div>
        <GoldButton className="min-w-32 px-8" disabled={running || chips < bet} onClick={run}>
          {running ? t("sfRunning") : t("sfRun", { n: fmt(bet) })}
        </GoldButton>
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
