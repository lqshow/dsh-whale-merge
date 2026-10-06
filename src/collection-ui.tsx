// 收集面板：图鉴 / 卡片 / 成就 / 相册 四个标签页，盖在游戏面板上。
import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { ACHIEVEMENTS, dex, equip, equipped, outfitUnlocked, progress, seenCards, unlocked } from './collection'
import { FACTS } from './facts'
import { TIERS } from './game'
import { drawAvatar, OUTFITS } from './outfits'
import { drawCreature, FONT, PALETTE } from './render'

export type Tab = 'dex' | 'cards' | 'ach' | 'album'

const TXT = {
  zh: {
    tabs: { dex: '图鉴', cards: '卡片', ach: '成就', album: '相册' } as Record<Tab, string>,
    close: '关闭',
    unknown: '？？？',
    found: (d: number) => `${new Date(d).getMonth() + 1}月${new Date(d).getDate()}日发现`,
    notFound: '还没合出来过',
    cardLocked: '合成出水母或更大的生物时，鲸鱼娘会念给你听',
    reward: (n: string) => `奖励造型：${n}`,
    wearing: '穿着中',
    wear: '点一下换上',
    locked: (how: string) => `解锁条件：${how}`,
    base: '默认造型',
    progress: (a: number, b: number) => `${a} / ${b}`,
  },
  en: {
    tabs: { dex: 'Guide', cards: 'Cards', ach: 'Goals', album: 'Album' } as Record<Tab, string>,
    close: 'Close',
    unknown: '???',
    found: (d: number) => `Found ${new Date(d).toLocaleDateString()}`,
    notFound: 'Not merged yet',
    cardLocked: 'The whale girl reads these when you merge a jellyfish or bigger',
    reward: (n: string) => `Unlocks outfit: ${n}`,
    wearing: 'Wearing',
    wear: 'Tap to wear',
    locked: (how: string) => `To unlock: ${how}`,
    base: 'Default outfit',
    progress: (a: number, b: number) => `${a} / ${b}`,
  },
}

/** 一个小画布，画完就不动了；图片还没加载好时过一会儿再画一次。 */
function Mini(props: { size: number; draw: (c: CanvasRenderingContext2D, s: number) => void; deps: unknown[] }): React.ReactNode {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    cv.width = props.size * dpr
    cv.height = props.size * dpr
    const paint = (): void => {
      const c = cv.getContext('2d')
      if (!c) return
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      c.globalCompositeOperation = 'source-over'
      c.clearRect(0, 0, props.size, props.size)
      c.save()
      c.translate(props.size / 2, props.size / 2)
      props.draw(c, props.size)
      c.restore()
    }
    paint()
    const id = setTimeout(paint, 300)
    return () => clearTimeout(id)
  }, props.deps)
  return <canvas ref={ref} style={{ width: props.size, height: props.size, display: 'block' }} />
}

export function CollectionPanel(props: { zh: boolean; head: HTMLImageElement | null; initial?: Tab; onClose: () => void; onEquip: () => void }): React.ReactNode {
  const t = props.zh ? TXT.zh : TXT.en
  const [tab, setTab] = useState<Tab>(props.initial ?? 'dex')
  const [, setTick] = useState(0)
  const p = progress()
  const counts: Record<Tab, string> = {
    dex: t.progress(p.dex, p.dexTotal),
    cards: t.progress(p.cards, p.cardsTotal),
    ach: t.progress(p.ach, p.achTotal),
    album: t.progress(p.ach + 1, OUTFITS.length),
  }
  const name = (zh: string, en: string): string => (props.zh ? zh : en)
  const card: React.CSSProperties = { background: 'rgba(255,255,255,.07)', borderRadius: 12, padding: 10 }
  const dim: React.CSSProperties = { opacity: 0.6, fontSize: 12 }

  return (
    <div
      onPointerDown={e => e.stopPropagation()}
      onKeyDown={e => {
        e.stopPropagation()
        if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') props.onClose()
      }}
      style={{ position: 'absolute', inset: 0, zIndex: 6, background: 'rgba(12,20,52,.96)', color: '#fff', display: 'flex', flexDirection: 'column', fontFamily: FONT, fontSize: 13, lineHeight: 1.5 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 10px 0', flexWrap: 'wrap' }}>
        {(Object.keys(t.tabs) as Tab[]).map(k => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            style={{
              border: 'none', cursor: 'pointer', font: 'inherit', padding: '6px 10px', borderRadius: 999,
              background: tab === k ? PALETTE.accent : 'transparent', color: '#fff', fontWeight: tab === k ? 700 : 500, opacity: tab === k ? 1 : 0.75,
            }}
          >
            {t.tabs[k]} <span style={{ fontSize: 11, opacity: 0.75 }}>{counts[k]}</span>
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button type="button" onClick={props.onClose} style={{ border: 'none', background: 'none', color: '#fff', cursor: 'pointer', font: 'inherit', opacity: 0.75 }}>
          {t.close} (C)
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
        {tab === 'dex' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
            {TIERS.map((tier, i) => {
              const at = dex()[i]
              return (
                <div key={tier.id} style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center' }}>
                  <Mini
                    size={64}
                    deps={[!!at]}
                    draw={c => {
                      drawCreature(c, i, 26, 0, props.head)
                      if (!at) {
                        // 没发现的画成剪影
                        c.globalCompositeOperation = 'source-atop'
                        c.fillStyle = 'rgb(88,104,168)'
                        c.fillRect(-32, -32, 64, 64)
                      }
                    }}
                  />
                  <b>{at ? name(tier.zh, tier.en) : t.unknown}</b>
                  <span style={dim}>{at ? t.found(at) : t.notFound}</span>
                </div>
              )
            })}
          </div>
        ) : null}

        {tab === 'cards' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(() => {
              const seen = new Set(seenCards())
              const known = FACTS.filter(f => seen.has(f.id))
              const rest = FACTS.length - known.length
              return (
                <>
                  {known.map(f => (
                    <div key={f.id} style={card}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9fb2ff' }}>{f.tag}</div>
                      <div>{props.zh ? f.zh : (f.en ?? f.zh)}</div>
                    </div>
                  ))}
                  {rest > 0 ? (
                    <div style={{ ...card, opacity: 0.6, borderStyle: 'dashed' }}>
                      {props.zh ? `还有 ${rest} 张没看过。` : `${rest} more to find. `}
                      {t.cardLocked}
                    </div>
                  ) : null}
                </>
              )
            })()}
          </div>
        ) : null}

        {tab === 'ach' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ACHIEVEMENTS.map(a => {
              const at = unlocked()[a.id]
              const o = OUTFITS.find(x => x.id === a.outfit)!
              return (
                <div key={a.id} style={{ ...card, display: 'flex', gap: 10, alignItems: 'center', opacity: at ? 1 : 0.7 }}>
                  <Mini size={44} deps={[!!at]} draw={c => drawAvatar(c, a.outfit, 19, props.head, !at)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>
                      {at ? '★ ' : ''}
                      {name(a.zh, a.en)}
                    </div>
                    <div style={dim}>{name(a.howZh, a.howEn)}</div>
                    <div style={{ ...dim, opacity: 0.8, color: at ? '#ffd84d' : undefined }}>{t.reward(name(o.zh, o.en))}</div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}

        {tab === 'album' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
            {OUTFITS.map(o => {
              const open = outfitUnlocked(o.id)
              const on = equipped() === o.id
              const a = ACHIEVEMENTS.find(x => x.outfit === o.id)
              return (
                <button
                  key={o.id}
                  type="button"
                  disabled={!open}
                  onClick={() => {
                    equip(o.id)
                    props.onEquip()
                    setTick(x => x + 1)
                  }}
                  style={{
                    ...card, border: on ? `2px solid ${PALETTE.accent}` : '2px solid transparent', color: '#fff', font: 'inherit', cursor: open ? 'pointer' : 'default',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, textAlign: 'center',
                  }}
                >
                  <Mini size={84} deps={[open]} draw={c => drawAvatar(c, o.id, 32, props.head, !open)} />
                  <b>{open ? name(o.zh, o.en) : t.unknown}</b>
                  <span style={dim}>{open ? name(o.descZh, o.descEn) : t.locked(a ? name(a.howZh, a.howEn) : '')}</span>
                  {open ? <span style={{ fontSize: 11, color: on ? '#9fb2ff' : 'rgba(255,255,255,.5)' }}>{on ? t.wearing : o.id === 'maid' ? t.base : t.wear}</span> : null}
                </button>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
