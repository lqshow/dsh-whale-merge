// 音效全部用 WebAudio 现场合成，不带任何音频文件。
let ctx: AudioContext | null = null

function ac(): AudioContext | null {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(freq: number, at: number, dur: number, type: OscillatorType, vol: number, slideTo?: number): void {
  const a = ac()
  if (!a) return
  const t0 = a.currentTime + at
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain).connect(a.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

// 五声音阶，级别越高音越高
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]
const note = (step: number): number => 330 * 2 ** (step / 12)

export const sfx = {
  drop(): void {
    tone(620, 0, 0.09, 'sine', 0.18, 300)
  },
  merge(tier: number): void {
    const f = note(PENTA[Math.min(tier, PENTA.length - 1)])
    tone(f * 0.5, 0, 0.06, 'sine', 0.12, f)
    tone(f, 0.04, 0.22, 'triangle', 0.2)
  },
  discover(tier: number): void {
    const f = note(PENTA[Math.min(tier, PENTA.length - 1)])
    tone(f, 0, 0.16, 'triangle', 0.18)
    tone(f * 1.5, 0.1, 0.24, 'triangle', 0.16)
  },
  final(): void {
    ;[0, 4, 7, 12, 16].forEach((s, i) => tone(note(s + 5), i * 0.09, 0.4, 'triangle', 0.2))
  },
  shake(): void {
    ;[0, 0.08, 0.16, 0.24].forEach((at, i) => tone(i % 2 ? 140 : 180, at, 0.1, 'triangle', 0.16, i % 2 ? 180 : 130))
  },
  over(): void {
    ;[7, 4, 0, -5].forEach((s, i) => tone(note(s), i * 0.16, 0.3, 'sine', 0.18))
  },
}
