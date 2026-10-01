export const LAMPS = ["cherry", "lemon", "orange", "plum", "bell", "bar", "seven"] as const;
export type Lamp = (typeof LAMPS)[number];

export const REELS: readonly [Lamp[], Lamp[], Lamp[]] = [
  [
    "cherry", "lemon", "orange", "plum", "cherry", "cherry", "bar", "orange",
    "bell", "cherry", "plum", "lemon", "orange", "seven", "cherry", "bar",
    "lemon", "plum", "orange", "bell", "cherry", "lemon", "orange", "plum",
  ],
  [
    "lemon", "orange", "plum", "bar", "lemon", "bell", "orange", "cherry",
    "plum", "lemon", "seven", "orange", "bar", "plum", "lemon", "bell",
    "orange", "cherry", "plum", "lemon", "orange", "bar", "plum", "cherry",
  ],
  [
    "orange", "plum", "lemon", "bar", "orange", "bell", "plum", "lemon",
    "seven", "orange", "bar", "plum", "lemon", "bell", "orange", "plum",
    "lemon", "cherry", "bar", "orange", "plum", "lemon", "bell", "orange",
  ],
];

export interface SlotPay {
  mult: number;
  label: string;
}

export function evaluateLine(line: readonly [Lamp, Lamp, Lamp]): SlotPay {
  const [a, b, c] = line;
  if (a === "seven" && b === "seven" && c === "seven") return { mult: 80, label: "Three sevens" };
  if (a === "bar" && b === "bar" && c === "bar") return { mult: 40, label: "Three bars" };
  if (a === "bell" && b === "bell" && c === "bell") return { mult: 20, label: "Three bells" };
  if (a === "plum" && b === "plum" && c === "plum") return { mult: 14, label: "Three plums" };
  if (a === "orange" && b === "orange" && c === "orange") return { mult: 12, label: "Three oranges" };
  if (a === "lemon" && b === "lemon" && c === "lemon") return { mult: 10, label: "Three lemons" };
  if (a === "cherry" && b === "cherry" && c === "cherry") return { mult: 8, label: "Three cherries" };
  if (a === "cherry" && b === "cherry") return { mult: 4, label: "Two cherries" };
  if (a === "cherry") return { mult: 2, label: "Cherry" };
  return { mult: 0, label: "No line" };
}

export const PAYTABLE: { label: string; mult: string }[] = [
  { label: "Three sevens", mult: "80" },
  { label: "Three bars", mult: "40" },
  { label: "Three bells", mult: "20" },
  { label: "Three plums", mult: "14" },
  { label: "Three oranges", mult: "12" },
  { label: "Three lemons", mult: "10" },
  { label: "Three cherries", mult: "8" },
  { label: "Two cherries", mult: "4" },
  { label: "Cherry on the first reel", mult: "2" },
];

export function lampName(lamp: Lamp): string {
  if (lamp === "seven") return "Seven";
  return lamp.slice(0, 1).toUpperCase() + lamp.slice(1);
}
