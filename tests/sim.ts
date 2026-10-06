import { Game, PEARL, TIERS, W } from '../src/game'
for (let seed = 1; seed <= 4; seed++) {
  const g = new Game(seed)
  let t = 0
  let pearlUps = 0
  while (!g.isOver && t < 20 * 60_000) {
    if (g.drops % 25 === 10) g.usePearl()
    if (g.drops % 60 === 30) g.shake()
    const same = g.pieces().filter(p => p.tier === g.current).sort((a, b) => a.y - b.y)
    const big = g.pieces().filter(p => p.tier !== PEARL).sort((a, b) => b.tier - a.tier)
    g.setAim(g.current === PEARL && big.length ? big[0].x : same.length ? same[0].x : Math.random() * W)
    g.drop()
    for (let i = 0; i < 45; i++) { g.step(16.7); t += 16.7 }
    for (const e of g.takeEvents()) if (e.type === 'merge' && e.pearl) pearlUps++
    for (const p of g.pieces()) if (!Number.isFinite(p.x + p.y)) throw new Error('NaN')
  }
  console.log(`seed ${seed}: over=${g.isOver} drops=${g.drops} score=${g.score} max=${TIERS[g.maxTier].zh} maxCombo=${g.maxCombo} pearls=${g.pearlsUsed}/${pearlUps}升级 shakes剩${g.shakesLeft}`)
}
