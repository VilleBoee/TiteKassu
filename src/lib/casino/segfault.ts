import { randInt } from "./rng";

export const COLS = 6;
export const ROWS = 6;

export const PAY_SYMS = ["bit", "ping", "hash", "link", "lock", "chip", "rack", "core"] as const;
export type PaySym = (typeof PAY_SYMS)[number];
export type Sym = PaySym | "bug" | "root" | "nop";

const PAY_SET = new Set<string>(PAY_SYMS);

export interface Cell {
  sym: Sym;
  cash?: number;
  hot?: boolean;
}

export interface Hit {
  c: number;
  r: number;
}

export interface Frame {
  grid: Cell[][];
  open: number;
  mult: number;
  stepWin: number;
  total: number;
  lit: Hit[];
  kind: "drop" | "win" | "blast" | "mine" | "shell" | "done";
  mode: "rack" | "shell";
  banner: "idle" | "open" | "win" | "blast" | "mine" | "shell" | "none" | "cap" | "shellWin";
  bannerN: number;
  shellLeft?: number;
}

/** Per route, in thousandths of the stake, for 3, 4, 5, and 6 racks from the left. */
const PAY: Record<PaySym, [number, number, number, number]> = {
  bit: [250, 600, 1400, 3200],
  ping: [300, 800, 1800, 4000],
  hash: [400, 1000, 2200, 5000],
  link: [500, 1300, 3000, 6500],
  lock: [700, 1800, 4200, 9000],
  chip: [1000, 2600, 6000, 13000],
  rack: [1500, 4000, 9000, 20000],
  core: [2500, 6500, 16000, 34000],
};

const WEIGHTS: { sym: Sym; w: number }[] = [
  { sym: "nop", w: 28 },
  { sym: "bit", w: 10 },
  { sym: "ping", w: 9 },
  { sym: "hash", w: 9 },
  { sym: "link", w: 8 },
  { sym: "lock", w: 7 },
  { sym: "chip", w: 6 },
  { sym: "rack", w: 4 },
  { sym: "core", w: 3 },
  { sym: "bug", w: 2 },
  { sym: "root", w: 2 },
];
const WEIGHT_TOTAL = WEIGHTS.reduce((sum, item) => sum + item.w, 0);
const CAP = 400;

export function waysFor(open: number): number {
  return open ** COLS;
}

function draw(): Cell {
  let roll = randInt(WEIGHT_TOTAL);
  for (const item of WEIGHTS) {
    if (roll < item.w) return { sym: item.sym };
    roll -= item.w;
  }
  return { sym: "bit" };
}

function isPay(sym: Sym): sym is PaySym {
  return PAY_SET.has(sym);
}

function cloneGrid(grid: Cell[][]): Cell[][] {
  return grid.map((col) => col.map((cell) => ({ ...cell })));
}

function activeStart(open: number): number {
  return ROWS - open;
}

function inPlay(row: number, open: number): boolean {
  return row >= ROWS - open;
}

function freshGrid(): Cell[][] {
  return Array.from({ length: COLS }, () => Array.from({ length: ROWS }, () => draw()));
}

function evaluate(grid: Cell[][], open: number, bet: number, mult: number): { amount: number; lit: Hit[] } {
  const lit: Hit[] = [];
  const seen = new Set<string>();
  const usedBug = new Set<string>();
  let amount = 0;
  const order = [...PAY_SYMS].reverse();
  for (const sym of order) {
    const counts: number[] = [];
    const cells: Hit[][] = [];
    let real = 0;
    for (let c = 0; c < COLS; c++) {
      const reel: Hit[] = [];
      for (let r = activeStart(open); r < ROWS; r++) {
        const cell = grid[c][r].sym;
        if (cell === sym) {
          reel.push({ c, r });
          real += 1;
        } else if (cell === "bug" && !usedBug.has(`${c}:${r}`)) {
          reel.push({ c, r });
        }
      }
      if (reel.length === 0) break;
      counts.push(reel.length);
      cells.push(reel);
    }
    if (counts.length < 3 || real === 0) continue;
    const ways = counts.reduce((product, n) => product * n, 1);
    amount += Math.round((bet * PAY[sym][counts.length - 3] * ways * mult) / 1000);
    for (const reel of cells) {
      for (const hit of reel) {
        if (grid[hit.c][hit.r].sym === "bug") usedBug.add(`${hit.c}:${hit.r}`);
        const key = `${hit.c}:${hit.r}`;
        if (seen.has(key)) continue;
        seen.add(key);
        lit.push(hit);
      }
    }
  }
  return { amount, lit };
}

function findBugs(grid: Cell[][], open: number): Hit[] {
  const bugs: Hit[] = [];
  for (let c = 0; c < COLS; c++) {
    for (let r = activeStart(open); r < ROWS; r++) {
      if (grid[c][r].sym === "bug") bugs.push({ c, r });
    }
  }
  return bugs;
}

function blastHits(grid: Cell[][], open: number, bugs: Hit[]): Hit[] {
  const lit: Hit[] = [];
  const seen = new Set<string>();
  const add = (c: number, r: number) => {
    const key = `${c}:${r}`;
    if (seen.has(key)) return;
    seen.add(key);
    lit.push({ c, r });
  };
  for (const bug of bugs) {
    add(bug.c, bug.r);
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (dc === 0 && dr === 0) continue;
        const nc = bug.c + dc;
        const nr = bug.r + dr;
        if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS || !inPlay(nr, open)) continue;
        const sym = grid[nc][nr].sym;
        if (sym === "root" || sym === "bug") continue;
        add(nc, nr);
      }
    }
  }
  return lit;
}

function mineLine(grid: Cell[][], open: number): { converted: Hit[]; above: Hit[] } | null {
  let best: Hit[] | null = null;
  for (let r = activeStart(open); r < ROWS; r++) {
    let run: Hit[] = [];
    let sym: PaySym | null = null;
    const consider = () => {
      if (run.length >= 4 && (!best || run.length > best.length)) best = run.slice();
    };
    for (let c = 0; c < COLS; c++) {
      const cell = grid[c][r].sym;
      if (isPay(cell) && (sym === null || cell === sym)) {
        sym = cell;
        run.push({ c, r });
      } else {
        consider();
        run = [];
        sym = null;
        if (isPay(cell)) {
          sym = cell;
          run = [{ c, r }];
        }
      }
    }
    consider();
  }
  if (!best) return null;
  const converted: Hit[] = best;
  const above: Hit[] = [];
  for (const cell of converted) {
    const up = cell.r - 1;
    if (up < 0) continue;
    if (grid[cell.c][up].sym === "root") continue;
    above.push({ c: cell.c, r: up });
  }
  return { converted, above };
}

function fall(grid: Cell[][], removed: boolean[][]): Cell[][] {
  const next: Cell[][] = [];
  for (let c = 0; c < COLS; c++) {
    const kept: Cell[] = [];
    for (let r = 0; r < ROWS; r++) {
      if (!removed[c][r]) kept.push(grid[c][r]);
    }
    const col: Cell[] = [];
    for (let i = 0; i < ROWS - kept.length; i++) col.push(draw());
    col.push(...kept);
    next.push(col);
  }
  return next;
}

function blankRemoved(): boolean[][] {
  return Array.from({ length: COLS }, () => Array.from({ length: ROWS }, () => false));
}

function mark(removed: boolean[][], hits: Hit[]) {
  for (const hit of hits) removed[hit.c][hit.r] = true;
}

function countRoots(grid: Cell[][], open: number): number {
  let n = 0;
  for (let c = 0; c < COLS; c++) {
    for (let r = activeStart(open); r < ROWS; r++) {
      if (grid[c][r].sym === "root") n += 1;
    }
  }
  return n;
}

function cashChip(bet: number): number {
  const table = [0.25, 0.5, 0.5, 1, 1];
  return Math.max(1, Math.round(bet * table[randInt(table.length)]!));
}

function playShell(bet: number, roots: number): Frame[] {
  const grid: Cell[][] = Array.from({ length: COLS }, () => Array.from({ length: ROWS }, () => ({ sym: "bit" as Sym })));
  const spots: Hit[] = [];
  for (let c = 0; c < COLS; c++) {
    for (let r = 3; r < ROWS; r++) spots.push({ c, r });
  }
  for (let i = 0; i < Math.min(roots, 8); i++) {
    const spot = spots.splice(randInt(spots.length), 1)[0]!;
    grid[spot.c][spot.r] = { sym: "root", cash: cashChip(bet) };
  }
  const frames: Frame[] = [];
  let left = 3;
  let hotfix = false;
  const shot = (leftNow: number, kind: Frame["kind"], stepWin = 0, banner: Frame["banner"] = "shell") => {
    frames.push({
      grid: cloneGrid(grid),
      open: 3,
      mult: 1,
      stepWin,
      total: 0,
      lit: [],
      kind,
      mode: "shell",
      banner,
      bannerN: banner === "shellWin" ? stepWin : leftNow,
      shellLeft: leftNow,
    });
  };
  shot(left, "shell");
  for (let spin = 0; spin < 12 && left > 0; spin++) {
    left -= 1;
    let landed = 0;
    let full = true;
    for (let c = 0; c < COLS; c++) {
      for (let r = 3; r < ROWS; r++) {
        if (grid[c][r].sym === "root") continue;
        full = false;
        if (randInt(100) >= 9) continue;
        landed += 1;
        const cash = cashChip(bet);
        const hot = !hotfix && randInt(100) < 5;
        grid[c][r] = { sym: "root", cash, hot };
        if (hot) {
          hotfix = true;
          for (let cc = 0; cc < COLS; cc++) {
            for (let rr = 3; rr < ROWS; rr++) {
              const cell = grid[cc][rr];
              if (cell.cash) cell.cash *= 2;
            }
          }
        }
      }
    }
    if (landed > 0) left = 3;
    shot(left, "shell");
    if (full) break;
  }
  let sum = 0;
  for (let c = 0; c < COLS; c++) {
    for (let r = 3; r < ROWS; r++) sum += grid[c][r].cash ?? 0;
  }
  shot(0, "done", sum, "shellWin");
  return frames;
}

export function resolveSpin(bet: number): Frame[] {
  let grid = freshGrid();
  let open = 3;
  let mult = 1;
  let total = 0;
  const frames: Frame[] = [];
  const snap = (
    kind: Frame["kind"],
    stepWin: number,
    lit: Hit[],
    banner: Frame["banner"],
    bannerN: number,
    mode: Frame["mode"] = "rack",
  ) => {
    frames.push({
      grid: cloneGrid(grid),
      open,
      mult,
      stepWin,
      total,
      lit,
      kind,
      mode,
      banner,
      bannerN,
    });
  };

  snap("drop", 0, [], "idle", open);

  for (let guard = 0; guard < 14; guard++) {
    if (total >= bet * CAP) break;
    const result = evaluate(grid, open, bet, mult);
    if (result.amount > 0) {
      const room = bet * CAP - total;
      const paid = Math.max(0, Math.min(result.amount, room));
      total += paid;
      snap("win", paid, result.lit, paid < result.amount ? "cap" : "win", paid);
      const removed = blankRemoved();
      mark(removed, result.lit);
      const bugs = findBugs(grid, open);
      if (bugs.length) {
        const blast = blastHits(grid, open, bugs);
        mark(removed, blast);
        mult = Math.min(5, mult + 1);
        snap("blast", 0, blast, "blast", mult);
      }
      if (open < ROWS) open += 1;
      grid = fall(grid, removed);
      snap("drop", 0, [], "open", open);
      continue;
    }

    const mined = mineLine(grid, open);
    if (mined) {
      for (const cell of mined.converted) grid[cell.c][cell.r] = { sym: "bug" };
      snap("mine", 0, [...mined.converted, ...mined.above], "mine", 0);
      const removed = blankRemoved();
      mark(removed, mined.above);
      grid = fall(grid, removed);
      snap("drop", 0, [], "open", open);
      continue;
    }

    const bugs = findBugs(grid, open);
    if (bugs.length) {
      const blast = blastHits(grid, open, bugs);
      snap("blast", 0, blast, "blast", mult);
      const removed = blankRemoved();
      mark(removed, blast);
      grid = fall(grid, removed);
      snap("drop", 0, [], "open", open);
      continue;
    }
    break;
  }

  if (countRoots(grid, open) >= 3 && total < bet * CAP) {
    const shell = playShell(bet, countRoots(grid, open));
    for (const frame of shell) {
      if (frame.kind === "done") {
        const room = bet * CAP - total;
        const paid = Math.max(0, Math.min(frame.stepWin, room));
        total += paid;
        frames.push({
          ...frame,
          total,
          stepWin: paid,
          banner: paid < frame.stepWin ? "cap" : "shellWin",
          bannerN: paid,
        });
      } else {
        frames.push({ ...frame, total });
      }
    }
  }

  if (frames[frames.length - 1]?.kind !== "done") {
    snap("done", 0, [], total > 0 ? "win" : "none", total);
  }
  return frames;
}
