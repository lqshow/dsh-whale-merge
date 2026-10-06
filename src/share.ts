// 结算分享卡：一局结束后生成一张 1080×1440（3:4）的图，适合发朋友圈和小红书。
import { FINAL, TIERS } from './game'
import { drawCreature, FONT, PALETTE } from './render'
import { drawAvatar, OUTFITS, type OutfitId } from './outfits'

/** 卡片底部的署名。换成你自己的就行。 */
export const SHARE_BRAND = {
  zh: { line1: '微信搜索公众号「林月半子的AI笔记」', line2: '在 DeepSeek Harness 里装上就能玩' },
  en: { line1: 'Made by 林月半子 (LQ)', line2: 'A DeepSeek Harness plugin' },
}

export type ShareStats = {
  score: number
  best: number
  isRecord: boolean
  maxTier: number
  merges: number
  maxCombo: number
  playMs: number
  pearlsUsed: number
}

const CW = 1080
const CH = 1440
const TAU = Math.PI * 2

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath()
  c.moveTo(x + r, y)
  c.arcTo(x + w, y, x + w, y + h, r)
  c.arcTo(x + w, y + h, x, y + h, r)
  c.arcTo(x, y + h, x, y, r)
  c.arcTo(x, y, x + w, y, r)
  c.closePath()
}

/** 按字数折行（中英混排够用了）。 */
function wrap(c: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = []
  let cur = ''
  for (const ch of text) {
    if (c.measureText(cur + ch).width > maxW && cur) {
      out.push(cur)
      cur = ch
    } else cur += ch
  }
  if (cur) out.push(cur)
  return out
}

function quote(s: ShareStats, zh: boolean): string {
  if (s.maxTier >= FINAL) return zh ? '你真的见到我了！下次带更多同伴来吧' : 'You actually met me! Bring more friends next time'
  if (s.maxTier === FINAL - 1) return zh ? '就差一只虎鲸了，下次一定见面' : 'Just one more orca. See you next time'
  if (s.maxTier >= 7) return zh ? '已经下潜得很深了，再努力一下就能见到我' : 'You dove deep. A bit more and you\'ll find me'
  return zh ? '等 AI 干活的时候，再来找我玩' : 'Come play again while the AI works'
}

const fmtTime = (ms: number): string => {
  const s = Math.round(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export async function makeShareCard(s: ShareStats, zh: boolean, assets: { full: string; head: string; outfit?: OutfitId }): Promise<HTMLCanvasElement> {
  const [full, head] = await Promise.all([loadImg(assets.full), loadImg(assets.head)])
  const cv = document.createElement('canvas')
  cv.width = CW
  cv.height = CH
  const c = cv.getContext('2d')!

  // 背景：和游戏里同一片海
  const g = c.createLinearGradient(0, 0, 0, CH)
  g.addColorStop(0, PALETTE.surface)
  g.addColorStop(0.5, PALETTE.mid)
  g.addColorStop(1, PALETTE.deep)
  c.fillStyle = g
  c.fillRect(0, 0, CW, CH)
  c.save()
  c.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 5; i++) {
    const x = 120 + i * 220
    const rg = c.createLinearGradient(0, 0, 0, CH * 0.75)
    rg.addColorStop(0, 'rgba(255,255,255,.10)')
    rg.addColorStop(1, 'rgba(255,255,255,0)')
    c.fillStyle = rg
    c.beginPath()
    c.moveTo(x - 30, 0)
    c.lineTo(x + 30, 0)
    c.lineTo(x + 150, CH * 0.75)
    c.lineTo(x - 20, CH * 0.75)
    c.fill()
  }
  c.restore()
  c.strokeStyle = 'rgba(255,255,255,.25)'
  c.lineWidth = 2
  for (let i = 0; i < 26; i++) {
    c.beginPath()
    c.arc((i * 211) % CW, (i * 337) % CH, 3 + (i % 4) * 2, 0, TAU)
    c.stroke()
  }

  c.fillStyle = '#fff'
  c.textBaseline = 'alphabetic'

  // 标题
  c.font = `800 44px ${FONT}`
  c.fillText(zh ? '合成大鲸鱼' : 'Whale Merge', 80, 120)
  c.globalAlpha = 0.7
  c.font = `500 28px ${FONT}`
  const d = new Date()
  c.fillText(`${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`, 80, 166)
  c.globalAlpha = 1

  // 分数
  c.font = `900 200px ${FONT}`
  c.shadowColor = 'rgba(10,20,60,.35)'
  c.shadowBlur = 20
  c.fillText(String(s.score), 72, 380)
  const sw = c.measureText(String(s.score)).width
  c.shadowBlur = 0
  c.font = `700 48px ${FONT}`
  c.fillText(zh ? '分' : 'pts', 72 + sw + 16, 380)
  if (s.isRecord) {
    c.font = `800 30px ${FONT}`
    const label = zh ? '新纪录' : 'New record'
    const lw = c.measureText(label).width + 36
    roundRect(c, 80, 410, lw, 52, 26)
    c.fillStyle = '#ffd84d'
    c.fill()
    c.fillStyle = '#1B2147'
    c.fillText(label, 98, 446)
    c.fillStyle = '#fff'
  } else {
    c.globalAlpha = 0.75
    c.font = `600 32px ${FONT}`
    c.fillText(zh ? `最高 ${s.best} 分` : `Best ${s.best}`, 80, 448)
    c.globalAlpha = 1
  }

  // 合成链进度：合到的点亮，没合到的暗着
  c.font = `700 32px ${FONT}`
  c.fillText(zh ? `最远合到：${TIERS[s.maxTier].zh}` : `Furthest: ${TIERS[s.maxTier].en}`, 80, 550)
  let x = 80
  const rowY = 640
  for (let i = 0; i < TIERS.length; i++) {
    const r = 18 + i * 3.2
    x += r
    c.save()
    c.translate(x, rowY + (40 - r) * 0.4)
    c.globalAlpha = i <= s.maxTier ? 1 : 0.22
    drawCreature(c, i, r, 0, head)
    c.restore()
    x += r + 8
  }

  // 数据
  const stats: [string, string][] = zh
    ? [[String(s.merges), '次合成'], [`×${s.maxCombo}`, '最大连锁'], [fmtTime(s.playMs), '用时']]
    : [[String(s.merges), 'merges'], [`×${s.maxCombo}`, 'best chain'], [fmtTime(s.playMs), 'time']]
  stats.forEach(([v, k], i) => {
    const sx = 80 + i * 320
    c.font = `800 64px ${FONT}`
    c.fillText(v, sx, 790)
    c.globalAlpha = 0.7
    c.font = `600 28px ${FONT}`
    c.fillText(k, sx, 834)
    c.globalAlpha = 1
  })

  // 鲸鱼娘 + 她的一句话
  const iy = 900
  const iw = 430
  const ih = full ? Math.round((iw * full.naturalHeight) / full.naturalWidth) : 380
  c.save()
  roundRect(c, 80, iy, iw, ih, 36)
  c.fillStyle = '#fff'
  c.shadowColor = 'rgba(10,20,60,.4)'
  c.shadowBlur = 30
  c.fill()
  c.shadowBlur = 0
  c.clip()
  if (full) c.drawImage(full, 80, iy, iw, ih)
  c.restore()
  c.lineWidth = 10
  c.strokeStyle = '#fff'
  roundRect(c, 80, iy, iw, ih, 36)
  c.stroke()

  // 穿着的造型：照片右上角挂一个头像徽章
  const outfit = assets.outfit ?? 'maid'
  if (outfit !== 'maid') {
    c.save()
    c.translate(80 + iw - 20, iy + 20)
    drawAvatar(c, outfit, 66, head)
    c.restore()
  }

  const bx = 560
  const bw = CW - bx - 80
  c.font = `600 36px ${FONT}`
  const lines = wrap(c, quote(s, zh), bw - 64)
  const bh = 60 + lines.length * 54
  const by = iy + 40
  roundRect(c, bx, by, bw, bh, 30)
  c.fillStyle = 'rgba(255,255,255,.96)'
  c.fill()
  c.beginPath()
  c.moveTo(bx, by + 50)
  c.lineTo(bx - 26, by + 70)
  c.lineTo(bx, by + 90)
  c.fill()
  c.fillStyle = '#1B2147'
  lines.forEach((l, i) => c.fillText(l, bx + 32, by + 70 + i * 54))
  c.fillStyle = '#fff'
  c.globalAlpha = 0.85
  c.font = `700 30px ${FONT}`
  const o = OUTFITS.find(x => x.id === outfit)!
  c.fillText(zh ? `—— 鲸鱼娘 · ${o.zh}` : `— Whale girl · ${o.en}`, bx + 32, by + bh + 56)
  c.globalAlpha = 1

  // 署名
  const brand = zh ? SHARE_BRAND.zh : SHARE_BRAND.en
  c.font = `700 32px ${FONT}`
  c.fillText(brand.line1, 80, CH - 108)
  c.globalAlpha = 0.7
  c.font = `500 26px ${FONT}`
  c.fillText(brand.line2, 80, CH - 64)
  c.globalAlpha = 1
  return cv
}
