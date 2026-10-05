import { createFileRoute, Link } from "@tanstack/react-router";
import { Cherry, Club, Cpu, Dices, Spade } from "lucide-react";
import { HouseShell } from "@/components/casino/shell";
import { Console } from "@/components/casino/bits";
import { BUY_IN } from "@/lib/casino/bank";
import { useI18n, type CopyKey } from "@/lib/casino/i18n";

export const Route = createFileRoute("/")({
  component: Home,
});

const ROOMS: { to: "/slots" | "/blackjack" | "/roulette" | "/poker" | "/segfault"; kicker: string; title: CopyKey; line: CopyKey; icon: typeof Cherry }[] = [
  { to: "/slots", kicker: "01", title: "gameSlots", line: "roomSlots", icon: Cherry },
  { to: "/blackjack", kicker: "02", title: "gameBlackjack", line: "roomBlackjack", icon: Spade },
  { to: "/roulette", kicker: "03", title: "gameRoulette", line: "roomRoulette", icon: Dices },
  { to: "/poker", kicker: "04", title: "gamePoker", line: "roomPoker", icon: Club },
  { to: "/segfault", kicker: "05", title: "gameSegfault", line: "roomSegfault", icon: Cpu },
];

function Home() {
  const { t, fmt } = useI18n();
  return (
    <HouseShell>
      <Console pid="00" unit="house.index" title={t("hero")} blurb={t("heroLine", { n: fmt(BUY_IN) })}>
        <p className="font-mono text-xs tracking-wide text-term-muted uppercase">{t("rooms")}</p>
        <div className="mt-3 border-t border-term-line">
          {ROOMS.map((room) => {
            const Icon = room.icon;
            return (
              <Link key={room.to} to={room.to} className="group flex min-h-20 items-center gap-4 border-b border-term-line py-3">
                <span className="num w-8 font-mono text-xs text-phosphor">{room.kicker}</span>
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-term-line text-phosphor">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-3xl leading-none text-term-fg transition-colors group-hover:text-phosphor">{t(room.title)}</span>
                  <span className="mt-1 block text-sm text-term-muted">{t(room.line)}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </Console>
    </HouseShell>
  );
}
