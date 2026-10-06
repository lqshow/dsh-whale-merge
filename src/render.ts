// 画面：海底罐子、十一种海洋生物、合成水花、计分。全部用 Canvas 2D 现画，只有鲸鱼娘用图片。
import { DEADLINE, DROP_Y, FINAL, FLOOR, type Game, H, PEARL, rOf, TIERS, W } from './game'
import { drawAvatar, type OutfitId } from './outfits'

let outfit: OutfitId = 'maid'
/** 游戏里的鲸鱼娘穿哪套造型。 */
export const setOutfit = (id: OutfitId): void => {
  outfit = id
}

type Ctx = CanvasRenderingContext2D
const TAU = Math.PI * 2
export const FONT = `ui-rounded, "SF Pro Rounded", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`

const INK = '#1B2147'
export const PALETTE = {
  deep: '#132a6b',
  mid: '#2f55d4',
  surface: '#5f86ff',
  accent: '#4D6BFE',
  sand: '#ead2a0',
  warn: '#ff5d73',
}

/** 每一级的主色，卡片和水花也用。 */
export const TIER_COLOR = ['#bfe3ff', '#ff8b70', '#ff9330', '#e8a1f0', '#f6cf4a', '#ffb06b', '#7ccb72', '#a77bf3', '#78b9ff', '#2a3045', '#4D6BFE']

export const colorOf = (tier: number): string => (tier === PEARL ? '#fff4fb' : TIER_COLOR[Math.min(tier, FINAL)])

// ---------- 飘字和震屏 ----------
type Floater = { x: number; y: number; text: string; color: string; t0: number; big: boolean }
const floaters: Floater[] = []
export function addFloat(x: number, y: number, text: string, now: number, big = false, color = '#ffffff'): void {
  floaters.push({ x, y, text, color, t0: now, big })
  if (floaters.length > 16) floaters.shift()
}

let shakeAmp = 0
let shakeUntil = 0
let shakeStart = 0
const reducedMotion = (): boolean => {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}
/** 画面震一下。amp 是逻辑像素，系统开了"减少动态效果"时不震。 */
export function kick(amp: number, ms: number, now: number): void {
  if (reducedMotion()) return
  if (now < shakeUntil && amp < shakeAmp) return
  shakeAmp = amp
  shakeStart = now
  shakeUntil = now + ms
}

function drawFloaters(c: Ctx, now: number): void {
  c.save()
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i]
    const life = f.big ? 1300 : 900
    const k = (now - f.t0) / life
    if (k >= 1) {
      floaters.splice(i, 1)
      continue
    }
    const pop = k < 0.15 ? 0.6 + (k / 0.15) * 0.5 : 1.1 - Math.min(0.1, (k - 0.15) * 0.4)
    c.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3
    c.font = `900 ${f.big ? 26 : 17}px ${FONT}`
    c.lineWidth = f.big ? 5 : 4
    c.strokeStyle = 'rgba(15,25,70,.75)'
    c.fillStyle = f.color
    c.save()
    c.translate(f.x, f.y - k * (f.big ? 60 : 38))
    c.scale(pop, pop)
    c.strokeText(f.text, 0, 0)
    c.fillText(f.text, 0, 0)
    c.restore()
  }
  c.restore()
}

type Burst = { x: number; y: number; tier: number; t0: number; big: boolean }
const bursts: Burst[] = []
export function addBurst(x: number, y: number, tier: number, now: number, big = false): void {
  bursts.push({ x, y, tier, t0: now, big })
  if (bursts.length > 24) bursts.shift()
}

// ---------- 小零件 ----------
function disc(c: Ctx, r: number, fill: string, rim = 'rgba(0,0,0,.14)'): void {
  c.beginPath()
  c.arc(0, 0, r, 0, TAU)
  c.fillStyle = fill
  c.fill()
  c.lineWidth = Math.max(1.2, r * 0.07)
  c.strokeStyle = rim
  c.stroke()
}

function shine(c: Ctx, r: number, a = 0.45): void {
  c.beginPath()
  c.ellipse(-r * 0.38, -r * 0.42, r * 0.26, r * 0.16, -0.6, 0, TAU)
  c.fillStyle = `rgba(255,255,255,${a})`
  c.fill()
}

function face(c: Ctx, r: number, o: { y?: number; gap?: number; eye?: number; ink?: string; blush?: boolean; mouth?: 'smile' | 'o' } = {}): void {
  const y = (o.y ?? 0.02) * r
  const gap = (o.gap ?? 0.34) * r
  const er = Math.max(1.6, (o.eye ?? 0.11) * r)
  const ink = o.ink ?? INK
  for (const s of [-1, 1]) {
    c.beginPath()
    c.arc(s * gap, y, er, 0, TAU)
    c.fillStyle = ink
    c.fill()
    c.beginPath()
    c.arc(s * gap - er * 0.3, y - er * 0.35, er * 0.38, 0, TAU)
    c.fillStyle = '#fff'
    c.fill()
  }
  if (o.blush !== false) {
    for (const s of [-1, 1]) {
      c.beginPath()
      c.ellipse(s * gap * 1.45, y + er * 1.6, er * 1.1, er * 0.62, 0, 0, TAU)
      c.fillStyle = 'rgba(255,120,140,.35)'
      c.fill()
    }
  }
  c.beginPath()
  if (o.mouth === 'o') {
    c.arc(0, y + er * 2, er * 0.55, 0, TAU)
    c.fillStyle = ink
    c.fill()
  } else {
    c.arc(0, y + er * 1.2, er * 0.9, 0.15 * Math.PI, 0.85 * Math.PI)
    c.lineWidth = Math.max(1.2, er * 0.45)
    c.lineCap = 'round'
    c.strokeStyle = ink
    c.stroke()
  }
}

function clipDisc(c: Ctx, r: number, draw: () => void): void {
  c.save()
  c.beginPath()
  c.arc(0, 0, r, 0, TAU)
  c.clip()
  draw()
  c.restore()
}

// ---------- 十一种海洋生物 ----------
export function drawCreature(c: Ctx, tier: number, r: number, t: number, head: HTMLImageElement | null): void {
  if (tier === PEARL) {
    const g = c.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(0.55, '#f6e9ff')
    g.addColorStop(1, '#c9d8ff')
    c.beginPath()
    c.arc(0, 0, r, 0, TAU)
    c.fillStyle = g
    c.fill()
    c.lineWidth = 1.5
    c.strokeStyle = 'rgba(255,255,255,.95)'
    c.stroke()
    const tw = (Math.sin(t / 160) + 1) / 2
    c.fillStyle = `rgba(255,255,255,${0.6 + tw * 0.4})`
    star4(c, r * 0.55, -r * 0.55, r * (0.12 + tw * 0.08))
    return
  }
  const col = TIER_COLOR[tier]
  switch (TIERS[tier].id) {
    case 'bubble': {
      c.beginPath()
      c.arc(0, 0, r, 0, TAU)
      c.fillStyle = 'rgba(214,238,255,.62)'
      c.fill()
      c.lineWidth = 1.6
      c.strokeStyle = 'rgba(255,255,255,.9)'
      c.stroke()
      shine(c, r, 0.8)
      face(c, r, { eye: 0.12, gap: 0.3, blush: false })
      return
    }
    case 'shrimp': {
      c.strokeStyle = '#e0634a'
      c.lineWidth = Math.max(1.2, r * 0.07)
      c.lineCap = 'round'
      for (const s of [-1, 1]) {
        c.beginPath()
        c.moveTo(s * r * 0.2, -r * 0.85)
        c.quadraticCurveTo(s * r * 0.5, -r * 1.55, s * r * 1.05, -r * 1.25)
        c.stroke()
      }
      disc(c, r, col)
      clipDisc(c, r, () => {
        c.strokeStyle = 'rgba(255,255,255,.55)'
        c.lineWidth = r * 0.08
        for (let i = 0; i < 3; i++) {
          c.beginPath()
          c.arc(0, r * 1.35, r * (0.75 + i * 0.22), 1.15 * Math.PI, 1.85 * Math.PI)
          c.stroke()
        }
      })
      shine(c, r)
      face(c, r, { y: -0.12 })
      return
    }
    case 'clownfish': {
      disc(c, r, col)
      clipDisc(c, r, () => {
        for (const x of [-0.5, 0.5]) {
          c.beginPath()
          c.ellipse(x * r, 0, r * 0.17, r * 1.2, 0, 0, TAU)
          c.fillStyle = '#fff'
          c.fill()
          c.lineWidth = r * 0.06
          c.strokeStyle = INK
          c.stroke()
        }
      })
      shine(c, r)
      face(c, r, { gap: 0.22, eye: 0.1 })
      return
    }
    case 'jellyfish': {
      disc(c, r, col)
      clipDisc(c, r, () => {
        c.fillStyle = 'rgba(255,255,255,.35)'
        c.beginPath()
        c.rect(-r, r * 0.35, r * 2, r)
        c.fill()
        c.strokeStyle = 'rgba(160,80,190,.55)'
        c.lineWidth = r * 0.07
        c.lineCap = 'round'
        for (let i = -2; i <= 2; i++) {
          c.beginPath()
          const x0 = i * r * 0.32
          c.moveTo(x0, r * 0.42)
          for (let k = 1; k <= 4; k++) c.lineTo(x0 + Math.sin(t / 300 + i + k) * r * 0.08, r * (0.42 + k * 0.16))
          c.stroke()
        }
      })
      shine(c, r)
      face(c, r, { y: -0.1 })
      return
    }
    case 'puffer': {
      c.fillStyle = '#d9a92b'
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU
        c.beginPath()
        c.moveTo(Math.cos(a - 0.12) * r * 0.96, Math.sin(a - 0.12) * r * 0.96)
        c.lineTo(Math.cos(a) * r * 1.13, Math.sin(a) * r * 1.13)
        c.lineTo(Math.cos(a + 0.12) * r * 0.96, Math.sin(a + 0.12) * r * 0.96)
        c.fill()
      }
      disc(c, r, col)
      clipDisc(c, r, () => {
        c.beginPath()
        c.ellipse(0, r * 0.75, r * 0.95, r * 0.55, 0, 0, TAU)
        c.fillStyle = '#fff6d6'
        c.fill()
      })
      shine(c, r)
      face(c, r, { mouth: 'o' })
      return
    }
    case 'starfish': {
      disc(c, r, '#ffe1bd')
      c.beginPath()
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i / 10) * TAU
        const rr = i % 2 === 0 ? r * 0.94 : r * 0.48
        c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
      }
      c.closePath()
      c.fillStyle = col
      c.lineJoin = 'round'
      c.lineWidth = r * 0.12
      c.strokeStyle = col
      c.stroke()
      c.fill()
      c.fillStyle = 'rgba(255,255,255,.55)'
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i / 5) * TAU
        c.beginPath()
        c.arc(Math.cos(a) * r * 0.66, Math.sin(a) * r * 0.66, r * 0.05, 0, TAU)
        c.fill()
      }
      face(c, r, { gap: 0.2, eye: 0.09, y: 0.04 })
      return
    }
    case 'turtle': {
      disc(c, r, col)
      clipDisc(c, r, () => {
        c.fillStyle = '#5aa454'
        c.strokeStyle = 'rgba(255,255,255,.35)'
        c.lineWidth = r * 0.04
        const hex = (x: number, y: number, s: number): void => {
          c.beginPath()
          for (let i = 0; i < 6; i++) c.lineTo(x + Math.cos((i / 6) * TAU) * s, y + Math.sin((i / 6) * TAU) * s)
          c.closePath()
          c.fill()
          c.stroke()
        }
        hex(0, r * 0.62, r * 0.28)
        hex(-r * 0.55, r * 0.45, r * 0.24)
        hex(r * 0.55, r * 0.45, r * 0.24)
        hex(-r * 0.78, -r * 0.1, r * 0.2)
        hex(r * 0.78, -r * 0.1, r * 0.2)
      })
      shine(c, r)
      face(c, r, { y: -0.18 })
      return
    }
    case 'octopus': {
      disc(c, r, col)
      clipDisc(c, r, () => {
        c.fillStyle = '#8f62e0'
        for (let i = -3; i <= 3; i++) {
          c.beginPath()
          c.arc(i * r * 0.3, r * 0.95 + Math.sin(t / 260 + i) * r * 0.04, r * 0.2, 0, TAU)
          c.fill()
        }
        c.fillStyle = 'rgba(255,255,255,.28)'
        for (const [x, y, s] of [[-0.45, -0.5, 0.1], [0.5, -0.45, 0.08], [0.15, -0.7, 0.06]]) {
          c.beginPath()
          c.arc(x * r, y * r, s * r, 0, TAU)
          c.fill()
        }
      })
      shine(c, r)
      face(c, r, { y: 0.05 })
      return
    }
    case 'dolphin': {
      c.beginPath()
      c.moveTo(-r * 0.15, -r * 0.9)
      c.quadraticCurveTo(r * 0.15, -r * 1.35, r * 0.4, -r * 1.2)
      c.quadraticCurveTo(r * 0.3, -r * 1.0, r * 0.38, -r * 0.8)
      c.fillStyle = '#5c9ff0'
      c.fill()
      disc(c, r, col)
      clipDisc(c, r, () => {
        c.beginPath()
        c.ellipse(0, r * 0.7, r * 1.0, r * 0.62, 0, 0, TAU)
        c.fillStyle = '#e3f1ff'
        c.fill()
      })
      shine(c, r)
      face(c, r, { y: -0.08 })
      return
    }
    case 'orca': {
      disc(c, r, col, 'rgba(0,0,0,.35)')
      clipDisc(c, r, () => {
        c.fillStyle = '#ffffff'
        c.beginPath()
        c.ellipse(0, r * 0.82, r * 0.9, r * 0.5, 0, 0, TAU)
        c.fill()
        for (const s of [-1, 1]) {
          c.beginPath()
          c.ellipse(s * r * 0.42, -r * 0.18, r * 0.24, r * 0.15, s * -0.4, 0, TAU)
          c.fill()
        }
      })
      shine(c, r, 0.25)
      face(c, r, { y: -0.16, gap: 0.42, eye: 0.08, blush: true })
      return
    }
    case 'whale-girl': {
      drawAvatar(c, outfit, r, head)
      // 一点闪光
      const tw = (Math.sin(t / 240) + 1) / 2
      c.fillStyle = `rgba(255,255,255,${0.5 + tw * 0.5})`
      star4(c, r * 0.72, -r * 0.72, r * (0.08 + tw * 0.05))
      return
    }
  }
}

function star4(c: Ctx, x: number, y: number, s: number): void {
  c.beginPath()
  c.moveTo(x, y - s * 2)
  c.quadraticCurveTo(x, y, x + s * 2, y)
  c.quadraticCurveTo(x, y, x, y + s * 2)
  c.quadraticCurveTo(x, y, x - s * 2, y)
  c.quadraticCurveTo(x, y, x, y - s * 2)
  c.fill()
}

// ---------- 场景 ----------
function background(c: Ctx, t: number): void {
  const g = c.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, PALETTE.surface)
  g.addColorStop(0.45, PALETTE.mid)
  g.addColorStop(1, PALETTE.deep)
  c.fillStyle = g
  c.fillRect(0, 0, W, H)

  // 光柱
  c.save()
  c.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 4; i++) {
    const x = 40 + i * 95 + Math.sin(t / 2600 + i * 1.7) * 20
    const grd = c.createLinearGradient(0, 0, 0, H * 0.8)
    grd.addColorStop(0, 'rgba(255,255,255,.10)')
    grd.addColorStop(1, 'rgba(255,255,255,0)')
    c.fillStyle = grd
    c.beginPath()
    c.moveTo(x - 14, 0)
    c.lineTo(x + 14, 0)
    c.lineTo(x + 60, H * 0.8)
    c.lineTo(x - 10, H * 0.8)
    c.fill()
  }
  c.restore()

  // 背景里慢慢往上飘的小泡泡
  c.strokeStyle = 'rgba(255,255,255,.22)'
  c.lineWidth = 1
  for (let i = 0; i < 14; i++) {
    const speed = 0.012 + (i % 5) * 0.004
    const y = H - ((t * speed + i * 97) % (H + 40))
    const x = ((i * 53) % W) + Math.sin(t / 900 + i) * 6
    c.beginPath()
    c.arc(x, y, 1.5 + (i % 3), 0, TAU)
    c.stroke()
  }

  // 沙地
  c.fillStyle = PALETTE.sand
  c.beginPath()
  c.moveTo(0, H - FLOOR)
  for (let x = 0; x <= W; x += 20) c.lineTo(x, H - FLOOR + Math.sin(x / 37) * 3)
  c.lineTo(W, H)
  c.lineTo(0, H)
  c.fill()
  c.fillStyle = 'rgba(160,120,60,.25)'
  for (let i = 0; i < 26; i++) {
    c.beginPath()
    c.arc((i * 61) % W, H - FLOOR + 8 + ((i * 7) % 12), 1.4, 0, TAU)
    c.fill()
  }
}

function deadline(c: Ctx, danger: number, t: number): void {
  c.save()
  c.setLineDash([6, 6])
  c.lineWidth = 1.5
  if (danger > 0) {
    const pulse = (Math.sin(t / 90) + 1) / 2
    c.strokeStyle = `rgba(255,93,115,${0.5 + pulse * 0.5})`
    c.lineWidth = 2 + danger * 2
  } else {
    c.strokeStyle = 'rgba(255,255,255,.35)'
  }
  c.beginPath()
  c.moveTo(0, DEADLINE)
  c.lineTo(W, DEADLINE)
  c.stroke()
  c.restore()
}

function drawBursts(c: Ctx, now: number): void {
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i]
    const life = b.big ? 900 : 480
    const k = (now - b.t0) / life
    if (k >= 1) {
      bursts.splice(i, 1)
      continue
    }
    const r = rOf(b.tier)
    c.save()
    c.globalAlpha = 1 - k
    c.strokeStyle = '#fff'
    c.lineWidth = 2.5 * (1 - k) + 0.5
    c.beginPath()
    c.arc(b.x, b.y, r * (1 + k * (b.big ? 1.2 : 0.55)), 0, TAU)
    c.stroke()
    c.fillStyle = colorOf(b.tier)
    const n = b.big ? 16 : 8
    for (let j = 0; j < n; j++) {
      const a = (j / n) * TAU + b.tier
      const d = r * (0.9 + k * (b.big ? 1.6 : 0.9))
      c.beginPath()
      c.arc(b.x + Math.cos(a) * d, b.y + Math.sin(a) * d, (b.big ? 5 : 3.2) * (1 - k * 0.6), 0, TAU)
      c.fill()
    }
    c.restore()
  }
}

const easeOutBack = (x: number): number => 1 + 2.4 * (x - 1) ** 3 + 1.4 * (x - 1) ** 2

export type SceneOpts = { now: number; head: HTMLImageElement | null; nextLabel: string; showAim: boolean; pearls?: number }

/** 画一帧。c 已经按 devicePixelRatio 和缩放比设好了变换，单位是逻辑像素。 */
export function drawScene(c: Ctx, game: Game, o: SceneOpts): void {
  const t = o.now
  background(c, t)
  // 震屏：背景不动，罐子里的东西一起晃
  c.save()
  if (t < shakeUntil) {
    const k = 1 - (t - shakeStart) / (shakeUntil - shakeStart)
    const a = shakeAmp * k * k
    c.translate(Math.sin(t * 0.09) * a, Math.cos(t * 0.13) * a * 0.6)
  }
  deadline(c, game.danger(), t)

  for (const p of game.pieces()) {
    const age = game.time - p.born
    const s = age < 220 ? 0.55 + 0.45 * easeOutBack(Math.max(0, age) / 220) : 1
    c.save()
    c.translate(p.x, p.y)
    c.rotate(p.angle)
    c.scale(s, s)
    drawCreature(c, p.tier, rOf(p.tier), t + p.id * 137, o.head)
    c.restore()
  }
  drawBursts(c, t)
  drawFloaters(c, t)
  c.restore()

  // 准备落下的那一只
  if (!game.isOver) {
    const ready = game.canDrop()
    const r = rOf(game.current)
    const x = game.clampAim(game.aimX)
    if (o.showAim && ready) {
      c.save()
      c.setLineDash([3, 7])
      c.strokeStyle = 'rgba(255,255,255,.4)'
      c.lineWidth = 1.5
      c.beginPath()
      c.moveTo(x, DROP_Y + r + 4)
      c.lineTo(x, H - FLOOR)
      c.stroke()
      c.restore()
    }
    c.save()
    c.globalAlpha = ready ? 1 : 0.35
    c.translate(x, DROP_Y + Math.sin(t / 380) * 2)
    drawCreature(c, game.current, r, t, o.head)
    c.restore()
  }

  // 计分和下一个：手上那只挪到它们下面时淡一点，免得挡住
  const hx = game.clampAim(game.aimX)
  const hr = rOf(game.current)
  const overScore = !game.isOver && hx - hr < 110
  const overNext = !game.isOver && hx + hr > W - 70
  c.save()
  c.globalAlpha = overScore ? 0.35 : 1
  c.fillStyle = '#fff'
  c.shadowColor = 'rgba(10,20,60,.35)'
  c.shadowBlur = 6
  c.font = `800 30px ${FONT}`
  c.textBaseline = 'top'
  c.fillText(String(game.score), 14, 12)
  c.shadowBlur = 0
  c.font = `600 11px ${FONT}`
  c.textAlign = 'right'
  c.globalAlpha = overNext ? 0.3 : 0.8
  c.fillText(o.nextLabel, W - 14, 12)
  c.globalAlpha = overNext ? 0.35 : 1
  c.translate(W - 30, 46)
  const nr = TIERS[game.next].r
  const k = Math.min(1, 15 / nr)
  c.scale(k, k)
  drawCreature(c, game.next, nr, t, o.head)
  c.restore()

  if (game.isOver) {
    c.fillStyle = 'rgba(12,22,60,.55)'
    c.fillRect(0, 0, W, H)
  }
}
