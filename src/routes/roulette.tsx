import { createFileRoute } from "@tanstack/react-router";
import { RouletteGame } from "@/components/casino/roulette-game";
import { HouseShell } from "@/components/casino/shell";

export const Route = createFileRoute("/roulette")({
  head: () => ({ meta: [{ title: "Roulette · TiteKassu" }] }),
  component: RoulettePage,
});

function RoulettePage() {
  return (
    <HouseShell wide>
      <RouletteGame />
    </HouseShell>
  );
}
