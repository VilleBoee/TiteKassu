import { createFileRoute } from "@tanstack/react-router";
import { PokerGame } from "@/components/casino/poker-game";
import { HouseShell } from "@/components/casino/shell";

export const Route = createFileRoute("/poker")({
  head: () => ({ meta: [{ title: "Texas Hold'em · TiteKassu" }] }),
  component: PokerPage,
});

function PokerPage() {
  return (
    <HouseShell wide>
      <PokerGame />
    </HouseShell>
  );
}
