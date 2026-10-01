import { createFileRoute, Link } from "@tanstack/react-router";
import { Cherry, Club, Dices, Spade } from "lucide-react";
import { HouseShell } from "@/components/casino/shell";
import { BUY_IN } from "@/lib/casino/bank";
import { useI18n, type CopyKey } from "@/lib/casino/i18n";

export const Route = createFileRoute("/")({
  component: Home,
});

const ROOMS: { to: "/slots" | "/blackjack" | "/roulette" | "/poker"; kicker: string; title: CopyKey; line: CopyKey; icon: typeof Cherry }[] = [
  { to: "/slots", kicker: "01", title: "gameSlots", line: "roomSlots", icon: Cherry },
  { to: "/blackjack", kicker: "02", title: "gameBlackjack", line: "roomBlackjack", icon: Spade },
  { to: "/roulette", kicker: "03", title: "gameRoulette", line: "roomRoulette", icon: Dices },
  { to: "/poker", kicker: "04", title: "gamePoker", line: "roomPoker", icon: Club },
];

function Home() {
  const { t, fmt } = useI18n();
  return (
    <HouseShell>
      <p className="text-xs tracking-[0.22em] text-accent uppercase">{t("rooms")}</p>
      <h1 className="mt-2 max-w-xl font-display text-6xl leading-[0.9]">{t("hero")}</h1>
      <p className="mt-4 max-w-prose text-muted">{t("heroLine", { n: fmt(BUY_IN) })}</p>
      <div className="mt-8 border-t border-stroke">
        {ROOMS.map((room) => {
          const Icon = room.icon;
          return (
            <Link key={room.to} to={room.to} className="group flex min-h-24 items-center gap-4 border-b border-stroke py-4">
              <span className="num w-8 text-sm text-accent">{room.kicker}</span>
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-stroke text-accent">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-3xl leading-none group-hover:text-accent">{t(room.title)}</span>
                <span className="mt-1 block text-sm text-muted">{t(room.line)}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </HouseShell>
  );
}
