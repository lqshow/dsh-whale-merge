// 合成大鲸鱼的游戏逻辑：只管物理、合成、计分和输赢，不碰 DOM，方便在 Node 里测试。
import Matter from 'matter-js'

/** 罐子的逻辑尺寸（画布按比例缩放）。 */
export const W = 360
export const H = 560
/** 准备落下的那一只悬在这个高度。 */
export const DROP_Y = 56
/** 警戒线：有海洋生物的顶部长时间高于这条线，这局就结束。 */
export const DEADLINE = 104
/** 沙地高度。 */
export const FLOOR = 22

const STEP_MS = 1000 / 60
const DROP_COOLDOWN_MS = 420
const DROP_GRACE_MS = 1500
const MERGE_GRACE_MS = 500
const SHAKE_GRACE_MS = 1400
const DANGER_LIMIT_MS = 3000
const DOUBLE_FINAL_BONUS = 100
const PEARL_FINAL_BONUS = 50
export const SHAKES_PER_GAME = 2

export type TierId =
  | 'bubble' | 'shrimp' | 'clownfish' | 'jellyfish' | 'puffer' | 'starfish'
  | 'turtle' | 'octopus' | 'dolphin' | 'orca' | 'whale-girl'

export type Tier = { id: TierId; zh: string; en: string; r: number; points: number }

/** 合成链：两只一样的碰在一起，变成下一级。最后一级是鲸鱼娘。 */
export const TIERS: Tier[] = [
  { id: 'bubble', zh: '气泡', en: 'Bubble', r: 15, points: 1 },
  { id: 'shrimp', zh: '小虾', en: 'Shrimp', r: 20, points: 3 },
  { id: 'clownfish', zh: '小丑鱼', en: 'Clownfish', r: 26, points: 6 },
  { id: 'jellyfish', zh: '水母', en: 'Jellyfish', r: 32, points: 10 },
  { id: 'puffer', zh: '河豚', en: 'Pufferfish', r: 39, points: 15 },
  { id: 'starfish', zh: '海星', en: 'Starfish', r: 46, points: 21 },
  { id: 'turtle', zh: '海龟', en: 'Sea turtle', r: 54, points: 28 },
  { id: 'octopus', zh: '章鱼', en: 'Octopus', r: 63, points: 36 },
  { id: 'dolphin', zh: '海豚', en: 'Dolphin', r: 73, points: 45 },
  { id: 'orca', zh: '虎鲸', en: 'Orca', r: 85, points: 55 },
  { id: 'whale-girl', zh: '鲸鱼娘', en: 'Whale girl', r: 100, points: 66 },
]
export const FINAL = TIERS.length - 1

/** 珍珠：道具，碰到谁就让谁升一级。不在合成链里，用一个单独的编号。 */
export const PEARL = 99
export const PEARL_R = 14
export const rOf = (tier: number): number => (tier === PEARL ? PEARL_R : TIERS[tier].r)

/** 能直接掉下来的只有前五级，越小越常见。 */
const SPAWN_WEIGHTS = [30, 27, 22, 13, 8]

export type Piece = { id: number; tier: number; x: number; y: number; angle: number; born: number }

export type GameEvent =
  | { type: 'drop'; tier: number }
  | { type: 'merge'; tier: number; x: number; y: number; first: boolean; combo: number; points: number; pearl: boolean }
  | { type: 'double-final'; x: number; y: number; points: number }
  | { type: 'pearl-final'; x: number; y: number; points: number }
  | { type: 'rescue'; cleared: number; points: number }
  | { type: 'shake'; left: number }
  | { type: 'over'; score: number }

type Live = { body: Matter.Body; tier: number; born: number; graceUntil: number }

/** 小而稳定的伪随机数，测试时可以复现。 */
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Game {
  readonly engine: Matter.Engine
  private live = new Map<number, Live>()
  private pending: [number, number][] = []
  private acc = 0
  private rand: () => number
  /** 用了珍珠以后，原来手上那一只等珍珠放下再回来。 */
  private afterPearl: number | null = null
  /** 模拟时钟（毫秒），只在 step 里走。 */
  time = 0
  score = 0
  best: number
  current: number
  next: number
  aimX = W / 2
  readyAt = 0
  dangerSince: number | null = null
  isOver = false
  drops = 0
  merges = 0
  maxTier = 0
  /** 本局第一次合成出某一级的记录，用来判断是不是"新发现"。 */
  reached = new Set<number>()
  /** 连锁：放下一只之后接连触发的合成次数，放下一只就清零。 */
  combo = 0
  maxCombo = 0
  rescued = false
  shakesLeft = SHAKES_PER_GAME
  pearlsUsed = 0
  private events: GameEvent[] = []

  constructor(seed: number, best = 0) {
    this.rand = rng(seed)
    this.best = best
    this.current = 0
    this.next = 1
    this.engine = Matter.Engine.create({ gravity: { x: 0, y: 1.7, scale: 0.001 }, positionIterations: 10, velocityIterations: 8 })
    const wall = { isStatic: true, friction: 0.2, restitution: 0.1 }
    const T = 200
    Matter.Composite.add(this.engine.world, [
      Matter.Bodies.rectangle(W / 2, H - FLOOR + T / 2, W + T * 2, T, wall),
      Matter.Bodies.rectangle(-T / 2, H / 2, T, H * 3, wall),
      Matter.Bodies.rectangle(W + T / 2, H / 2, T, H * 3, wall),
    ])
    Matter.Events.on(this.engine, 'collisionStart', e => this.collect(e))
    Matter.Events.on(this.engine, 'collisionActive', e => this.collect(e))
  }

  private collect(e: Matter.IEventCollision<Matter.Engine>): void {
    for (const p of e.pairs) {
      const a = this.live.get(p.bodyA.id)
      const b = this.live.get(p.bodyB.id)
      if (!a || !b) continue
      // 同级相碰；或者珍珠碰到任何一只普通的
      if (a.tier === b.tier ? a.tier !== PEARL : a.tier === PEARL || b.tier === PEARL) this.pending.push([p.bodyA.id, p.bodyB.id])
    }
  }

  private spawnTier(): number {
    // 开局慢慢放开：前几次只掉小的
    const cap = this.drops < 4 ? 2 : this.maxTier < 4 ? 4 : SPAWN_WEIGHTS.length
    const w = SPAWN_WEIGHTS.slice(0, cap)
    let roll = this.rand() * w.reduce((s, x) => s + x, 0)
    for (let i = 0; i < w.length; i++) {
      roll -= w[i]
      if (roll < 0) return i
    }
    return 0
  }

  private add(tier: number, x: number, y: number, grace: number, vx = 0, vy = 0): void {
    const body = Matter.Bodies.circle(x, y, rOf(tier), {
      restitution: tier === PEARL ? 0.4 : 0.12,
      friction: 0.35,
      frictionStatic: 0.6,
      frictionAir: 0.012,
      density: tier === PEARL ? 0.004 : 0.0012,
      slop: 0.02,
    })
    Matter.Body.setVelocity(body, { x: vx, y: vy })
    Matter.Composite.add(this.engine.world, body)
    this.live.set(body.id, { body, tier, born: this.time, graceUntil: this.time + grace })
  }

  private remove(id: number): void {
    const l = this.live.get(id)
    if (!l) return
    Matter.Composite.remove(this.engine.world, l.body)
    this.live.delete(id)
  }

  /** 调试和预览用：直接放一只指定级别的。 */
  spawn(tier: number, x: number, y: number): void {
    this.add(tier, this.clampAim(x, tier), y, DROP_GRACE_MS)
  }

  /** 彩蛋：把手上这一只换成指定级别。 */
  setCurrent(tier: number): void {
    // 手上拿着珍珠：珍珠照常放，放完再换成这一只
    if (this.current === PEARL) {
      this.afterPearl = tier
      return
    }
    this.current = tier
    this.aimX = this.clampAim(this.aimX)
  }

  /** 用一颗珍珠：手上这一只先换成珍珠，珍珠放下后原来那只回到手上。 */
  usePearl(): boolean {
    if (this.isOver || this.current === PEARL) return false
    this.afterPearl = this.current
    this.current = PEARL
    this.pearlsUsed += 1
    return true
  }

  /**
   * 摇一摇（每局有限次数）：给每一只一个随机的向上、向两边的速度，把卡住的震开。
   * 摇的时候警戒线暂停判定一会儿。
   */
  shake(): boolean {
    if (this.isOver || this.shakesLeft <= 0) return false
    this.shakesLeft -= 1
    for (const l of this.live.values()) {
      const big = rOf(l.tier) / 100
      Matter.Body.setVelocity(l.body, {
        x: l.body.velocity.x + (this.rand() - 0.5) * 9,
        y: l.body.velocity.y - (3 + this.rand() * 5) * (1 - big * 0.5),
      })
      Matter.Body.setAngularVelocity(l.body, (this.rand() - 0.5) * 0.3)
      l.graceUntil = Math.max(l.graceUntil, this.time + SHAKE_GRACE_MS)
    }
    this.dangerSince = null
    this.events.push({ type: 'shake', left: this.shakesLeft })
    return true
  }

  /**
   * 鲸鱼娘救场（每局一次）：把最小的两级（气泡、小虾）全部收走，按分数折算。
   * 返回收走了几只。
   */
  rescue(): number {
    if (this.rescued || this.isOver) return 0
    this.rescued = true
    let cleared = 0
    let points = 0
    for (const [id, l] of [...this.live]) {
      if (l.tier > 1) continue
      points += TIERS[l.tier].points
      this.remove(id)
      cleared += 1
    }
    this.score += points
    this.dangerSince = null
    this.events.push({ type: 'rescue', cleared, points })
    return cleared
  }

  /** 准备落下的那一只能站的 x 范围。 */
  clampAim(x: number, tier = this.current): number {
    const r = rOf(tier)
    return Math.max(r + 1, Math.min(W - r - 1, x))
  }

  setAim(x: number): void {
    this.aimX = this.clampAim(x)
  }

  canDrop(): boolean {
    return !this.isOver && this.time >= this.readyAt
  }

  drop(): boolean {
    if (!this.canDrop()) return false
    const tier = this.current
    const x = this.clampAim(this.aimX, tier)
    this.add(tier, x, DROP_Y, DROP_GRACE_MS, 0, 0.5)
    this.drops += 1
    this.combo = 0
    this.events.push({ type: 'drop', tier })
    if (tier === PEARL && this.afterPearl !== null) {
      this.current = this.afterPearl
      this.afterPearl = null
    } else {
      this.current = this.next
      this.next = this.spawnTier()
    }
    this.aimX = this.clampAim(this.aimX)
    this.readyAt = this.time + DROP_COOLDOWN_MS
    return true
  }

  /** 在 (x, y) 生成 tier 级的一只，并记分、记连锁、发事件。 */
  private grow(tier: number, x: number, y: number, vx: number, vy: number, pearl: boolean): void {
    const r = TIERS[tier].r
    this.add(tier, Math.max(r, Math.min(W - r, x)), y, MERGE_GRACE_MS, vx, vy)
    this.combo += 1
    this.maxCombo = Math.max(this.maxCombo, this.combo)
    // 连锁：同一次放下引发的连续合成，从第二下开始有额外加分
    const bonus = this.combo >= 2 ? (this.combo - 1) * 3 : 0
    const points = TIERS[tier].points + bonus
    this.score += points
    const first = !this.reached.has(tier)
    this.reached.add(tier)
    this.maxTier = Math.max(this.maxTier, tier)
    this.events.push({ type: 'merge', tier, x, y, first, combo: this.combo, points, pearl })
  }

  private resolveMerges(): void {
    const used = new Set<number>()
    for (const [ia, ib] of this.pending) {
      if (used.has(ia) || used.has(ib)) continue
      let a = this.live.get(ia)
      let b = this.live.get(ib)
      if (!a || !b) continue
      used.add(ia)
      used.add(ib)
      this.merges += 1

      if (a.tier === PEARL || b.tier === PEARL) {
        // 珍珠：让碰到的那一只原地升一级
        if (b.tier === PEARL) [a, b] = [b, a]
        const { x, y } = b.body.position
        const { x: vx, y: vy } = b.body.velocity
        this.remove(a.body.id)
        if (b.tier === FINAL) {
          this.score += PEARL_FINAL_BONUS
          this.events.push({ type: 'pearl-final', x, y, points: PEARL_FINAL_BONUS })
          continue
        }
        this.remove(b.body.id)
        this.grow(b.tier + 1, x, y, vx / 2, vy / 2, true)
        continue
      }

      const x = (a.body.position.x + b.body.position.x) / 2
      const y = (a.body.position.y + b.body.position.y) / 2
      const vx = (a.body.velocity.x + b.body.velocity.x) / 4
      const vy = (a.body.velocity.y + b.body.velocity.y) / 4
      this.remove(ia)
      this.remove(ib)
      if (a.tier === FINAL) {
        // 两只鲸鱼娘碰在一起：一起游走，留下一大笔分
        this.score += DOUBLE_FINAL_BONUS
        this.events.push({ type: 'double-final', x, y, points: DOUBLE_FINAL_BONUS })
        continue
      }
      this.grow(a.tier + 1, x, y, vx, vy, false)
    }
    this.pending = []
  }

  private checkDanger(): void {
    let danger = false
    for (const l of this.live.values()) {
      if (this.time < l.graceUntil) continue
      if (l.body.position.y - rOf(l.tier) < DEADLINE) {
        danger = true
        break
      }
    }
    if (!danger) {
      this.dangerSince = null
      return
    }
    this.dangerSince ??= this.time
    if (this.time - this.dangerSince >= DANGER_LIMIT_MS) {
      this.isOver = true
      this.best = Math.max(this.best, this.score)
      this.events.push({ type: 'over', score: this.score })
    }
  }

  /** 推进 dtMs 毫秒（内部用固定步长，掉帧也不会穿模）。 */
  step(dtMs: number): void {
    if (this.isOver) return
    this.acc += Math.min(dtMs, 100)
    while (this.acc >= STEP_MS && !this.isOver) {
      this.acc -= STEP_MS
      this.time += STEP_MS
      Matter.Engine.update(this.engine, STEP_MS)
      this.resolveMerges()
      this.checkDanger()
    }
  }

  /** 危险程度 0~1，画警戒线用。 */
  danger(): number {
    return this.dangerSince === null ? 0 : Math.min(1, (this.time - this.dangerSince) / DANGER_LIMIT_MS)
  }

  pieces(): Piece[] {
    const out: Piece[] = []
    for (const [id, l] of this.live) {
      out.push({ id, tier: l.tier, x: l.body.position.x, y: l.body.position.y, angle: l.body.angle, born: l.born })
    }
    return out
  }

  takeEvents(): GameEvent[] {
    const e = this.events
    this.events = []
    return e
  }
}
