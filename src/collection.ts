// 收集：海洋图鉴、知识卡片收藏、成就、鲸鱼娘相册。全部存在本机。
import { FACTS } from './facts'
import { TIERS } from './game'
import { OUTFITS, type OutfitId } from './outfits'
import { load, save } from './storage'

export type AchievementId =
  | 'diver' | 'dj' | 'crown' | 'flowers' | 'stars' | 'reviewer'
  | 'pearls' | 'dolphin' | 'scholar' | 'sleepy' | 'sailor'

export type Achievement = { id: AchievementId; zh: string; en: string; howZh: string; howEn: string; outfit: OutfitId }

/** 每个成就解锁一套同名造型。 */
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'flowers', zh: '初次见面', en: 'First meeting', howZh: '合出鲸鱼娘', howEn: 'Merge a whale girl', outfit: 'flowers' },
  { id: 'diver', zh: '独自下潜', en: 'Solo dive', howZh: '这局没被救场，合出虎鲸', howEn: 'Merge an orca without a rescue that game', outfit: 'diver' },
  { id: 'dj', zh: '连锁反应', en: 'Chain reaction', howZh: '一次放下引发连锁 ×4', howEn: 'Trigger a ×4 chain from one drop', outfit: 'dj' },
  { id: 'crown', zh: '两千分', en: 'Two thousand', howZh: '单局 2000 分', howEn: 'Score 2000 in one game', outfit: 'crown' },
  { id: 'stars', zh: '双鲸同游', en: 'Swim together', howZh: '让两只鲸鱼娘碰在一起', howEn: 'Bump two whale girls together', outfit: 'stars' },
  { id: 'reviewer', zh: '认真验收', en: 'Reviewer', howZh: '领到一次交作业奖励', howEn: 'Claim a review reward once', outfit: 'reviewer' },
  { id: 'pearls', zh: '珍珠串', en: 'String of pearls', howZh: '累计用珍珠升级 10 次', howEn: 'Level up with pearls 10 times in total', outfit: 'pearls' },
  { id: 'dolphin', zh: '知道暗号', en: 'Secret word', howZh: '找到隐藏的暗号', howEn: 'Find the secret word', outfit: 'dolphin' },
  { id: 'scholar', zh: '博览群书', en: 'Well read', howZh: `看完全部 ${FACTS.length} 张知识卡片`, howEn: `See all ${FACTS.length} cards`, outfit: 'scholar' },
  { id: 'sleepy', zh: '陪你等', en: 'Waiting with you', howZh: '累计玩满 30 分钟', howEn: 'Play 30 minutes in total', outfit: 'sleepy' },
  { id: 'sailor', zh: '十次出海', en: 'Ten voyages', howZh: '玩满 10 局', howEn: 'Finish 10 games', outfit: 'sailor' },
]

export type Stats = { games: number; playMs: number; pearlUps: number; finals: number }

// ---------- 读写 ----------
export const dex = (): Record<string, number> => load('dex', {})
export const unlocked = (): Record<string, number> => load('ach', {})
export const stats = (): Stats => ({ games: 0, playMs: 0, pearlUps: 0, finals: 0, ...load<Partial<Stats>>('stats', {}) })
export const seenCards = (): string[] => load<string[]>('seen', [])

export function bumpStats(change: Partial<Stats>): Stats {
  const s = stats()
  for (const [k, v] of Object.entries(change) as [keyof Stats, number][]) s[k] += v
  save('stats', s)
  return s
}

/** 图鉴：第一次合出某一级时记下日期，返回是不是新发现。 */
export function discover(tier: number): boolean {
  const d = dex()
  if (d[tier]) return false
  d[tier] = Date.now()
  save('dex', d)
  return true
}

/** 解锁成就，返回新解锁的那个（已经有了就返回 null）。 */
export function unlock(id: AchievementId): Achievement | null {
  const u = unlocked()
  if (u[id]) return null
  u[id] = Date.now()
  save('ach', u)
  return ACHIEVEMENTS.find(a => a.id === id) ?? null
}

// ---------- 造型 ----------
export const outfitUnlocked = (id: OutfitId): boolean => id === 'maid' || !!unlocked()[ACHIEVEMENTS.find(a => a.outfit === id)?.id ?? '']
export const equipped = (): OutfitId => {
  const id = load<OutfitId>('outfit', 'maid')
  return OUTFITS.some(o => o.id === id) && outfitUnlocked(id) ? id : 'maid'
}
export const equip = (id: OutfitId): void => {
  if (outfitUnlocked(id)) save('outfit', id)
}

export const progress = () => ({
  dex: Object.keys(dex()).length,
  dexTotal: TIERS.length,
  cards: seenCards().filter(id => FACTS.some(f => f.id === id)).length,
  cardsTotal: FACTS.length,
  ach: Object.keys(unlocked()).length,
  achTotal: ACHIEVEMENTS.length,
})
