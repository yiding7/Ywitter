# Ywitter — 像 Ye 一样发言

[English](./README.md) · **简体中文**

选一个年份，给它一个话题，它就会用 Ye 当年真实的发帖风格回你一条——大写、长句、那股劲儿。
然后生成一张 “Ywitter” 风格的仿真卡片，可以导出为 PNG。

这是一个恶搞玩具。所有生成的内容都是机器编造的、假的，没有一句出自任何真人之手。

## 功能

- **按时代还原风格** —— 风格样本按年份（及月份）分组，取自约 6000 条旧帖的公开存档。
  每一年的全大写倾向都是从真实数据里统计出来的，所以 2013 年在“吼”，2018 年基本不吼。
- **自带 API Key（任意厂商）** —— 支持 Anthropic (Claude)、OpenAI、Google Gemini、
  DeepSeek、Kimi（月之暗面）、通义千问（DashScope）、MiniMax，以及任何兼容 OpenAI 的接口。
  Key 只保存在你自己的浏览器里（localStorage），并直接发送给你选择的厂商。
- **免费离线模式** —— 没有 Key？它会退回到本地生成：把该时代的真实帖子重新拼接。
  连贯性更低，混乱度更高。
- **高度还原的仿真卡片** —— 四种 UI 时代（早期 / 经典 / 现代 / 暗黑），按年份匹配头像和显示名，
  外加一组 Ye 风格字体（Helvetica、Times、Impact、等宽）。每张卡片都带 **Parody（恶搞）** 标识，
  防止被当成真的。
- **内容安全** —— 生成前会拦截辱骂／歧视性输入；对从原始存档里冒出来的脏词，输出时会打码。

## 本地运行

需要 Node 18+。

```bash
npm install
npm run dev       # http://localhost:5173
```

构建静态站点：

```bash
npm run build     # 输出到 dist/
```

## 使用方法

1. 选择 **年份**（或 *Overall* 表示全部年份），可选 **月份**。
2. 输入 **主题**（最多 280 字）—— 例如 “周一早晨”、“寿司”。
3. 为卡片选择 **UI 时代** 和 **字体**。
4. （可选）点击 **add API key**，选择厂商，粘贴你的 Key，点 **Save & Test** 确认它能在浏览器里正常工作。
5. 点 **Generate**，再点 **Export PNG**。

没有 Key？跳过第 4 步——它会走免费的离线生成器。

## 数据

- `npm run scrape` —— 重新抓取完整存档到 `data/raw/*.json`（只保存在你本地机器上，已被 git 忽略）。
- `npm run build:corpus` —— 把 `data/raw` 压缩成随应用打包的小体积 `src/data/corpus.json`
  （纯文本、按年月分组、每月限量，并带上每年的全大写比例）。

风格样本来自公开存档 [yzy-twts.com](https://yzy-twts.com)。
本项目是非商业性质的恶搞作品，与任何个人或平台均无关联。

## 部署（GitHub Pages）

仓库已包含工作流 `.github/workflows/deploy.yml`。推送到 `main` 分支后，进入仓库的
**Settings → Pages → Source: GitHub Actions**。它会自动构建并发布 `dist/`。
构建使用相对的 base 路径，因此在子路径下也能直接工作，无需额外配置。

## 技术栈

Vite + React + TypeScript + Tailwind，PNG 导出使用 `html-to-image`。
纯静态——没有后端，也没有任何服务端密钥。

## 许可证

[MIT](./LICENSE) © 2026 yiding
