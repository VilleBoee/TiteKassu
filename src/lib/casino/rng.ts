export function randInt(n: number): number {
  if (!Number.isInteger(n) || n <= 0) throw new Error("randInt expects a positive integer");
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / n) * n;
  let x = 0;
  do {
    crypto.getRandomValues(buf);
    x = buf[0] ?? 0;
  } while (x >= limit);
  return x % n;
}

export function shuffle<T>(items: readonly T[]): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}
