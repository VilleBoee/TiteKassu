let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext;
  if (!ctx) {
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.22;
    master.connect(ctx.destination);
  }
  return ctx;
}

export function unlockAudio(): void {
  const audio = context();
  if (audio && audio.state === "suspended") void audio.resume();
}

export function setMuted(next: boolean): void {
  muted = next;
  const audio = ctx;
  if (!audio || !master) return;
  master.gain.setTargetAtTime(next ? 0 : 0.22, audio.currentTime, 0.02);
}

function envGain(when: number, peak: number, dur: number): GainNode | null {
  if (!ctx || !master) return null;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), when + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  g.connect(master);
  return g;
}

function tone(freq: number, dur: number, type: OscillatorType, peak: number, delay = 0): void {
  const audio = context();
  if (!audio || !master || muted || audio.state !== "running") return;
  const when = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const g = envGain(when, peak, dur);
  if (!g) return;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  osc.connect(g);
  osc.start(when);
  osc.stop(when + dur + 0.03);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
}

function noise(dur: number, peak: number, delay = 0): void {
  const audio = context();
  if (!audio || !master || muted || audio.state !== "running") return;
  const when = audio.currentTime + delay;
  const len = Math.max(1, Math.floor(audio.sampleRate * dur));
  const buffer = audio.createBuffer(1, len, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 900;
  const g = envGain(when, peak, dur);
  if (!g) return;
  src.connect(filter);
  filter.connect(g);
  src.start(when);
  src.onended = () => {
    src.disconnect();
    filter.disconnect();
    g.disconnect();
  };
}

export type Cue = "chip" | "card" | "spin" | "win" | "lose" | "tick";

export function playCue(cue: Cue): void {
  if (muted) return;
  const wobble = 0.94 + Math.random() * 0.12;
  if (cue === "chip") {
    noise(0.04, 0.12);
    tone(1680 * wobble, 0.05, "triangle", 0.08);
  } else if (cue === "card") {
    noise(0.05, 0.1);
    tone(420 * wobble, 0.06, "sine", 0.05);
  } else if (cue === "tick") {
    tone(980 * wobble, 0.03, "square", 0.03);
  } else if (cue === "spin") {
    noise(0.18, 0.08);
    tone(180, 0.22, "sine", 0.05);
  } else if (cue === "win") {
    tone(523, 0.12, "triangle", 0.1, 0);
    tone(659, 0.12, "triangle", 0.1, 0.09);
    tone(784, 0.2, "triangle", 0.11, 0.18);
  } else if (cue === "lose") {
    tone(196, 0.18, "sine", 0.07);
    tone(146, 0.22, "sine", 0.05, 0.08);
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") unlockAudio();
  });
}
