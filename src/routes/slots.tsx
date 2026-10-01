import { createFileRoute } from "@tanstack/react-router";
import { SlotsGame } from "@/components/casino/slots-game";
import { HouseShell } from "@/components/casino/shell";

export const Route = createFileRoute("/slots")({
  head: () => ({ meta: [{ title: "Fruit machine · TiteKassu" }] }),
  component: SlotsPage,
});

function SlotsPage() {
  return (
    <HouseShell>
      <SlotsGame />
    </HouseShell>
  );
}
