export type Cue = "tap" | "ui" | "good" | "bad" | "shutter" | "coin" | "alarm" | "launch";

const MUTE_KEY = "kb-myata-mute";

let ctx: AudioContext | null = null;
let muted = false;
let loaded = false;

function readMute() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  muted = localStorage.getItem(MUTE_KEY) === "1";
}

export function soundMuted() {
  readMute();
  return muted;
}

export function setSoundMuted(next: boolean) {
  readMute();
  muted = next;
  try {
    localStorage.setItem(MUTE_KEY, next ? "1" : "0");
  } catch {
    /* private mode */
  }
  if (next && ctx?.state === "running") void ctx.suspend();
  if (!next && ctx?.state === "suspended") void ctx.resume();
}

function context() {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

export function unlockSound() {
  readMute();
  const audio = context();
  if (audio && audio.state === "suspended") void audio.resume();
}

function envGain(audio: AudioContext, when: number, dur: number, peak: number) {
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), when + Math.min(0.02, dur * 0.35));
  gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  gain.connect(audio.destination);
  return gain;
}

function osc(
  audio: AudioContext,
  type: OscillatorType,
  freq: number,
  when: number,
  dur: number,
  peak: number,
  slideTo?: number,
) {
  const node = audio.createOscillator();
  node.type = type;
  node.frequency.setValueAtTime(freq, when);
  if (slideTo) node.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), when + dur);
  node.connect(envGain(audio, when, dur, peak));
  node.start(when);
  node.stop(when + dur + 0.02);
}

function noise(
  audio: AudioContext,
  when: number,
  dur: number,
  peak: number,
  band: BiquadFilterType,
  freq: number,
) {
  const length = Math.max(1, Math.floor(audio.sampleRate * dur));
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const source = audio.createBufferSource();
  source.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = band;
  filter.frequency.setValueAtTime(freq, when);
  source.connect(filter);
  filter.connect(envGain(audio, when, dur, peak));
  source.start(when);
  source.stop(when + dur);
}

export function play(cue: Cue) {
  readMute();
  if (muted) return;
  const audio = context();
  if (!audio) return;
  if (audio.state === "suspended") void audio.resume();
  const t = audio.currentTime + 0.01;
  if (cue === "tap") {
    noise(audio, t, 0.045, 0.07, "highpass", 900);
    osc(audio, "triangle", 210, t, 0.05, 0.045, 120);
  } else if (cue === "ui") {
    osc(audio, "sine", 720, t, 0.045, 0.03);
  } else if (cue === "good") {
    osc(audio, "triangle", 523, t, 0.09, 0.055);
    osc(audio, "triangle", 784, t + 0.07, 0.12, 0.045);
  } else if (cue === "bad") {
    osc(audio, "sawtooth", 170, t, 0.16, 0.035, 70);
    noise(audio, t, 0.09, 0.03, "lowpass", 380);
  } else if (cue === "shutter") {
    noise(audio, t, 0.035, 0.11, "highpass", 1800);
    osc(audio, "square", 1320, t, 0.02, 0.025);
  } else if (cue === "coin") {
    osc(audio, "sine", 880, t, 0.08, 0.05);
    osc(audio, "sine", 1320, t + 0.08, 0.14, 0.045);
  } else if (cue === "alarm") {
    osc(audio, "square", 880, t, 0.08, 0.035);
    osc(audio, "square", 620, t + 0.12, 0.11, 0.035);
  } else if (cue === "launch") {
    noise(audio, t, 0.85, 0.06, "lowpass", 220);
    osc(audio, "sawtooth", 68, t, 0.85, 0.03, 190);
    osc(audio, "sine", 420, t + 0.12, 0.22, 0.025, 880);
  }
}
