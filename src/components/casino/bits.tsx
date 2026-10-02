import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Club, Diamond, Heart, Spade } from "lucide-react";
import { cardLabel, type Card } from "@/lib/casino/cards";
import { useI18n } from "@/lib/casino/i18n";
import { type Lamp } from "@/lib/casino/slots";

const SUITS = { S: Spade, H: Heart, D: Diamond, C: Club } as const;

export function PlayingCard({
  card,
  down = false,
  small = false,
  enter = false,
}: {
  card?: Card;
  down?: boolean;
  small?: boolean;
  enter?: boolean;
}) {
  const size = small ? "pcard pcard-sm" : "pcard";
  const motion = enter ? "card-in" : "";
  if (down || !card) {
    return (
      <div className={`${size} ${motion} felt-surface relative shrink-0 rounded-md border border-gold-dim`} aria-hidden>
        <span className="absolute inset-1 rounded-sm border border-gold/40" />
        <span className="absolute inset-2 rounded-sm border border-ivory/20" />
      </div>
    );
  }
  const red = card.s === "H" || card.s === "D";
  const Icon = SUITS[card.s];
  return (
    <div
      className={`${size} ${motion} relative shrink-0 rounded-md border border-line bg-ivory shadow-sm ${red ? "text-crimson" : "text-ink"}`}
      role="img"
      aria-label={cardLabel(card)}
    >
      <div className="absolute top-0.5 left-1 flex flex-col items-center leading-none">
        <span className={`pcard-rank font-display font-semibold ${card.r === "10" ? "text-sm" : "text-lg"}`}>{card.r}</span>
        <Icon className="pcard-pip size-3" aria-hidden />
      </div>
      <Icon className="pcard-suit absolute top-1/2 left-1/2 size-7 -translate-x-1/2 -translate-y-1/2" aria-hidden />
    </div>
  );
}

export function LampMark({ lamp }: { lamp: Lamp }) {
  return (
    <div className="flex h-full items-center justify-center text-ivory" aria-hidden>
      <LampGlyph lamp={lamp} />
    </div>
  );
}

function LampGlyph({ lamp }: { lamp: Lamp }) {
  if (lamp === "cherry") {
    return (
      <svg viewBox="0 0 64 64" className="size-10">
        <path d="M34 8c6 8 8 12 6 18" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold" />
        <circle cx="24" cy="40" r="11" className="fill-crimson" />
        <circle cx="40" cy="42" r="11" className="fill-crimson" />
        <circle cx="21" cy="36" r="3" className="fill-ivory/50" />
      </svg>
    );
  }
  if (lamp === "lemon") {
    return (
      <svg viewBox="0 0 64 64" className="size-10">
        <ellipse cx="32" cy="34" rx="16" ry="12" transform="rotate(-24 32 34)" className="fill-gold" />
        <path d="M46 18c4 2 6 6 4 8" fill="none" className="stroke-felt" strokeWidth="2" />
      </svg>
    );
  }
  if (lamp === "orange") {
    return (
      <svg viewBox="0 0 64 64" className="size-10">
        <circle cx="32" cy="36" r="14" className="fill-gold" />
        <path d="M32 22c2-8 10-8 12-4" fill="none" className="stroke-felt" strokeWidth="2" />
        <circle cx="32" cy="36" r="5" className="fill-gold-dim" />
      </svg>
    );
  }
  if (lamp === "plum") {
    return (
      <svg viewBox="0 0 64 64" className="size-10">
        <ellipse cx="32" cy="38" rx="13" ry="15" className="fill-felt" />
        <path d="M32 22c4-8 12-6 12-2" fill="none" className="stroke-gold" strokeWidth="2" />
        <ellipse cx="27" cy="32" rx="3" ry="5" className="fill-ivory/30" />
      </svg>
    );
  }
  if (lamp === "bell") {
    return (
      <svg viewBox="0 0 64 64" className="size-10">
        <path d="M18 40c2-14 8-22 14-22s12 8 14 22H18z" className="fill-gold" />
        <rect x="16" y="40" width="32" height="5" rx="1" className="fill-gold" />
        <circle cx="32" cy="50" r="4" className="fill-gold" />
      </svg>
    );
  }
  if (lamp === "bar") {
    return (
      <svg viewBox="0 0 64 64" className="size-10">
        <rect x="8" y="24" width="48" height="16" rx="2" className="fill-ivory" />
        <text x="32" y="36" textAnchor="middle" className="fill-ink" fontSize="12" fontFamily="Outfit, sans-serif">
          BAR
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className="size-10">
      <text
        x="32"
        y="46"
        textAnchor="middle"
        className="fill-crimson"
        fontSize="40"
        fontFamily="Cormorant Garamond, Georgia, serif"
      >
        7
      </text>
    </svg>
  );
}

export function DenomPicker({
  value,
  onChange,
  denoms,
  disabled,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  denoms: readonly number[];
  disabled?: boolean;
  label?: string;
}) {
  const { tx } = useI18n();
  return (
    <div role="radiogroup" aria-label={tx(label ?? "Chip")} className="flex flex-wrap gap-2">
      {denoms.map((denom) => {
        const on = value === denom;
        return (
          <button
            key={denom}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(denom)}
            className={`num flex size-12 items-center justify-center rounded-full border-2 text-sm font-semibold disabled:opacity-40 ${
              on ? "border-ivory bg-gold text-ink" : "border-gold-dim bg-felt-deep text-gold"
            }`}
          >
            {denom}
          </button>
        );
      })}
    </div>
  );
}

export function GoldButton({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      type="button"
      className={`inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold tracking-wide text-ink disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  className = "",
  cabinet = false,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { cabinet?: boolean }) {
  const tone = cabinet ? "border-line text-ivory" : "border-stroke text-fg";
  return (
    <button
      {...props}
      type="button"
      className={`inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm font-medium disabled:opacity-40 ${tone} ${className}`}
    >
      {children}
    </button>
  );
}

export function RuleNote({ title, children }: { title: string; children: ReactNode }) {
  const { tx } = useI18n();
  return (
    <details className="mt-6 border-t border-stroke pt-4">
      <summary className="min-h-11 cursor-pointer list-none text-sm tracking-wide text-accent uppercase">{tx(title)}</summary>
      <div className="mt-3 space-y-2 text-sm text-muted">{children}</div>
    </details>
  );
}

export function ResultLine({ text, tone }: { text: string; tone: "win" | "push" | "lose" | "idle" }) {
  const { tx } = useI18n();
  const color = tone === "win" ? "text-accent" : tone === "lose" ? "text-crimson" : "text-fg";
  return (
    <p className={`font-display text-3xl leading-none ${color}`} aria-live="polite">
      {tx(text)}
    </p>
  );
}
