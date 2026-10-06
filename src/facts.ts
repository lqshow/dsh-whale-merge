// 知识卡片：合成出水母及以上时弹一张，没看过的优先。
// 加卡片请写清楚出处，日期、数字、谁说的都要能核对。
export type Fact = { id: string; tag: 'DSH' | '模型' | '概念' | '技巧' | '彩蛋'; zh: string; en?: string }

export const FACTS: Fact[] = [
  // ---- DeepSeek Harness ----
  { id: 'dsh-plugins', tag: 'DSH', zh: '「一切皆插件」是 DeepSeek Harness 立项时就定下的方向。你看到的侧边栏、输入框上方的提示条，都可以由插件挂上去。', en: '"Everything is a plugin" was a founding principle of DeepSeek Harness. Sidebar tabs and the bar above the composer can all come from plugins.' },
  { id: 'dsh-ccmods', tag: 'DSH', zh: 'DSH v0.2.1-alpha.1 加入了实验性的 Claude Code Mods 兼容层，现阶段只能在输入框上方画一条文字横幅，所以这个游戏是用 DSH 原生插件写的。', en: 'DSH v0.2.1-alpha.1 added an experimental Claude Code Mods compatibility layer. It can only draw a text banner for now, so this game is a native DSH plugin.' },
  { id: 'dsh-loader', tag: 'DSH', zh: 'DSH 插件的浏览器端会被打包成一个 client.js，通过 window.__ModuleLoader__.load 注册，React 由宿主提供。', en: 'A DSH plugin\'s browser half is bundled into client.js and registered via window.__ModuleLoader__.load, with React provided by the host.' },
  { id: 'dsh-github', tag: 'DSH', zh: 'DSH 插件可以直接从 GitHub 装，格式是 github:用户/仓库#path:子目录。', en: 'DSH plugins install straight from GitHub: github:user/repo#path:subdir.' },
  { id: 'dsh-nobuild', tag: 'DSH', zh: '从 GitHub 安装 DSH 插件时不会运行构建脚本，所以打包好的 client.js 要一起提交进仓库。', en: 'Installing from GitHub doesn\'t run a build, so commit the bundled client.js.' },
  { id: 'dsh-slots', tag: 'DSH', zh: '这个游戏在 DSH 里只用了三个挂载点：右侧边栏标签页、输入框上方的提示条、会话运行状态事件。', en: 'This game uses three DSH hooks: a right-sidebar tab, the bar above the composer, and the session status event.' },

  // ---- DeepSeek 模型 ----
  { id: 'v3-moe', tag: '模型', zh: 'DeepSeek-V3 是 MoE 模型：总参数 671B，但每个 token 只激活约 37B。', en: 'DeepSeek-V3 is a MoE model: 671B total parameters, about 37B active per token.' },
  { id: 'mla', tag: '模型', zh: 'MLA（多头潜在注意力）把 Key/Value 压缩成低维的潜向量再缓存，推理时的 KV Cache 因此小了很多。', en: 'MLA (multi-head latent attention) caches a compressed latent instead of full keys and values, shrinking the KV cache.' },
  { id: 'fp8', tag: '模型', zh: 'DeepSeek-V3 在超大规模上验证了 FP8 混合精度训练，这是它训练成本低的原因之一。', en: 'DeepSeek-V3 validated FP8 mixed-precision training at very large scale, one reason its training was cheap.' },
  { id: 'mtp', tag: '模型', zh: 'DeepSeek-V3 训练时用了多 token 预测（MTP）：一次预测后面好几个 token，这个模块推理时还能拿来做投机解码。', en: 'DeepSeek-V3 trained with multi-token prediction; the MTP module can also drive speculative decoding.' },
  { id: 'r1-mit', tag: '模型', zh: 'DeepSeek-R1 在 2025 年 1 月发布，权重以 MIT 协议开源。', en: 'DeepSeek-R1 was released in January 2025 with MIT-licensed weights.' },
  { id: 'r1-zero', tag: '模型', zh: 'R1-Zero 直接在基座模型上做强化学习，没有先做监督微调。论文里记录了模型自己学会回头检查的「顿悟时刻」。', en: 'R1-Zero applied RL directly to the base model with no SFT first; the paper describes an "aha moment" where it learned to re-check itself.' },
  { id: 'grpo', tag: '模型', zh: 'GRPO 最早出现在 DeepSeekMath 论文里：不需要单独的价值模型，用同一道题的一组回答互相比较来算优势。', en: 'GRPO first appeared in the DeepSeekMath paper: no value model, advantages come from comparing a group of answers to the same prompt.' },
  { id: 'oss-week', tag: '模型', zh: '2025 年 2 月 DeepSeek 搞了「开源周」，连续开源了 FlashMLA、DeepEP、DeepGEMM 等底层代码。', en: 'In February 2025 DeepSeek held an "Open Source Week", releasing FlashMLA, DeepEP, DeepGEMM and more.' },
  { id: 'v31-hybrid', tag: '模型', zh: 'DeepSeek-V3.1 开始在同一个模型里支持思考和非思考两种模式。', en: 'DeepSeek-V3.1 put thinking and non-thinking modes in a single model.' },
  { id: 'v32-dsa', tag: '模型', zh: 'DeepSeek-V3.2-Exp 引入了 DSA 稀疏注意力，主要是为了让长上下文更便宜。', en: 'DeepSeek-V3.2-Exp introduced DSA sparse attention, mainly to make long context cheaper.' },
  { id: 'api-openai', tag: '模型', zh: 'DeepSeek API 兼容 OpenAI 的接口格式，很多工具改一下 base_url 和 key 就能接上。', en: 'The DeepSeek API is OpenAI-compatible; many tools only need a new base_url and key.' },
  { id: 'api-cache', tag: '模型', zh: 'DeepSeek API 默认开启上下文硬盘缓存：重复的前缀命中缓存后，这部分输入按更低的价格计费。', en: 'The DeepSeek API caches context on disk by default; cache-hit input tokens are billed at a lower price.' },

  // ---- 概念 ----
  { id: 'token', tag: '概念', zh: 'Token 不等于字。一个汉字可能是一个 token，也可能是好几个，取决于分词器。', en: 'A token isn\'t a character or a word; how text splits depends on the tokenizer.' },
  { id: 'ctx', tag: '概念', zh: '上下文窗口是模型一次能「看见」的 token 上限。对话太长时，早先的内容会被压缩或截掉，具体看工具怎么处理。', en: 'The context window is how many tokens a model can see at once. Long chats get compacted or truncated, depending on the tool.' },
  { id: 'agent-loop', tag: '概念', zh: 'Agent 的核心是一个循环：模型决定调用哪个工具，执行，把结果放回上下文，再决定下一步。', en: 'An agent is a loop: the model picks a tool, it runs, the result goes back into context, repeat.' },
  { id: 'harness', tag: '概念', zh: 'Harness 是包在模型外面的那一层：工具、权限、上下文管理、界面。同一个模型换个 Harness，干活的效果可能差很多。', en: 'A harness is everything around the model: tools, permissions, context management, UI. The same model can perform very differently in different harnesses.' },
  { id: 'mcp', tag: '概念', zh: 'MCP（Model Context Protocol）是 Anthropic 在 2024 年 11 月开源的协议，让模型用统一的方式连接外部工具和数据。', en: 'MCP (Model Context Protocol) was open-sourced by Anthropic in November 2024 as a standard way to connect models to tools and data.' },
  { id: 'kv', tag: '概念', zh: 'KV Cache：生成每个新 token 时，复用前面 token 已经算好的 Key 和 Value，不用从头再算。', en: 'KV cache: when generating each new token, reuse the keys and values already computed for earlier tokens.' },
  { id: 'moe-experts', tag: '概念', zh: 'MoE 里的「专家」不是按学科分的，是路由器在训练中学出来的分工，每个 token 只走少数几个专家。', en: 'MoE "experts" aren\'t subject areas; the router learns the split, and each token visits only a few.' },
  { id: 'spec-decode', tag: '概念', zh: '投机解码：先快速猜出几个 token，再让大模型一次性验证。输出和原来一样，只是更快。', en: 'Speculative decoding: guess several tokens cheaply, then verify them in one pass of the big model. Same output, faster.' },
  { id: 'ccmods', tag: '概念', zh: 'Claude Code 的 Mod 是挂在事件上的函数：可以拦下、改掉事件，也可以在界面上画自己的东西。', en: 'A Claude Code mod is a function attached to an event: it can intercept or change it, or draw its own UI.' },

  // ---- 技巧 ----
  { id: 'tip-verify', tag: '技巧', zh: '让 AI 写代码前，先给它一个能自己跑的验证方式（测试、脚本、截图），比反复描述需求更省返工。', en: 'Give the AI a way to check its own work (tests, a script, a screenshot) before it codes. It beats re-explaining the spec.' },
  { id: 'tip-specific', tag: '技巧', zh: '给 Agent 的任务越具体（哪个文件、哪个函数、期望什么行为），返工越少。', en: 'The more specific the task (which file, which function, what behavior), the less rework.' },
  { id: 'tip-plan', tag: '技巧', zh: '大改动先让 AI 出方案、你确认了再动手，比直接改完再推倒便宜得多。', en: 'For big changes, have the AI plan first and approve it before any edits.' },

  // ---- 彩蛋 ----
  { id: 'egg-watermelon', tag: '彩蛋', zh: '这个玩法来自 2021 年初刷屏的「合成大西瓜」。这里最后合出来的不是西瓜，是鲸鱼娘。', en: 'The gameplay comes from "Merge Watermelon", a 2021 viral hit. Here the final merge is the whale girl.' },
  { id: 'egg-orca', tag: '彩蛋', zh: '虎鲸其实是海豚科里体型最大的成员。所以在这里，两只海豚合成虎鲸也算说得通。', en: 'Orcas are the largest members of the dolphin family, so two dolphins making an orca is fair.' },
  { id: 'egg-blue', tag: '彩蛋', zh: '蓝鲸是目前已知地球上最大的动物，比任何恐龙都大。', en: 'The blue whale is the largest animal known to have lived, bigger than any dinosaur.' },
]

/** 出卡顺序：没看过的先出，同一类里打乱。 */
export function queueFor(seen: string[], seed: number): Fact[] {
  const s = new Set(seen)
  let a = seed >>> 0
  const rnd = (): number => {
    a = (Math.imul(a ^ (a >>> 15), 2246822507) + 0x9e3779b9) >>> 0
    return a / 4294967296
  }
  const shuffle = (xs: Fact[]): Fact[] => {
    const out = xs.slice()
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
  }
  const fresh = shuffle(FACTS.filter(f => !s.has(f.id)))
  const old = shuffle(FACTS.filter(f => s.has(f.id)))
  return [...fresh, ...old]
}
