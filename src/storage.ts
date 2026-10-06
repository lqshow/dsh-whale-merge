// 本地存档：每个浏览器 / 桌面端各存一份，不联网。
export const load = <V,>(key: string, fallback: V): V => {
  try {
    const raw = localStorage.getItem(`lq-whale.${key}`)
    return raw === null ? fallback : (JSON.parse(raw) as V)
  } catch {
    return fallback
  }
}
export const save = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(`lq-whale.${key}`, JSON.stringify(value))
  } catch {
    // 存不了就算了，不影响玩
  }
}
