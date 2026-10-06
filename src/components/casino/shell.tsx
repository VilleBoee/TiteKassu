import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Moon, ScrollText, Sun, Volume2, VolumeX } from "lucide-react";
import { playCue, setMuted, unlockAudio } from "@/lib/casino/audio";
import { BUY_IN, useHouse, type GameId } from "@/lib/casino/bank";
import { useI18n } from "@/lib/casino/i18n";
import { usePrefs } from "@/lib/casino/prefs";

const VERSION = "v0.1.5";

const NAV: { to: "/" | "/slots" | "/blackjack" | "/roulette" | "/poker" | "/segfault"; key: "navSlots" | "navBlackjack" | "navRoulette" | "navPoker" | "navSegfault" }[] = [
  { to: "/slots", key: "navSlots" },
  { to: "/blackjack", key: "navBlackjack" },
  { to: "/roulette", key: "navRoulette" },
  { to: "/poker", key: "navPoker" },
  { to: "/segfault", key: "navSegfault" },
];

const GAME_KEY: Record<GameId, "gameSlots" | "gameBlackjack" | "gameRoulette" | "gamePoker" | "gameSegfault" | "gameHouse"> = {
  slots: "gameSlots",
  blackjack: "gameBlackjack",
  roulette: "gameRoulette",
  poker: "gamePoker",
  segfault: "gameSegfault",
  house: "gameHouse",
};

export function HouseShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const chips = useHouse((s) => s.chips);
  const sound = useHouse((s) => s.sound);
  const hydrated = useHouse((s) => s.hydrated);
  const hydrate = useHouse((s) => s.hydrate);
  const toggleSound = useHouse((s) => s.toggleSound);
  const hydratePrefs = usePrefs((s) => s.hydrate);
  const { t, fmt, locale, setLocale, theme, toggleTheme } = useI18n();
  const [ledger, setLedger] = useState(false);

  useLayoutEffect(() => {
    hydratePrefs();
  }, [hydratePrefs]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    setMuted(!sound);
  }, [sound]);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="border-b border-stroke">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 lg:flex-nowrap">
          <div className="flex items-baseline gap-2">
            <Link to="/" className="font-display text-2xl leading-none tracking-wide text-fg">
              TiteKassu
            </Link>
            <span className="font-mono text-xs tracking-wide text-muted">{VERSION}</span>
          </div>
          <nav className="order-last flex w-full gap-1.5 overflow-x-auto lg:order-none lg:w-auto lg:flex-1" aria-label={t("tables")}>
            {NAV.map((item) => {
              const on = path === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`inline-flex min-h-9 shrink-0 items-center rounded-full px-3 text-sm ${
                    on ? "bg-accent text-accent-ink" : "border border-stroke text-muted"
                  }`}
                  aria-current={on ? "page" : undefined}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <p className="num rounded-full border border-stroke bg-surface px-3 py-1.5 text-sm text-accent" aria-live="polite">
              <span className="sr-only">{t("chips")} </span>
              {hydrated ? fmt(chips) : fmt(BUY_IN)}
            </p>
            <div className="inline-flex h-9 overflow-hidden rounded-full border border-stroke" role="group" aria-label={t("lang")}>
              {(["fi", "en"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  aria-pressed={locale === code}
                  className={`min-w-9 px-2.5 text-xs font-semibold tracking-wide ${locale === code ? "bg-accent text-accent-ink" : "text-muted"}`}
                  onClick={() => setLocale(code)}
                >
                  {code === "fi" ? "FI" : "EN"}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-full border border-stroke text-fg"
              aria-pressed={theme === "light"}
              aria-label={theme === "light" ? t("themeDark") : t("themeLight")}
              onClick={toggleTheme}
            >
              {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </button>
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-full border border-stroke text-fg"
              aria-pressed={!sound}
              aria-label={sound ? t("mute") : t("unmute")}
              onClick={() => {
                unlockAudio();
                toggleSound();
                if (!sound) playCue("tick");
              }}
            >
              {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-full border border-stroke text-fg"
              aria-expanded={ledger}
              aria-label={t("openLedger")}
              onClick={() => setLedger(true)}
            >
              <ScrollText className="size-4" />
            </button>
          </div>
        </div>
      </header>
      <main className={`mx-auto px-4 py-3 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>{children}</main>
      {ledger ? <Ledger onClose={() => setLedger(false)} /> : null}
    </div>
  );
}

function Ledger({ onClose }: { onClose: () => void }) {
  const ledger = useHouse((s) => s.ledger);
  const chips = useHouse((s) => s.chips);
  const wagered = useHouse((s) => s.wagered);
  const returned = useHouse((s) => s.returned);
  const peak = useHouse((s) => s.peak);
  const hands = useHouse((s) => s.hands);
  const reset = useHouse((s) => s.reset);
  const rebuy = useHouse((s) => s.rebuy);
  const { t, tx, fmt } = useI18n();
  const [confirm, setConfirm] = useState(false);
  const net = returned - wagered;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/80" role="presentation" onClick={onClose}>
      <aside
        role="dialog"
        aria-label={t("ledger")}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-stroke bg-surface px-5 py-5 text-fg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.18em] text-accent uppercase">{t("ledger")}</p>
            <h2 className="font-display text-4xl leading-none">{t("evening")}</h2>
          </div>
          <button type="button" className="inline-flex min-h-11 items-center rounded-full border border-stroke px-4 text-sm" onClick={onClose}>
            {t("close")}
          </button>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <Stat label={t("bank")} value={fmt(chips)} />
          <Stat label={t("peak")} value={fmt(peak)} />
          <Stat label={t("wagered")} value={fmt(wagered)} />
          <Stat label={t("paidBack")} value={fmt(returned)} />
          <Stat label={t("net")} value={`${net > 0 ? "+" : ""}${fmt(net)}`} />
          <Stat label={t("hands")} value={fmt(hands)} />
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="min-h-11 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink"
            onClick={() => {
              rebuy();
              playCue("chip");
            }}
          >
            {t("buyIn", { n: fmt(BUY_IN) })}
          </button>
          {confirm ? (
            <button
              type="button"
              className="min-h-11 rounded-full border border-crimson px-4 text-sm text-crimson"
              onClick={() => {
                reset();
                setConfirm(false);
              }}
            >
              {t("confirmReset")}
            </button>
          ) : (
            <button type="button" className="min-h-11 rounded-full border border-stroke px-4 text-sm text-muted" onClick={() => setConfirm(true)}>
              {t("resetEvening")}
            </button>
          )}
        </div>
        <p className="mt-3 text-sm text-muted">{t("playMoney")}</p>
        <ol className="mt-6 space-y-3">
          {ledger.length === 0 ? <li className="text-sm text-muted">{t("noHands")}</li> : null}
          {ledger.map((row) => (
            <li key={row.id} className="border-t border-stroke pt-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm">{t(GAME_KEY[row.game])}</p>
                <p className={`num text-sm ${row.net > 0 ? "text-accent" : row.net < 0 ? "text-crimson" : "text-muted"}`}>
                  {row.net > 0 ? "+" : ""}
                  {fmt(row.net)}
                </p>
              </div>
              <p className="text-sm text-muted">{tx(row.note)}</p>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-stroke px-3 py-2">
      <dt className="text-xs tracking-wide text-muted uppercase">{label}</dt>
      <dd className="num mt-1 text-lg">{value}</dd>
    </div>
  );
}

export function BrokeRack() {
  const chips = useHouse((s) => s.chips);
  const rebuy = useHouse((s) => s.rebuy);
  const { t, fmt } = useI18n();
  if (chips >= 10) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-term-line bg-term-elev px-4 py-3">
      <p className="text-sm text-term-muted">{t("rackEmpty")}</p>
      <button type="button" className="min-h-11 rounded-md bg-phosphor px-4 text-sm font-semibold text-phosphor-ink" onClick={() => rebuy()}>
        {t("buyIn", { n: fmt(BUY_IN) })}
      </button>
    </div>
  );
}
