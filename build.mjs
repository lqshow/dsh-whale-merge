// 把 src/client.tsx 打成 DSH 浏览器端认的 client.js：
// 一个 window.__ModuleLoader__.load({ id, factory(require) }) 调用，React 由宿主的 require 提供。
//   node build.mjs            构建 client.js
//   node build.mjs --test     跑物理模拟测试
//   node build.mjs --preview  构建本地预览页 dev/preview.html（自带 React，不需要 DSH）
import { build } from 'esbuild'
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const arg = process.argv[2]
const common = {
  bundle: true,
  write: false,
  platform: 'browser',
  target: 'es2022',
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  loader: { '.jpg': 'dataurl', '.png': 'dataurl' },
  minify: true,
  legalComments: 'none',
}

if (arg === '--test') {
  const out = await build({ ...common, entryPoints: ['tests/sim.ts'], platform: 'node', format: 'cjs', minify: false })
  writeFileSync('/tmp/whale-sim.cjs', out.outputFiles[0].text)
  execFileSync(process.execPath, ['/tmp/whale-sim.cjs'], { stdio: 'inherit' })
} else if (arg === '--preview') {
  const out = await build({ ...common, entryPoints: ['dev/preview.tsx'], format: 'iife' })
  writeFileSync(new URL('./dev/preview.js', import.meta.url), out.outputFiles[0].text)
  console.log('dev/preview.js 已生成，用浏览器打开 dev/preview.html')
} else {
  const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
  const out = await build({ ...common, entryPoints: ['src/client.tsx'], format: 'cjs', external: ['react'] })
  const js = `window.__ModuleLoader__.load({
  id: ${JSON.stringify(pkg.name)},
  factory(require) {
    const module = { exports: {} };
    (function (module, exports, require) {
${out.outputFiles[0].text}
    })(module, module.exports, require);
    return module.exports;
  },
});
`
  writeFileSync(new URL('./client.js', import.meta.url), js)
  console.log(`client.js ${(js.length / 1024).toFixed(0)} KB`)
}
