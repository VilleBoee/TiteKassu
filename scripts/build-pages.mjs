#!/usr/bin/env node
/**
 * Static GitHub Pages build.
 *
 * Writes HTML, CSS, and JS to `docs/`.
 * Default site path is `/TiteKassu/` (a project page). Override with PAGES_BASE:
 *   PAGES_BASE=/ npm run build:pages
 */
import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const base = process.env.PAGES_BASE?.trim() || "/TiteKassu/";
const docsDir = join(root, "docs");

function siteRoot() {
  const dirs = [join(root, ".vercel", "output", "static"), join(root, ".output", "public")];
  const nestedName = base === "/" ? "" : base.replace(/^\/|\/$/g, "");
  for (const dir of dirs) {
    const nested = nestedName ? join(dir, nestedName) : dir;
    if (existsSync(join(nested, "index.html"))) return nested;
    if (existsSync(join(dir, "index.html"))) return dir;
  }
  return null;
}

const child = spawn(
  process.execPath,
  [
    join(root, "scripts", "with-app-env.mjs"),
    process.execPath,
    join(root, "node_modules", "vite", "bin", "vite.js"),
    "build",
  ],
  {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      PAGES: "1",
      PAGES_BASE: base,
      NITRO_APP_BASE_URL: base,
    },
  },
);

child.on("exit", (code) => {
  if (code !== 0) process.exit(code ?? 1);
  const publicDir = siteRoot();
  if (!publicDir) {
    console.error("[build-pages] no index.html after the build");
    process.exit(1);
  }
  rmSync(docsDir, { recursive: true, force: true });
  mkdirSync(docsDir, { recursive: true });
  cpSync(publicDir, docsDir, { recursive: true });
  writeFileSync(join(docsDir, ".nojekyll"), "");
  const indexHtml = readFileSync(join(docsDir, "index.html"));
  if (!existsSync(join(docsDir, "404.html"))) writeFileSync(join(docsDir, "404.html"), indexHtml);
  console.log(`[build-pages] static site is in docs/ (base ${base})`);
});
