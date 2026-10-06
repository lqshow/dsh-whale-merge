// 本地预览：不装 DSH 也能在浏览器里玩，顺便模拟"DeepSeek 正在干活"。
//   preview.html            玩游戏
//   preview.html#gallery    合成链全家福（写文章截图用）
//   preview.html#final      直接放两只虎鲸，看合成鲸鱼娘的效果
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { __preview } from '../src/client'
import { TIERS } from '../src/game'
import { FONT } from '../src/render'

const { WhaleBody, WhaleHint, setRunning, game, drawCreature, head, onRunFinished, setPearls } = __preview
;(window as unknown as Record<string, unknown>).__setPearls = setPearls
;(window as unknown as Record<string, unknown>).__unlock = __preview.unlock
;(window as unknown as Record<string, unknown>).__game = game

function Gallery(): React.ReactNode {
  const ref = React.useRef<HTMLCanvasElement>(null)
  React.useEffect(() => {
    const cv = ref.current!
    const c = cv.getContext('2d')!
    const dpr = 2
    const w = 900, h = 320
    cv.width = w * dpr; cv.height = h * dpr
    cv.style.width = `${w}px`; cv.style.height = `${h}px`
    const draw = (now: number): void => {
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      const g = c.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, '#5f86ff'); g.addColorStop(1, '#132a6b')
      c.fillStyle = g; c.fillRect(0, 0, w, h)
      let x = 30
      TIERS.forEach((t, i) => {
        const r = t.r * 0.62
        x += r
        c.save(); c.translate(x, 180 - r * 0.2); drawCreature(c, i, r, now, head()); c.restore()
        c.fillStyle = '#fff'; c.font = `700 14px ${FONT}`; c.textAlign = 'center'
        c.fillText(t.zh, x, 270)
        x += r + 14
      })
      requestAnimationFrame(draw)
    }
    requestAnimationFrame(draw)
  }, [])
  return <canvas ref={ref} style={{ borderRadius: 16 }} />
}

function App(): React.ReactNode {
  const [running, setR] = React.useState(true)
  React.useEffect(() => setRunning('demo', running), [running])
  React.useEffect(() => {
    if (location.hash === '#final') {
      game().spawn(9, 110, 300)
      game().spawn(9, 250, 300)
    }
  }, [])
  if (location.hash === '#gallery') return <div style={{ padding: 16 }}><Gallery /></div>
  return (
    <div style={{ display: 'flex', gap: 16, height: '100vh', boxSizing: 'border-box', padding: 16 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 8 }}>
        <WhaleHint sessionId="hint-demo" open={() => {}} />
        <button onClick={() => setR(r => !r)}>{running ? '模拟：DeepSeek 干完了' : '模拟：DeepSeek 开始干活'}</button>
        <button
          id="sim-long"
          onClick={() => {
            // 假装这一轮跑了 90 秒，干完时会送 2 颗珍珠
            onRunFinished(90_000)
            setRunning('demo', false)
            setR(false)
          }}
        >
          模拟：DeepSeek 跑了 90 秒后干完（交作业奖励）
        </button>
      </div>
      <div style={{ width: 420, height: '100%', border: '1px solid rgba(127,127,127,.3)', borderRadius: 12 }}>
        <WhaleBody sessionId="demo" />
      </div>
    </div>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
