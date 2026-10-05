import { createFileRoute } from "@tanstack/react-router";
import { SegfaultGame } from "@/components/casino/segfault-game";
import { HouseShell } from "@/components/casino/shell";

export const Route = createFileRoute("/segfault")({
  head: () => ({ meta: [{ title: "Segfault · TiteKassu" }] }),
  component: SegfaultPage,
});

function SegfaultPage() {
  return (
    <HouseShell wide>
      <SegfaultGame />
    </HouseShell>
  );
}
