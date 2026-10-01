import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

function basepath(): string | undefined {
  const trimmed = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  if (!trimmed || trimmed === "/") return undefined;
  return trimmed;
}

export function getRouter() {
  return createRouter({
    routeTree,
    basepath: basepath(),
    defaultErrorComponent: AppErrorComponent,
  });
}
