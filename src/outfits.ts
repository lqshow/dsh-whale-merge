// 鲸鱼娘的造型。每套造型都有一个现画的头饰（立刻能用），
// 也可以配一张真正的造型图：把图片放进 src/assets/outfits/，在下面 IMAGES 里登记一行就行。
// 有图片时游戏和相册用图片，头饰就不再叠加。

type Ctx = CanvasRenderingContext2D
const TAU = Math.PI * 2

export type OutfitId =
  | 'maid' | 'diver' | 'dj' | 'crown' | 'flowers' | 'stars' | 'reviewer'
  | 'pearls' | 'dolphin' | 'scholar' | 'sleepy' | 'sailor'

export type Outfit = { id: OutfitId; zh: string; en: string; descZh: string; descEn: string }

export const OUTFITS: Outfit[] = [
  { id: 'maid', zh: '女仆装', en: 'Maid', descZh: '最初的样子', descEn: 'Where it all began' },
  { id: 'diver', zh: '深海潜水员', en: 'Deep diver', descZh: '不靠别人，自己潜到深处', descEn: 'Dove deep on her own' },
  { id: 'dj', zh: '连锁 DJ', en: 'Chain DJ', descZh: '节奏一上来就停不下', descEn: 'Once the beat drops, it chains' },
  { id: 'crown', zh: '海洋女王', en: 'Ocean queen', descZh: '两千分的王冠', descEn: 'A crown worth 2000 points' },
  { id: 'flowers', zh: '初见花冠', en: 'First-meet flowers', descZh: '第一次见面的纪念', descEn: 'To remember our first meeting' },
  { id: 'stars', zh: '双子星', en: 'Twin stars', descZh: '两只鲸鱼娘一起游走时留下的', descEn: 'Left behind by two whale girls' },
  { id: 'reviewer', zh: '代码审查员', en: 'Code reviewer', descZh: '认真检查 AI 的作业', descEn: 'Actually reviews the AI\'s work' },
  { id: 'pearls', zh: '珍珠头冠', en: 'Pearl tiara', descZh: '十颗珍珠串起来的', descEn: 'Strung from ten pearls' },
  { id: 'dolphin', zh: '海豚发卡', en: 'Dolphin clip', descZh: '只有知道暗号的人才有', descEn: 'Only for those who know the word' },
  { id: 'scholar', zh: '博学学士', en: 'Scholar', descZh: '所有卡片都读过了', descEn: 'Read every single card' },
  { id: 'sleepy', zh: '困困睡帽', en: 'Sleepy cap', descZh: '陪你等了很久很久', descEn: 'Waited with you a long, long time' },
  { id: 'sailor', zh: '老水手', en: 'Old sailor', descZh: '出海十次的老手', descEn: 'Ten voyages and counting' },
]

/**
 * 造型图（可选）。图片建议：正方形、头部特写、和 whale-girl-head.jpg 构图一致。
 * 例：import diverImg from './assets/outfits/diver.jpg' 然后写 diver: diverImg
 */
export const IMAGES: Partial<Record<OutfitId, string>> = {}

const imgCache = new Map<string, HTMLImageElement>()
export function outfitImage(id: OutfitId): HTMLImageElement | null {
  const src = IMAGES[id]
  if (!src) return null
  let img = imgCache.get(src)
  if (!img) {
    img = new Image()
    img.src = src
    imgCache.set(src, img)
  }
  return img
}

// ---------- 小零件 ----------
function star(c: Ctx, x: number, y: number, R: number, rot = 0): void {
  c.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + (i / 10) * TAU
    const rr = i % 2 === 0 ? R : R * 0.45
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
  }
  c.closePath()
}

function outline(c: Ctx, w: number, color = 'rgba(20,25,60,.55)'): void {
  c.lineWidth = w
  c.strokeStyle = color
  c.lineJoin = 'round'
  c.lineCap = 'round'
  c.stroke()
}

/** 在半径 R 的头像圆上画头饰。原点是头像圆心，眼睛大约在 y = +0.08R、x = ±0.27R。 */
export function drawAccessory(c: Ctx, id: OutfitId, R: number): void {
  const lw = Math.max(1, R * 0.035)
  c.save()
  switch (id) {
    case 'maid':
      break
    case 'diver': {
      // 额头上的潜水镜 + 右边的呼吸管
      c.beginPath()
      c.moveTo(-0.95 * R, -0.25 * R)
      c.quadraticCurveTo(0, -0.62 * R, 0.95 * R, -0.25 * R)
      c.lineWidth = R * 0.1
      c.strokeStyle = '#1f2a44'
      c.stroke()
      for (const s of [-1, 1]) {
        c.beginPath()
        c.ellipse(s * 0.28 * R, -0.42 * R, 0.24 * R, 0.19 * R, 0, 0, TAU)
        c.fillStyle = '#ffb02e'
        c.fill()
        outline(c, lw)
        c.beginPath()
        c.ellipse(s * 0.28 * R, -0.42 * R, 0.17 * R, 0.13 * R, 0, 0, TAU)
        c.fillStyle = 'rgba(140,220,255,.85)'
        c.fill()
        c.beginPath()
        c.ellipse(s * 0.28 * R - 0.06 * R, -0.46 * R, 0.05 * R, 0.03 * R, -0.5, 0, TAU)
        c.fillStyle = '#fff'
        c.fill()
      }
      c.beginPath()
      c.moveTo(0.82 * R, 0.15 * R)
      c.lineTo(0.92 * R, -0.75 * R)
      c.quadraticCurveTo(0.95 * R, -0.95 * R, 0.78 * R, -0.98 * R)
      c.lineWidth = R * 0.11
      c.strokeStyle = '#ffb02e'
      c.stroke()
      outline(c, lw * 0.6)
      break
    }
    case 'dj': {
      c.beginPath()
      c.arc(0, -0.05 * R, 0.98 * R, Math.PI * 1.08, Math.PI * 1.92)
      c.lineWidth = R * 0.13
      c.strokeStyle = '#2b2f45'
      c.stroke()
      for (const s of [-1, 1]) {
        c.beginPath()
        c.ellipse(s * 0.92 * R, 0.02 * R, 0.17 * R, 0.3 * R, 0, 0, TAU)
        c.fillStyle = '#ff6fae'
        c.fill()
        outline(c, lw)
        c.beginPath()
        c.ellipse(s * 0.92 * R, 0.02 * R, 0.08 * R, 0.17 * R, 0, 0, TAU)
        c.fillStyle = '#2b2f45'
        c.fill()
      }
      c.fillStyle = '#fff'
      c.font = `900 ${R * 0.22}px system-ui, sans-serif`
      c.textAlign = 'center'
      c.fillText('♪', 0.7 * R, -0.78 * R)
      c.fillText('♫', -0.62 * R, -0.86 * R)
      break
    }
    case 'crown': {
      const y = -0.78 * R
      c.beginPath()
      c.moveTo(-0.42 * R, y + 0.18 * R)
      c.lineTo(-0.46 * R, y - 0.28 * R)
      c.lineTo(-0.22 * R, y - 0.06 * R)
      c.lineTo(0, y - 0.4 * R)
      c.lineTo(0.22 * R, y - 0.06 * R)
      c.lineTo(0.46 * R, y - 0.28 * R)
      c.lineTo(0.42 * R, y + 0.18 * R)
      c.closePath()
      const g = c.createLinearGradient(0, y - 0.4 * R, 0, y + 0.2 * R)
      g.addColorStop(0, '#fff3a0')
      g.addColorStop(1, '#f2b705')
      c.fillStyle = g
      c.fill()
      outline(c, lw, '#a8740a')
      for (const [x, col] of [[-0.24, '#ff5d73'], [0, '#4D6BFE'], [0.24, '#3ccf91']] as const) {
        c.beginPath()
        c.arc(x * R, y + 0.06 * R, 0.065 * R, 0, TAU)
        c.fillStyle = col
        c.fill()
      }
      break
    }
    case 'flowers': {
      const cols = ['#ff9ec7', '#ffffff', '#ffd36e', '#ff9ec7', '#c9a7ff', '#ffffff', '#ff9ec7']
      cols.forEach((col, i) => {
        const a = Math.PI * (1.12 + (i / (cols.length - 1)) * 0.76)
        const x = Math.cos(a) * 0.86 * R
        const y = Math.sin(a) * 0.86 * R
        for (let k = 0; k < 5; k++) {
          const pa = (k / 5) * TAU + i
          c.beginPath()
          c.arc(x + Math.cos(pa) * 0.075 * R, y + Math.sin(pa) * 0.075 * R, 0.065 * R, 0, TAU)
          c.fillStyle = col
          c.fill()
        }
        c.beginPath()
        c.arc(x, y, 0.045 * R, 0, TAU)
        c.fillStyle = '#ffb02e'
        c.fill()
      })
      break
    }
    case 'stars': {
      for (const [x, y, s, rot] of [[-0.62, -0.62, 0.17, -0.3], [0.64, -0.58, 0.15, 0.25], [0.78, -0.3, 0.08, 0]] as const) {
        star(c, x * R, y * R, s * R, rot)
        c.fillStyle = '#ffd84d'
        c.fill()
        outline(c, lw, '#c99a00')
      }
      break
    }
    case 'reviewer': {
      for (const s of [-1, 1]) {
        c.beginPath()
        c.arc(s * 0.27 * R, 0.03 * R, 0.17 * R, 0, TAU)
        c.fillStyle = 'rgba(200,230,255,.25)'
        c.fill()
        outline(c, R * 0.045, '#1f2433')
      }
      c.beginPath()
      c.moveTo(-0.1 * R, 0.01 * R)
      c.quadraticCurveTo(0, -0.05 * R, 0.1 * R, 0.01 * R)
      outline(c, R * 0.04, '#1f2433')
      // 夹在耳边的笔
      c.save()
      c.translate(0.72 * R, -0.5 * R)
      c.rotate(0.9)
      c.fillStyle = '#ffd84d'
      c.fillRect(-0.04 * R, -0.28 * R, 0.08 * R, 0.5 * R)
      c.fillStyle = '#ff8b70'
      c.fillRect(-0.04 * R, -0.32 * R, 0.08 * R, 0.06 * R)
      c.beginPath()
      c.moveTo(-0.04 * R, 0.22 * R)
      c.lineTo(0.04 * R, 0.22 * R)
      c.lineTo(0, 0.32 * R)
      c.fillStyle = '#f3d7b0'
      c.fill()
      c.restore()
      break
    }
    case 'pearls': {
      c.beginPath()
      c.arc(0, 0, 0.8 * R, Math.PI * 1.1, Math.PI * 1.9)
      c.lineWidth = R * 0.03
      c.strokeStyle = '#d9c4ff'
      c.stroke()
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI * (1.1 + (i / 10) * 0.8)
        const big = i === 5
        const rr = (big ? 0.1 : 0.055) * R
        const x = Math.cos(a) * 0.8 * R
        const y = Math.sin(a) * 0.8 * R - (big ? 0.06 * R : 0)
        const g = c.createRadialGradient(x - rr * 0.4, y - rr * 0.4, rr * 0.1, x, y, rr)
        g.addColorStop(0, '#ffffff')
        g.addColorStop(1, '#e6dcff')
        c.beginPath()
        c.arc(x, y, rr, 0, TAU)
        c.fillStyle = g
        c.fill()
        outline(c, lw * 0.5, 'rgba(120,100,180,.5)')
      }
      break
    }
    case 'dolphin': {
      c.translate(0.58 * R, -0.66 * R)
      c.rotate(-0.35)
      c.beginPath()
      c.ellipse(0, 0, 0.26 * R, 0.12 * R, 0, 0, TAU)
      c.fillStyle = '#78b9ff'
      c.fill()
      outline(c, lw)
      c.beginPath()
      c.moveTo(-0.02 * R, -0.1 * R)
      c.lineTo(0.06 * R, -0.24 * R)
      c.lineTo(0.12 * R, -0.08 * R)
      c.fillStyle = '#5c9ff0'
      c.fill()
      c.beginPath()
      c.moveTo(-0.24 * R, 0)
      c.lineTo(-0.38 * R, -0.1 * R)
      c.lineTo(-0.36 * R, 0.1 * R)
      c.closePath()
      c.fill()
      c.beginPath()
      c.ellipse(0.04 * R, 0.05 * R, 0.16 * R, 0.05 * R, 0, 0, TAU)
      c.fillStyle = '#e3f1ff'
      c.fill()
      c.beginPath()
      c.arc(0.14 * R, -0.02 * R, 0.025 * R, 0, TAU)
      c.fillStyle = '#1B2147'
      c.fill()
      break
    }
    case 'scholar': {
      const y = -0.8 * R
      c.beginPath()
      c.ellipse(0, y + 0.12 * R, 0.38 * R, 0.12 * R, 0, 0, TAU)
      c.fillStyle = '#20253a'
      c.fill()
      c.beginPath()
      c.moveTo(0, y - 0.22 * R)
      c.lineTo(0.62 * R, y)
      c.lineTo(0, y + 0.2 * R)
      c.lineTo(-0.62 * R, y)
      c.closePath()
      c.fillStyle = '#2b3150'
      c.fill()
      outline(c, lw, '#11141f')
      c.beginPath()
      c.moveTo(0, y)
      c.quadraticCurveTo(0.4 * R, y + 0.02 * R, 0.5 * R, y + 0.35 * R)
      c.lineWidth = R * 0.03
      c.strokeStyle = '#ffd84d'
      c.stroke()
      c.beginPath()
      c.ellipse(0.5 * R, y + 0.42 * R, 0.04 * R, 0.09 * R, 0, 0, TAU)
      c.fillStyle = '#ffd84d'
      c.fill()
      c.beginPath()
      c.arc(0, y, 0.035 * R, 0, TAU)
      c.fillStyle = '#ffd84d'
      c.fill()
      break
    }
    case 'sleepy': {
      c.beginPath()
      c.moveTo(-0.7 * R, -0.55 * R)
      c.quadraticCurveTo(-0.2 * R, -1.25 * R, 0.55 * R, -1.0 * R)
      c.quadraticCurveTo(0.95 * R, -0.85 * R, 0.98 * R, -0.35 * R)
      c.quadraticCurveTo(0.6 * R, -0.75 * R, 0.62 * R, -0.5 * R)
      c.quadraticCurveTo(0, -0.62 * R, -0.7 * R, -0.55 * R)
      c.fillStyle = '#6c7dff'
      c.fill()
      outline(c, lw)
      c.beginPath()
      c.moveTo(-0.74 * R, -0.5 * R)
      c.quadraticCurveTo(0, -0.7 * R, 0.66 * R, -0.46 * R)
      c.lineWidth = R * 0.12
      c.strokeStyle = '#ffffff'
      c.stroke()
      for (const [x, y] of [[-0.25, -0.86], [0.2, -0.92], [0.6, -0.78]] as const) {
        star(c, x * R, y * R, 0.05 * R)
        c.fillStyle = '#ffe680'
        c.fill()
      }
      c.beginPath()
      c.arc(0.98 * R, -0.3 * R, 0.11 * R, 0, TAU)
      c.fillStyle = '#fff'
      c.fill()
      outline(c, lw * 0.6)
      c.fillStyle = '#fff'
      c.font = `800 ${R * 0.2}px system-ui, sans-serif`
      c.fillText('z', -0.92 * R, -0.62 * R)
      c.font = `800 ${R * 0.14}px system-ui, sans-serif`
      c.fillText('z', -1.0 * R, -0.82 * R)
      break
    }
    case 'sailor': {
      const y = -0.78 * R
      c.beginPath()
      c.ellipse(0, y, 0.34 * R, 0.24 * R, 0, Math.PI, TAU)
      c.fillStyle = '#ffffff'
      c.fill()
      outline(c, lw)
      c.beginPath()
      c.rect(-0.34 * R, y - 0.02 * R, 0.68 * R, 0.1 * R)
      c.fillStyle = '#23336e'
      c.fill()
      c.beginPath()
      c.ellipse(0, y + 0.1 * R, 0.5 * R, 0.1 * R, 0, 0, TAU)
      c.fillStyle = '#ffffff'
      c.fill()
      outline(c, lw)
      // 小锚
      c.strokeStyle = '#4D6BFE'
      c.lineWidth = R * 0.03
      c.beginPath()
      c.moveTo(0, y - 0.18 * R)
      c.lineTo(0, y - 0.04 * R)
      c.moveTo(-0.06 * R, y - 0.08 * R)
      c.quadraticCurveTo(0, y, 0.06 * R, y - 0.08 * R)
      c.stroke()
      break
    }
  }
  c.restore()
}

/** 头像圆：图片（或备用色块）+ 外圈 + 头饰。相册、游戏、分享卡共用。 */
export function drawAvatar(c: Ctx, id: OutfitId, r: number, base: HTMLImageElement | null, locked = false): void {
  c.save()
  c.beginPath()
  c.arc(0, 0, r, 0, TAU)
  c.fillStyle = locked ? '#2a3150' : '#ffffff'
  c.fill()
  c.lineWidth = r * 0.06
  c.strokeStyle = locked ? 'rgba(255,255,255,.25)' : '#4D6BFE'
  c.stroke()
  const inner = r * 0.9
  const own = outfitImage(id)
  const img = own && own.complete && own.naturalWidth > 0 ? own : base
  c.save()
  c.beginPath()
  c.arc(0, 0, inner, 0, TAU)
  c.clip()
  if (img && img.complete && img.naturalWidth > 0) c.drawImage(img, -inner, -inner, inner * 2, inner * 2)
  else {
    c.fillStyle = '#4a7fd6'
    c.fillRect(-inner, -inner, inner * 2, inner * 2)
  }
  if (locked) {
    c.fillStyle = 'rgba(16,22,52,.88)'
    c.fillRect(-inner, -inner, inner * 2, inner * 2)
  }
  c.restore()
  if (locked) {
    c.fillStyle = 'rgba(255,255,255,.55)'
    c.font = `800 ${r * 0.7}px system-ui, sans-serif`
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillText('?', 0, r * 0.04)
  } else if (!own) drawAccessory(c, id, inner)
  c.restore()
}
