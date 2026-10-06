// 鲸鱼娘的台词。每种场合一组，随机挑一句；{n} {tier} 会被替换。
export type TalkKind =
  | 'hello' | 'combo' | 'bigCombo' | 'firstTier' | 'milestone' | 'danger' | 'rescue' | 'rescueEmpty'
  | 'idleBusy' | 'idleDone' | 'tired' | 'egg' | 'eggUsed' | 'over' | 'record' | 'double' | 'aiDone'
  | 'giftReady' | 'giftGot' | 'noPearl' | 'pearlFinal' | 'shake' | 'shakeEmpty' | 'newDex' | 'achievement'

type Lines = Record<TalkKind, string[]>

const ZH: Lines = {
  hello: ['我是鲸鱼娘，帮我凑齐同伴吧～', 'DeepSeek 在干活，我们来合几只？', '两只一样的碰一碰，就会变大哦'],
  combo: ['连锁 ×{n}！', '好顺！连锁 ×{n}', '一碰就连上了 ×{n}'],
  bigCombo: ['连锁 ×{n}！你是不是算好的', '×{n} 连锁！这一下太漂亮了', '太强了，连锁 ×{n}！'],
  firstTier: ['第一次合出{tier}！', '哇，{tier}来了', '{tier}！离我又近了一步'],
  milestone: ['{n} 分了，稳住', '已经 {n} 分啦', '{n} 分！今天手感不错'],
  danger: ['快满出来了，小心！', '警戒线！先合小的', '顶上要挤爆了…'],
  rescue: ['我来帮你！收走了 {n} 个小家伙', '鲸鱼娘救场！清掉 {n} 个'],
  rescueEmpty: ['小的都没了…只能靠你了', '我也没办法了，加油！'],
  idleBusy: ['DeepSeek 还在想，我们再合两个？', '发呆的话，我可要睡着了', '等 AI 的时候，最适合合鲸鱼'],
  idleDone: ['DeepSeek 已经干完了哦，先去看看？', '活干完啦，回去检查一下吧'],
  aiDone: ['DeepSeek 干完了！看完再回来玩', '叮～DeepSeek 交作业了'],
  tired: ['已经玩了 {n} 分钟啦，DeepSeek 的活看过了吗？', '{n} 分钟了，起来喝口水吧'],
  egg: ['被你发现了！送你一只海豚', '暗号正确！这只换成海豚'],
  eggUsed: ['这局已经送过啦，下局再来', '贪心可不行哦'],
  over: ['没关系，再来一局', '差一点点！', '下次一定能见到我'],
  record: ['新纪录！{n} 分', '破纪录了！{n} 分'],
  double: ['两只鲸鱼娘一起游走啦 +100'],
  giftReady: ['DeepSeek 交作业了！去看一眼，回来送你 {n} 颗珍珠', '叮～活干完了。先去检查，回来有 {n} 颗珍珠等你'],
  giftGot: ['检查完啦？说好的 {n} 颗珍珠，拿好', '认真看过才有奖励～送你 {n} 颗珍珠'],
  noPearl: ['还没有珍珠哦。等 DeepSeek 交作业、你去检查完，我就送你', '珍珠要靠检查 AI 的作业换～'],
  pearlFinal: ['珍珠送给我？谢谢！+50'],
  shake: ['摇一摇～', '晃起来了！'],
  shakeEmpty: ['这局摇不动啦，下局再来'],
  newDex: ['新发现！{tier}收进图鉴了', '图鉴 +1：{tier}'],
  achievement: ['解锁成就「{name}」！新造型「{tier}」放进相册了，按 C 去换上', '成就「{name}」达成！相册里多了「{tier}」'],
}

const EN: Lines = {
  hello: ['Hi, I\'m the whale girl. Help me find my friends!', 'DeepSeek is working. Merge a few?', 'Two of the same bump together and grow'],
  combo: ['Chain ×{n}!', 'Smooth! Chain ×{n}', 'It chained ×{n}'],
  bigCombo: ['Chain ×{n}! Did you plan that?', '×{n} chain! Beautiful', 'Amazing, chain ×{n}!'],
  firstTier: ['Your first {tier}!', 'Ooh, a {tier}', '{tier}! One step closer to me'],
  milestone: ['{n} points, steady now', '{n} points already', '{n}! Good run today'],
  danger: ['It\'s about to overflow!', 'Over the line! Merge the small ones', 'It\'s getting crowded up top…'],
  rescue: ['I got you! Cleared {n} little ones', 'Whale girl to the rescue! {n} cleared'],
  rescueEmpty: ['Nothing small left… it\'s up to you', 'I\'ve got nothing. You can do it!'],
  idleBusy: ['DeepSeek is still thinking. Merge a couple more?', 'If you just sit there I\'ll fall asleep', 'Waiting on AI is the best time to merge'],
  idleDone: ['DeepSeek is done. Go take a look?', 'The work\'s finished. Go check it'],
  aiDone: ['DeepSeek is done! Check it, then come back', 'Ding! DeepSeek turned in its work'],
  tired: ['That\'s {n} minutes. Did you check DeepSeek\'s work?', '{n} minutes in. Stretch and grab some water'],
  egg: ['You found it! Have a dolphin', 'Secret word accepted. That one\'s a dolphin now'],
  eggUsed: ['Already used this round. Try next game', 'Don\'t be greedy'],
  over: ['It\'s fine, one more?', 'So close!', 'You\'ll meet me next time'],
  record: ['New record! {n}', 'Record broken! {n}'],
  double: ['Two whale girls swam off together +100'],
  giftReady: ['DeepSeek turned in its work! Go check it, then come back for {n} pearl(s)', 'Ding, the work is done. Review it and {n} pearl(s) are yours'],
  giftGot: ['Checked it? Here are your {n} pearl(s)', 'Reviewing pays off. {n} pearl(s) for you'],
  noPearl: ['No pearls yet. Check DeepSeek\'s work when it\'s done and I\'ll give you some', 'Pearls come from reviewing the AI\'s work'],
  pearlFinal: ['A pearl for me? Thank you! +50'],
  shake: ['Shake it!', 'Here we go!'],
  shakeEmpty: ['No shakes left this round'],
  newDex: ['New find! {tier} added to the guide', 'Guide +1: {tier}'],
  achievement: ['Achievement "{name}"! New outfit "{tier}" is in the album. Press C to wear it', '"{name}" unlocked! "{tier}" added to the album'],
}

export function line(kind: TalkKind, zh: boolean, vars: { n?: number; tier?: string; name?: string } = {}): string {
  const pool = (zh ? ZH : EN)[kind]
  const s = pool[Math.floor(Math.random() * pool.length)]
  return s.replace('{n}', String(vars.n ?? '')).replace('{tier}', vars.tier ?? '').replace('{name}', vars.name ?? '')
}

/** 输入这个暗号触发彩蛋（不区分大小写）。 */
export const SECRET = 'deepseek'
