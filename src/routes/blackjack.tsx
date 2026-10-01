import { createFileRoute } from "@tanstack/react-router";
import { BlackjackGame } from "@/components/casino/blackjack-game";
import { HouseShell } from "@/components/casino/shell";

export const Route = createFileRoute("/blackjack")({
  head: () => ({ meta: [{ title: "Blackjack · TiteKassu" }] }),
  component: BlackjackPage,
});

function BlackjackPage() {
  return (
    <HouseShell>
      <BlackjackGame />
    </HouseShell>
  );
}
