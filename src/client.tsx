// 合成大鲸鱼 · DeepSeek Harness 原生插件（浏览器端入口）
// 注册三样东西：右侧边栏的游戏标签页、输入框上方的提示条、会话运行状态监听。
import * as React from 'react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { DEADLINE, FINAL, Game, H, PEARL, SHAKES_PER_GAME, TIERS, W } from './game'
import { type Fact, queueFor } from './facts'
import { line, SECRET } from './talk'
import { addBurst, addFloat, drawCreature, drawScene, FONT, kick, PALETTE, setOutfit, TIER_COLOR } from './render'
import { type Achievement, type AchievementId, bumpStats, discover, equipped, progress, unlock } from './collection'
import { CollectionPanel, type Tab } from './collection-ui'
import { FACTS } from './facts'
import { OUTFITS } from './outfits'
import { makeShareCard, type ShareStats } from './share'
import { sfx } from './sound'
import headSrc from './assets/whale-girl-head.jpg'
import fullSrc from './assets/whale-girl.jpg'

const ID = '@linyuebanzi/dsh-whale-merge'
const KIND = 'whale-merge'
const HINT_AFTER_MS = 5000
const CARD_FROM_TIER = 3
const AIM_SPEED = 300 // 方向键移动速度，逻辑像素/秒

// ---------- 语言：跟随 DSH 写在 <html lang> 上的界面语言 ----------
const isZh = (): boolean => {
  try {
    return (document.documentElement.lang || navigator.language || '').toLowerCase().startsWith('zh')
  } catch {
    return true
  }
}
const ZH = {
  title: '合成大鲸鱼',
  guide: '等 DeepSeek 干活时，合一只鲸鱼娘',
  busy: 'DeepSeek 还在干活',
  done: 'DeepSeek 干完了，回去看看吧',
  play: '合一把',
  mute: '本会话不再提示',
  next: '下一个',
  help: '移动鼠标或按 ← → 对准，点击或按空格放下。两只一样的碰在一起会合成更大的。',
  over: '这局结束了',
  score: (a: number, b: number) => `本局 ${a} 分 · 最高 ${b} 分`,
  restart: '再来一局',
  final: '合成了鲸鱼娘！',
  double: '两只鲸鱼娘一起游走啦 +100',
  sound: '音效',
  best: (b: number) => `最高 ${b}`,
  tags: { DSH: 'DSH', 模型: '模型', 概念: '概念', 技巧: '技巧', 彩蛋: '彩蛋' } as Record<string, string>,
  chain: '合成链',
  shake: (n: number) => `摇一摇 ×${n}`,
  dexBtn: (a: number, b: number) => `图鉴 ${a}/${b}`,
  pearl: (n: number) => `珍珠 ×${n}`,
  shareBtn: '生成分享卡',
  sharing: '生成中…',
  copy: '复制图片',
  saveImg: '保存图片',
  close: '关闭',
  copied: '已复制，去微信或小红书粘贴吧',
  copyFail: '复制不了，右键图片另存为也行',
  shakeTip: '卡住了就摇一摇（S），每局两次',
  pearlTip: '珍珠：碰到谁，谁就升一级（E）。DeepSeek 干完活、你检查完回来就送',
  giftPending: (n: number) => `DeepSeek 干完了 · 去看一眼，回来领 ${n} 颗珍珠`,
}
const EN: typeof ZH = {
  title: 'Whale Merge',
  guide: 'Merge sea creatures while DeepSeek works',
  busy: 'DeepSeek is still working',
  done: 'DeepSeek is done. Back to work',
  play: 'Play',
  mute: 'Not this session',
  next: 'Next',
  help: 'Aim with the mouse or ← →, click or press Space to drop. Two of the same merge into a bigger one.',
  over: 'Game over',
  score: (a: number, b: number) => `Score ${a} · Best ${b}`,
  restart: 'Play again',
  final: 'You merged a whale girl!',
  double: 'Two whale girls swam off together +100',
  sound: 'Sound',
  best: (b: number) => `Best ${b}`,
  tags: { DSH: 'DSH', 模型: 'Models', 概念: 'Concepts', 技巧: 'Tips', 彩蛋: 'Trivia' },
  chain: 'Merge chain',
  shake: (n: number) => `Shake ×${n}`,
  dexBtn: (a: number, b: number) => `Guide ${a}/${b}`,
  pearl: (n: number) => `Pearls ×${n}`,
  shareBtn: 'Make a share card',
  sharing: 'Making…',
  copy: 'Copy image',
  saveImg: 'Save image',
  close: 'Close',
  copied: 'Copied. Paste it anywhere',
  copyFail: 'Couldn\'t copy. Right-click the image to save it',
  shakeTip: 'Stuck? Shake the jar (S), twice per game',
  pearlTip: 'Pearls level up whatever they touch (E). Earn them by reviewing DeepSeek\'s work',
  giftPending: (n: number) => `DeepSeek is done · go take a look, ${n} pearl(s) when you return`,
}
const T = (): typeof ZH => (isZh() ? ZH : EN)

import { load, save } from './storage'

// ---------- 全局状态（切走标签页再回来，这局还在）----------
const newSeed = (): number => (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0
let game = new Game(newSeed(), load('best', 0))
setOutfit(equipped())
let cards: Fact[] = queueFor(load<string[]>('seen', []), newSeed())

let headImg: HTMLImageElement | null = null
const head = (): HTMLImageElement | null => {
  if (headImg) return headImg
  try {
    headImg = new Image()
    headImg.src = headSrc
  } catch {
    headImg = null
  }
  return headImg
}

// ---------- 每个会话的 Agent 运行状态（提示条和面板顶部用）----------
type Running = { since: number | null; muted: boolean; ran: boolean }
const running = new Map<string, Running>()
const listeners = new Set<() => void>()
let version = 0
const emit = (): void => {
  version += 1
  for (const l of listeners) l()
}
const subscribe = (l: () => void): (() => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
const useVersion = (): number => useSyncExternalStore(subscribe, () => version)
const IDLE: Running = { since: null, muted: false, ran: false }
const runningOf = (id: string): Running => running.get(id) ?? IDLE
// ---------- 交作业奖励：DeepSeek 干完活，你离开游戏去看一眼再回来，送珍珠 ----------
const GIFT_MIN_RUN_MS = 8000
const GIFT_AWAY_MS = 3000
const MAX_PEARLS = 9
const gift = { pending: false, count: 0, awayAt: null as number | null }
let gameFocused = false
const pearls = (): number => load('pearls', 0)
const setPearls = (n: number): void => save('pearls', Math.max(0, Math.min(MAX_PEARLS, n)))

/** 干完一轮：跑得越久，珍珠越多（1~3 颗）。 */
function onRunFinished(ms: number): void {
  if (ms < GIFT_MIN_RUN_MS) return
  const n = 1 + (ms >= 60_000 ? 1 : 0) + (ms >= 180_000 ? 1 : 0)
  gift.count = gift.pending ? Math.max(gift.count, n) : n
  gift.pending = true
  gift.awayAt = gameFocused ? null : Date.now()
}
function leaveGame(): void {
  gameFocused = false
  if (gift.pending && gift.awayAt === null) gift.awayAt = Date.now()
}
/** 离开够久就发奖；返回发了几颗。谁调用都行：聚焦、鼠标回到面板、每帧检查。 */
function claimGift(): number {
  if (!gift.pending || gift.awayAt === null || Date.now() - gift.awayAt < GIFT_AWAY_MS) return 0
  gift.pending = false
  gift.awayAt = null
  setPearls(pearls() + gift.count)
  return gift.count
}
/** 回到游戏（真的拿到焦点）时调用。 */
function backToGame(): number {
  gameFocused = true
  return claimGift()
}

function setRunning(id: string, isRunning: boolean): void {
  const cur = runningOf(id)
  if (!isRunning && cur.since !== null) onRunFinished(Date.now() - cur.since)
  const since = isRunning ? (cur.since ?? Date.now()) : null
  if (since === cur.since) return
  running.set(id, { ...cur, since, ran: cur.ran || isRunning })
  emit()
}
let bodyShown = 0

// ---------- 游戏面板 ----------
type Flash = { kind: 'final' | 'double'; until: number } | null
type Talk = { id: number; text: string; tag?: string; pri: number; until: number; visible: boolean }

// 优先级：越大越重要，正在说的话不会被更小的打断
const PRI = { idle: 1, hello: 1, milestone: 2, tired: 2, combo: 2, card: 3, aiDone: 3, item: 4, newDex: 4, gift: 5, firstTier: 5, ach: 7, bigCombo: 6, egg: 6, danger: 7, over: 7, rescue: 8 }
const MILESTONES = [300, 800, 1500, 3000, 5000, 8000]
const CARD_GAP_MS = 8000
const IDLE_MS = 25_000
const IDLE_REPEAT_MS = 45_000
const TIRED_EVERY_MS = 10 * 60_000

function WhaleBody(props: { sessionId: string }): React.ReactNode {
  useVersion()
  const host = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const keys = useRef({ left: false, right: false })
  const showAim = useRef(true)
  const [, setTick] = useState(0)
  const [talk, setTalk] = useState<Talk | null>(null)
  const talkRef = useRef(talk)
  talkRef.current = talk
  const [flash, setFlash] = useState<Flash>(null)
  const [share, setShare] = useState<{ url: string; blob: Blob | null; status: string } | null>(null)
  const [sharing, setSharing] = useState(false)
  const [panel, setPanel] = useState<Tab | null>(null)
  const paused = useRef(false)
  paused.current = panel !== null
  const achQueue = useRef<Achievement[]>([])
  const lastResult = useRef<{ before: number } | null>(null)
  const [muted, setMuted] = useState(load('muted', false))
  const mutedRef = useRef(muted)
  mutedRef.current = muted
  const sessionRef = useRef(props.sessionId)
  sessionRef.current = props.sessionId
  // 这一局的各种"说过没有"
  const memo = useRef({ lastCardAt: 0, lastActive: Date.now(), lastIdle: 0, milestone: 0, dangerWarned: false, playMs: 0, tired: 1, egg: false, typed: '', wasRunning: false, unsavedMs: 0, giftSaid: false })
  const status = runningOf(props.sessionId)

  // 鲸鱼娘说一句话；正在说更重要的话时返回 false
  const say = (text: string, pri: number, ms = 2600, tag?: string): boolean => {
    const cur = talkRef.current
    const now = Date.now()
    if (cur && cur.visible && cur.until > now && cur.pri > pri) return false
    const t: Talk = { id: now + Math.random(), text, tag, pri, until: now + ms, visible: true }
    talkRef.current = t
    setTalk(t)
    return true
  }

  useEffect(() => {
    if (!talk?.visible) return
    const id = setTimeout(() => setTalk(t => (t && t.id === talk.id ? { ...t, visible: false } : t)), Math.max(0, talk.until - Date.now()))
    return () => clearTimeout(id)
  }, [talk])

  useEffect(() => {
    bodyShown += 1
    emit()
    memo.current.wasRunning = runningOf(props.sessionId).since !== null
    // 面板打开时先试着领奖（挂在后台期间干完的活，回来就该给）；这里不改"人在游戏里"的标记，
    // 那个标记只由真实的 focus / blur 决定，否则人根本没焦点时会被误判成"在游戏里"，奖励就一直领不到
    const got = claimGift()
    if (got > 0) setTimeout(() => giftGot(got), 400)
    else if (game.drops === 0) setTimeout(() => say(line('hello', isZh()), PRI.hello, 3200), 500)
    // 切到别的应用 / 别的标签页也算"离开游戏"，切回来就算"回来了"（网页焦点事件不一定发得出来）
    const onWinBlur = (): void => leaveGame()
    const onWinFocus = (): void => {
      const back = claimGift()
      if (back > 0) giftGot(back)
    }
    window.addEventListener('blur', onWinBlur)
    window.addEventListener('focus', onWinFocus)
    return () => {
      window.removeEventListener('blur', onWinBlur)
      window.removeEventListener('focus', onWinFocus)
      bodyShown -= 1
      leaveGame()
      emit()
    }
  }, [])

  // 画布跟着面板大小缩放，罐子比例不变
  useEffect(() => {
    const el = host.current
    const cv = canvas.current
    if (!el || !cv) return
    const fit = (): void => {
      const availW = el.clientWidth - 16
      const availH = el.clientHeight - 90
      const s = Math.max(0.5, Math.min(availW / W, availH / H, 1.6))
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cv.style.width = `${Math.round(W * s)}px`
      cv.style.height = `${Math.round(H * s)}px`
      cv.width = Math.round(W * s * dpr)
      cv.height = Math.round(H * s * dpr)
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    el.focus()
    return () => ro.disconnect()
  }, [])

  // 主循环：推进物理、处理事件、各种"该不该说话"的检查、画一帧
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const loop = (now: number): void => {
      const dt = Math.min(50, now - last)
      last = now
      const k = keys.current
      if (k.left !== k.right) game.setAim(game.aimX + (k.right ? 1 : -1) * AIM_SPEED * (dt / 1000))
      // 打开图鉴时游戏暂停
      if (!paused.current) game.step(dt)
      for (const e of game.takeEvents()) onEvent(e, now)
      watch(dt)
      const cv = canvas.current
      const c = cv?.getContext('2d')
      if (cv && c) {
        const s = cv.width / W
        c.setTransform(s, 0, 0, s, 0, 0)
        drawScene(c, game, { now, head: head(), nextLabel: T().next, showAim: showAim.current })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  // 每帧检查：危险、救场、分数里程碑、发呆、玩太久、DeepSeek 干完
  const watch = (dt: number): void => {
    const m = memo.current
    const zh = isZh()
    const now = Date.now()
    const d = game.danger()
    if (d === 0) m.dangerWarned = false
    else if (d > 0.3 && !m.dangerWarned) {
      m.dangerWarned = true
      say(line('danger', zh), PRI.danger)
    }
    if (d > 0.6 && !game.rescued) game.rescue()

    if (game.score >= 2000) achieve('crown')
    sayNextAchievement()
    if (m.milestone < MILESTONES.length && game.score >= MILESTONES[m.milestone]) {
      say(line('milestone', zh, { n: MILESTONES[m.milestone] }), PRI.milestone)
      m.milestone += 1
    }

    if (!game.isOver) {
      m.playMs += dt
      m.unsavedMs += dt
      if (m.unsavedMs >= 5000) {
        if (bumpStats({ playMs: m.unsavedMs }).playMs >= 30 * 60_000) achieve('sleepy')
        m.unsavedMs = 0
      }
      if (m.playMs >= TIRED_EVERY_MS * m.tired) {
        say(line('tired', zh, { n: Math.round(m.playMs / 60_000) }), PRI.tired, 4000)
        m.tired += 1
      }
      if (now - m.lastActive > IDLE_MS && now - m.lastIdle > IDLE_REPEAT_MS) {
        m.lastIdle = now
        say(line(runningOf(sessionRef.current).since !== null ? 'idleBusy' : 'idleDone', zh), PRI.idle, 3500)
      }
    }

    const isRunning = runningOf(sessionRef.current).since !== null
    if (m.wasRunning && !isRunning) {
      if (gift.pending) m.giftSaid = false
      else {
        m.giftSaid = true
        say(line('aiDone', zh), PRI.aiDone, 4000)
      }
    }
    m.wasRunning = isRunning
    // 交作业奖励这句必须说得出口：被"这局结束了"之类优先级更高的台词挤掉时，下一帧接着说
    if (gift.pending && !m.giftSaid && say(line('giftReady', zh, { n: gift.count }), PRI.gift, 6000)) m.giftSaid = true
    // 人真的回来了（面板拿到焦点，或鼠标停在面板里）且离开够久 -> 发奖，不要求非得再点一下
    if (gift.pending && gift.awayAt !== null && Date.now() - gift.awayAt >= GIFT_AWAY_MS) {
      const el = host.current
      if (el && document.hasFocus() && (document.activeElement === el || el.matches(':hover'))) {
        const got = claimGift()
        if (got > 0) giftGot(got)
      }
    }
  }

  // 成就：先排队，鲸鱼娘一个一个念
  const achieve = (id: AchievementId): void => {
    const a = unlock(id)
    if (a) achQueue.current.push(a)
  }
  const sayNextAchievement = (): void => {
    const cur = talkRef.current
    if (!achQueue.current.length) return
    if (cur && cur.visible && cur.until > Date.now() && cur.pri >= PRI.ach) return
    const a = achQueue.current.shift()!
    const zh = isZh()
    const o = OUTFITS.find(x => x.id === a.outfit)!
    say(line('achievement', zh, { name: zh ? a.zh : a.en, tier: zh ? o.zh : o.en }), PRI.ach, 4500, zh ? '成就' : 'Achievement')
    addFloat(W / 2, H * 0.45, '★', performance.now(), true, '#ffd84d')
    if (!mutedRef.current) sfx.final()
    setTick(t => t + 1)
  }

  const onEvent = (e: ReturnType<Game['takeEvents']>[number], now: number): void => {
    const sound = !mutedRef.current
    const zh = isZh()
    if (e.type === 'drop') {
      if (sound) sfx.drop()
      if (e.tier !== PEARL && discover(e.tier)) setTick(t => t + 1)
      return
    }
    if (e.type === 'merge') {
      addBurst(e.x, e.y, e.tier, now, e.tier === FINAL)
      if (sound) {
        if (e.tier === FINAL) sfx.final()
        else if (e.first && e.tier >= 6) sfx.discover(e.tier)
        else sfx.merge(e.tier + Math.min(3, e.combo - 1))
      }
      addFloat(e.x, e.y - 10, `+${e.points}`, now, e.tier >= 7, e.pearl ? '#ffd6f0' : e.combo >= 2 ? '#ffe066' : '#ffffff')
      if (e.tier === FINAL) kick(10, 700, now)
      else if (e.tier >= 7) kick(3 + (e.tier - 7) * 1.5, 380, now)
      const isNew = discover(e.tier)
      if (e.tier === 9 && !game.rescued) achieve('diver')
      if (e.combo >= 4) achieve('dj')
      if (e.pearl && bumpStats({ pearlUps: 1 }).pearlUps >= 10) achieve('pearls')
      if (e.tier === FINAL) {
        bumpStats({ finals: 1 })
        achieve('flowers')
        setFlash({ kind: 'final', until: Date.now() + 3200 })
      } else if (e.combo >= 3) say(line('bigCombo', zh, { n: e.combo }), PRI.bigCombo, 2000)
      else if (e.combo >= 2) say(line('combo', zh, { n: e.combo }), PRI.combo, 1600)
      else if (isNew) say(line('newDex', zh, { tier: zh ? TIERS[e.tier].zh : TIERS[e.tier].en }), PRI.newDex, 2400)
      else if (e.first && e.tier >= 5) say(line('firstTier', zh, { tier: zh ? TIERS[e.tier].zh : TIERS[e.tier].en }), PRI.firstTier, 2400)
      else if (e.tier >= CARD_FROM_TIER) showCard()
      setTick(t => t + 1)
      return
    }
    if (e.type === 'rescue') {
      if (e.cleared > 0) {
        say(line('rescue', zh, { n: e.cleared }), PRI.rescue, 3000)
        addFloat(W / 2, H / 2, `+${e.points}`, now, true, '#bfe3ff')
        addBurst(W / 2, H / 2, 0, now, true)
        if (sound) sfx.discover(4)
      } else say(line('rescueEmpty', zh), PRI.rescue, 2600)
      setTick(t => t + 1)
      return
    }
    if (e.type === 'double-final') {
      achieve('stars')
      addBurst(e.x, e.y, FINAL, now, true)
      addFloat(e.x, e.y, `+${e.points}`, now, true, '#ffe066')
      kick(12, 800, now)
      if (sound) sfx.final()
      setFlash({ kind: 'double', until: Date.now() + 2600 })
      return
    }
    if (e.type === 'pearl-final') {
      addBurst(e.x, e.y, PEARL, now, true)
      addFloat(e.x, e.y - 20, `+${e.points}`, now, true, '#ffd6f0')
      if (sound) sfx.final()
      say(line('pearlFinal', zh), PRI.item, 2600)
      setTick(t => t + 1)
      return
    }
    if (e.type === 'shake') {
      kick(9, 650, now)
      if (sound) sfx.shake()
      say(line('shake', zh), PRI.item, 1200)
      setTick(t => t + 1)
      return
    }
    if (e.type === 'over') {
      if (bumpStats({ games: 1 }).games >= 10) achieve('sailor')
      if (sound) sfx.over()
      const before = load('best', 0)
      lastResult.current = { before }
      save('best', Math.max(before, e.score))
      say(e.score > before && e.score > 0 ? line('record', zh, { n: e.score }) : line('over', zh), PRI.over, 4000)
      setTick(t => t + 1)
    }
  }

  // 知识卡片：合成出水母及以上、而且鲸鱼娘这会儿没别的话要说时，由她念出来
  const showCard = (): void => {
    const m = memo.current
    if (Date.now() - m.lastCardAt < CARD_GAP_MS) return
    const fact = cards[0]
    if (!fact) return
    const zh = isZh()
    if (!say(zh ? fact.zh : (fact.en ?? fact.zh), PRI.card, 6500, T().tags[fact.tag] ?? fact.tag)) return
    cards.push(cards.shift()!)
    m.lastCardAt = Date.now()
    const seen = load<string[]>('seen', [])
    if (!seen.includes(fact.id)) save('seen', [...seen, fact.id])
    if (progress().cards >= FACTS.length) achieve('scholar')
  }

  useEffect(() => {
    if (!flash) return
    const id = setTimeout(() => setFlash(null), Math.max(0, flash.until - Date.now()))
    return () => clearTimeout(id)
  }, [flash])

  const restart = (): void => {
    game = new Game(newSeed(), Math.max(game.best, load('best', 0)))
    const m = memo.current
    Object.assign(m, { milestone: 0, dangerWarned: false, playMs: 0, tired: 1, egg: false, lastActive: Date.now() })
    setFlash(null)
    setShare(null)
    setTalk(t => (t ? { ...t, visible: false } : t))
    setTick(t => t + 1)
    host.current?.focus()
  }

  const giftGot = (n: number): void => {
    achieve('reviewer')
    say(line('giftGot', isZh(), { n }), PRI.gift, 3600)
    addFloat(W / 2, H * 0.42, `+${n} ✦`, performance.now(), true, '#ffd6f0')
    if (!mutedRef.current) sfx.discover(7)
    setTick(t => t + 1)
  }

  const doShake = (): void => {
    memo.current.lastActive = Date.now()
    if (!game.shake() && !game.isOver) say(line('shakeEmpty', isZh()), PRI.item, 2000)
  }

  const doPearl = (): void => {
    memo.current.lastActive = Date.now()
    if (game.isOver || game.current === PEARL) return
    if (pearls() <= 0) {
      say(line('noPearl', isZh()), PRI.item, 3600)
      return
    }
    if (game.usePearl()) {
      setPearls(pearls() - 1)
      if (!mutedRef.current) sfx.discover(5)
      setTick(t => t + 1)
    }
  }

  const doShare = async (): Promise<void> => {
    if (sharing) return
    setSharing(true)
    const before = lastResult.current?.before ?? load('best', 0)
    const stats: ShareStats = {
      score: game.score,
      best: Math.max(before, game.score),
      isRecord: game.score > before && game.score > 0,
      maxTier: game.maxTier,
      merges: game.merges,
      maxCombo: game.maxCombo,
      playMs: game.time,
      pearlsUsed: game.pearlsUsed,
    }
    try {
      const cv = await makeShareCard(stats, isZh(), { full: fullSrc, head: headSrc, outfit: equipped() })
      const url = cv.toDataURL('image/png')
      const blob = await new Promise<Blob | null>(r => cv.toBlob(r, 'image/png'))
      setShare({ url, blob, status: '' })
    } finally {
      setSharing(false)
    }
  }

  const copyShare = async (): Promise<void> => {
    if (!share) return
    try {
      if (!share.blob) throw new Error('no blob')
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': share.blob })])
      setShare({ ...share, status: T().copied })
    } catch {
      setShare({ ...share, status: T().copyFail })
    }
  }

  const drop = (): void => {
    memo.current.lastActive = Date.now()
    game.drop()
  }

  const aimFromPointer = (e: React.PointerEvent): void => {
    const rect = canvas.current?.getBoundingClientRect()
    if (!rect) return
    game.setAim((e.clientX - rect.left) / (rect.width / W))
  }

  // 彩蛋：在游戏里打出暗号
  const typeChar = (ch: string): void => {
    const m = memo.current
    m.typed = (m.typed + ch.toLowerCase()).slice(-SECRET.length)
    if (m.typed !== SECRET) return
    m.typed = ''
    if (m.egg || game.isOver) {
      say(line('eggUsed', isZh()), PRI.egg)
      return
    }
    m.egg = true
    achieve('dolphin')
    game.setCurrent(8)
    say(line('egg', isZh()), PRI.egg, 3000)
    if (!mutedRef.current) sfx.discover(8)
  }

  // 正在打暗号（已经打出暗号开头至少两个字母）时，S、E 不触发道具
  const typingSecret = (): boolean => {
    const t = memo.current.typed
    for (let n = Math.min(t.length, SECRET.length); n >= 2; n--) if (t.slice(-n) === SECRET.slice(0, n)) return true
    return false
  }

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return
    if (share) {
      if (e.key === 'Escape') setShare(null)
      return
    }
    if (panel) {
      if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        e.preventDefault()
        e.stopPropagation()
        setPanel(null)
      }
      return
    }
    if ((e.key === 'c' || e.key === 'C') && !e.repeat) {
      e.preventDefault()
      e.stopPropagation()
      setPanel('dex')
      return
    }
    const k = e.key
    if (k.length === 1 && /[a-z]/i.test(k)) typeChar(k)
    let used = true
    if ((k === 's' || k === 'S') && !e.repeat) {
      if (!typingSecret()) doShake()
    } else if ((k === 'e' || k === 'E') && !e.repeat) {
      if (!typingSecret()) doPearl()
    } else if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.current.left = true
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.current.right = true
    else if (k === ' ' || k === 'ArrowDown' || k === 'Enter') {
      if (game.isOver && k === 'Enter') restart()
      else if (!e.repeat) drop()
    } else if ((k === 'r' || k === 'R') && game.isOver) restart()
    else if (k.length === 1 && /[a-z]/i.test(k)) used = true
    else used = false
    if (used) {
      // 按键只留在游戏里，不跑进 DeepSeek 的输入框
      e.preventDefault()
      e.stopPropagation()
      showAim.current = true
      memo.current.lastActive = Date.now()
    }
  }
  const onKeyUp = (e: React.KeyboardEvent): void => {
    const k = e.key
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.current.left = false
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.current.right = false
    else return
    e.preventDefault()
    e.stopPropagation()
  }

  const t = T()
  const btn: React.CSSProperties = { padding: '6px 16px', borderRadius: 999, border: 'none', cursor: 'pointer', font: 'inherit', fontWeight: 700, background: PALETTE.accent, color: '#fff' }
  const best = Math.max(game.best, game.score, load('best', 0))
  const shownTalk = talk
  return (
    <div
      ref={host}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
      onBlur={e => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
        keys.current = { left: false, right: false }
        leaveGame()
      }}
      onFocus={() => {
        const got = backToGame()
        if (got > 0) giftGot(got)
      }}
      style={{ position: 'relative', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: 8, boxSizing: 'border-box', outline: 'none', fontSize: 13, userSelect: 'none', fontFamily: FONT }}
    >
      <div style={{ alignSelf: 'stretch', minHeight: 18, fontWeight: 600, color: status.since !== null ? PALETTE.accent : '#2a9d78' }}>
        {status.since !== null ? t.busy : gift.pending ? t.giftPending(gift.count) : status.ran ? t.done : ''}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ position: 'relative', lineHeight: 0, borderRadius: 18, overflow: 'hidden', boxShadow: '0 0 0 3px rgba(77,107,254,.25)' }}>
          <canvas
            ref={canvas}
            onPointerMove={e => {
              showAim.current = true
              memo.current.lastActive = Date.now()
              aimFromPointer(e)
            }}
            onPointerLeave={() => (showAim.current = false)}
            onPointerDown={e => {
              host.current?.focus()
              aimFromPointer(e)
              drop()
            }}
            style={{ display: 'block', cursor: game.isOver ? 'default' : 'pointer', touchAction: 'none' }}
          />

          {/* 鲸鱼娘：从左边游进来说话，知识卡片也是她念 */}
          <div
            aria-live="polite"
            style={{
              position: 'absolute', left: 8, right: 8, top: `${(DEADLINE / H) * 100 + 1.5}%`,
              display: 'flex', alignItems: 'flex-start', gap: 8, pointerEvents: 'none', lineHeight: 1.5,
              transform: shownTalk?.visible ? 'translateX(0)' : 'translateX(-115%)',
              opacity: shownTalk?.visible ? 1 : 0,
              transition: 'transform .32s cubic-bezier(.2,.9,.3,1.25), opacity .25s',
            }}
          >
            <img src={headSrc} alt="" style={{ width: 42, height: 42, borderRadius: '50%', border: '3px solid #fff', boxShadow: `0 0 0 2px ${PALETTE.accent}, 0 4px 10px rgba(10,20,70,.3)`, flex: 'none' }} />
            {shownTalk ? (
              <div key={shownTalk.id} style={{ background: 'rgba(255,255,255,.96)', color: '#1B2147', borderRadius: '4px 14px 14px 14px', padding: '7px 11px', fontSize: 12.5, boxShadow: '0 6px 18px rgba(10,20,70,.28)', minWidth: 0 }}>
                {shownTalk.tag ? <div style={{ fontSize: 11, fontWeight: 700, color: PALETTE.accent }}>{shownTalk.tag}</div> : null}
                <div>{shownTalk.text}</div>
              </div>
            ) : null}
          </div>

          {flash ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, pointerEvents: 'none', lineHeight: 1.4, background: 'rgba(12,22,60,.45)' }}>
              {flash.kind === 'final' ? (
                <img src={fullSrc} alt="" style={{ width: '62%', borderRadius: 16, border: '4px solid #fff', boxShadow: '0 10px 30px rgba(10,20,70,.45)' }} />
              ) : null}
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, textShadow: '0 2px 8px rgba(10,20,60,.6)', padding: '0 16px', textAlign: 'center' }}>
                {flash.kind === 'final' ? t.final : t.double}
              </div>
            </div>
          ) : null}
          {game.isOver ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, lineHeight: 1.4, color: '#fff' }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{t.over}</div>
              <div style={{ opacity: 0.9 }}>{t.score(game.score, best)}</div>
              <button type="button" onClick={restart} style={btn}>
                {t.restart} (R)
              </button>
              <button type="button" onClick={() => void doShare()} style={{ ...btn, background: 'rgba(255,255,255,.18)', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.7)' }}>
                {sharing ? t.sharing : t.shareBtn}
              </button>
            </div>
          ) : null}
        </div>

        {/* 画布下面只留一行：开局时是玩法和合成链，之后是最高分和音效开关 */}
        {game.drops === 0 ? (
          <div style={{ opacity: 0.75, lineHeight: 1.5, maxWidth: '100%' }}>
            <div>{t.help}</div>
            <ChainStrip />
          </div>
        ) : null}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" title={t.shakeTip} onClick={() => { doShake(); host.current?.focus() }} disabled={game.isOver || game.shakesLeft <= 0} style={chip(game.shakesLeft > 0 && !game.isOver)}>
            {t.shake(game.shakesLeft)} <kbd style={kbd}>S</kbd>
          </button>
          <button type="button" title={t.pearlTip} onClick={() => { doPearl(); host.current?.focus() }} disabled={game.isOver} style={chip(pearls() > 0 && !game.isOver, true)}>
            {t.pearl(pearls())} <kbd style={kbd}>E</kbd>
          </button>
          <button type="button" onClick={() => setPanel('dex')} style={chip(true)}>
            {(() => {
              const p = progress()
              return t.dexBtn(p.dex + p.cards + p.ach, p.dexTotal + p.cardsTotal + p.achTotal)
            })()}{' '}
            <kbd style={kbd}>C</kbd>
          </button>
          <span style={{ flex: 1 }} />
          <span style={{ opacity: 0.7 }}>{t.best(best)}</span>
          <button
            type="button"
            title={t.sound}
            aria-label={t.sound}
            onClick={() => {
              const next = !muted
              setMuted(next)
              save('muted', next)
              host.current?.focus()
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: muted ? 0.35 : 0.8, fontSize: 15, color: 'inherit' }}
          >
            ♪
          </button>
        </div>
      </div>

      {panel ? (
        <CollectionPanel
          zh={isZh()}
          head={head()}
          initial={panel}
          onClose={() => {
            setPanel(null)
            host.current?.focus()
          }}
          onEquip={() => setOutfit(equipped())}
        />
      ) : null}

      {share ? (
        <div
          onPointerDown={e => e.stopPropagation()}
          style={{ position: 'absolute', inset: 0, zIndex: 5, background: 'rgba(10,16,45,.82)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 14, boxSizing: 'border-box', overflowY: 'auto', color: '#fff' }}
        >
          <img src={share.url} alt="" style={{ width: '100%', maxWidth: 420, borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,.4)', userSelect: 'auto' }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button type="button" onClick={() => void copyShare()} style={btn}>
              {t.copy}
            </button>
            <a href={share.url} download={`whale-merge-${game.score}.png`} style={{ ...btn, textDecoration: 'none', background: 'rgba(255,255,255,.18)' }}>
              {t.saveImg}
            </a>
            <button type="button" onClick={() => { setShare(null); host.current?.focus() }} style={{ ...btn, background: 'transparent', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,.6)' }}>
              {t.close}
            </button>
          </div>
          {share.status ? <div style={{ opacity: 0.85 }}>{share.status}</div> : null}
        </div>
      ) : null}
    </div>
  )
}

const kbd: React.CSSProperties = { fontFamily: 'inherit', fontSize: 10, opacity: 0.6, border: '1px solid currentColor', borderRadius: 4, padding: '0 3px' }
const chip = (on: boolean, pearl = false): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, font: 'inherit', fontSize: 12, cursor: on ? 'pointer' : 'default',
  border: `1px solid ${on ? (pearl ? '#d9a8ff' : PALETTE.accent) : 'rgba(127,127,127,.3)'}`,
  background: on ? (pearl ? 'rgba(217,168,255,.14)' : 'rgba(77,107,254,.10)') : 'transparent',
  color: on ? (pearl ? '#b779ff' : PALETTE.accent) : 'inherit', opacity: on ? 1 : 0.5,
})

/** 开局时在说明下面画一排合成链的小圆点，让人知道终点是谁。 */
function ChainStrip(): React.ReactNode {
  const zh = isZh()
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11 }}>
      {TIERS.map((tier, i) => (
        <span key={tier.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          <span style={{ width: 8 + i, height: 8 + i, borderRadius: '50%', background: TIER_COLOR[i], border: '1px solid rgba(0,0,0,.15)', display: 'inline-block' }} />
          {i === FINAL ? <b>{zh ? tier.zh : tier.en}</b> : null}
          {i < FINAL ? <span style={{ opacity: 0.4 }}>›</span> : null}
        </span>
      ))}
    </div>
  )
}

function WhaleIcon(): React.ReactNode {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" style={{ display: 'block' }}>
      <circle cx="7" cy="9" r="5.5" fill={PALETTE.accent} />
      <path d="M11.5 7.5 L15 4.5 L14.2 8.6 Z" fill="#3A56D8" />
      <circle cx="5.2" cy="8.4" r="0.9" fill="#fff" />
      <circle cx="3.6" cy="3" r="1.2" fill="none" stroke={PALETTE.accent} strokeWidth="0.8" />
    </svg>
  )
}

function WhaleTitle(): React.ReactNode {
  useVersion()
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <WhaleIcon />
      {T().title}
    </span>
  )
}

// 输入框上方的提示条：DeepSeek 一轮干了 5 秒还没完才出现，面板开着时不出现
function WhaleHint(props: { sessionId: string; open: () => void }): React.ReactNode {
  useVersion()
  const r = runningOf(props.sessionId)
  const [, setTick] = useState(0)
  useEffect(() => {
    if (r.since === null) return
    const wait = r.since + HINT_AFTER_MS - Date.now()
    if (wait <= 0) return
    const id = setTimeout(() => setTick(x => x + 1), wait + 20)
    return () => clearTimeout(id)
  }, [r.since])
  if (r.since === null || r.muted || bodyShown > 0 || Date.now() - r.since < HINT_AFTER_MS) return null
  const link: React.CSSProperties = { background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px', margin: '0 0 6px', borderRadius: 10, border: '1px solid rgba(127,127,127,.25)', fontSize: 13 }}>
      <WhaleIcon />
      <span style={{ opacity: 0.7 }}>{T().busy}</span>
      <button type="button" onClick={props.open} style={{ ...link, color: PALETTE.accent, fontWeight: 600 }}>
        {T().play}
      </button>
      <span style={{ flex: 1 }} />
      <button
        type="button"
        onClick={() => {
          running.set(props.sessionId, { ...runningOf(props.sessionId), muted: true })
          emit()
        }}
        style={{ ...link, opacity: 0.55 }}
      >
        {T().mute}
      </button>
    </div>
  )
}

// ---------- 插件入口 ----------
type Ctx = {
  effect: (fn: () => () => void, label?: string) => void
  slots: {
    inject: (name: string, fn: () => unknown) => void
    register: (options: Record<string, unknown>, component: unknown) => unknown
  }
  sidebarRight: { openTabIn: (sessionId: string, kind: string, options?: Record<string, unknown>) => void }
  sidebarRightTabs: { register: (definition: Record<string, unknown>) => () => void }
  remote: { $on: (event: string, fn: (...args: never[]) => void) => () => void }
}

export const inject = ['slots', 'sidebarRight', 'sidebarRightTabs', 'remote']

export function apply(ctx: Ctx): void {
  // DSH 切换界面语言时 <html lang> 会变，跟着重画
  ctx.effect(() => {
    const mo = new MutationObserver(() => emit())
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
    return () => mo.disconnect()
  }, 'lq-whale.lang')

  // 1. 右侧边栏「开始」里的入口 + 标签页
  ctx.effect(
    () =>
      ctx.sidebarRightTabs.register({
        id: ID,
        kind: KIND,
        title: () => T().title,
        guide: [{ id: KIND, order: 91, title: () => T().title, description: () => T().guide, icon: WhaleIcon }],
      }),
    'lq-whale.tab',
  )
  ctx.slots.inject('sidebar.right.pane.tab', () =>
    ctx.slots.register({ name: 'sidebar.right.pane.tab', key: ID, inject: (sessionId: string) => ({ sessionId }) }, WhaleBody),
  )
  ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({ name: 'sidebar.right.pane.tab.title', key: ID }, WhaleTitle))

  // 2. 输入框上方的提示条
  ctx.slots.inject('conversation.input.dock', () =>
    ctx.slots.register(
      {
        name: 'conversation.input.dock',
        id: 'lq-whale.hint',
        order: 51,
        inject: (sessionId: string) => ({ sessionId, open: () => ctx.sidebarRight.openTabIn(sessionId, KIND) }),
      },
      WhaleHint,
    ),
  )

  // 3. 会话运行状态：DeepSeek 开始干活 / 干完了
  ctx.effect(
    () => ctx.remote.$on('api-session/status', ((sessionId: string, isRunning: boolean) => setRunning(sessionId, isRunning)) as never),
    'lq-whale.status',
  )
}

/** 本地预览页用（dev/preview.html），插件运行时用不到。 */
export const __preview = { WhaleBody, WhaleHint, setRunning, game: () => game, drawCreature, head, setPearls, onRunFinished, unlock }
