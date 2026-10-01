import { create } from "zustand";

export type Locale = "en" | "fi";
export type ThemeName = "dark" | "light";

const KEY = "marlowe.prefs.v1";

interface Saved {
  locale: Locale;
  theme: ThemeName;
}

function readSaved(): Saved | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Saved>;
    const locale = parsed.locale === "fi" ? "fi" : parsed.locale === "en" ? "en" : null;
    const theme = parsed.theme === "light" ? "light" : parsed.theme === "dark" ? "dark" : null;
    if (!locale || !theme) return null;
    return { locale, theme };
  } catch {
    return null;
  }
}

function writeSaved(data: Saved): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode */
  }
}

function apply(locale: Locale, theme: ThemeName): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale === "fi" ? "fi" : "en";
  document.documentElement.dataset.theme = theme;
}

interface Prefs extends Saved {
  hydrated: boolean;
  hydrate: () => void;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}

export const usePrefs = create<Prefs>((set, get) => ({
  locale: "en",
  theme: "dark",
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    const saved = readSaved();
    const locale = saved?.locale ?? "en";
    const theme = saved?.theme ?? "dark";
    apply(locale, theme);
    set({ locale, theme, hydrated: true });
  },
  setLocale: (locale) => {
    apply(locale, get().theme);
    set({ locale });
    writeSaved({ locale, theme: get().theme });
  },
  setTheme: (theme) => {
    apply(get().locale, theme);
    set({ theme });
    writeSaved({ locale: get().locale, theme });
  },
  toggleTheme: () => {
    get().setTheme(get().theme === "dark" ? "light" : "dark");
  },
}));
