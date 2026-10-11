# 王者万象棋小助手

一个可挂载在 **GitHub Pages** 上的动态静态网站，帮助玩家三步搞定本局阵容选择：

1. **多选本局禁用的阵容**（这些阵容本局不能玩）；
2. **单选自己的棋手**；
3. 系统**推荐可用阵容**（自动排除已禁用），每套推荐包含
   **站位、出装思路、前期/中期/后期运营思路**，并**标注多来源出处**
   （王者营地 · 玩一玩 · 王者攻略库(ima) · Bilibili 等），数据**运行时动态加载**，改 JSON 无需重新构建即可更新。

## 功能特性

- **三步向导**：禁用本局阵容 → 选择棋手 → 智能推荐可用阵容
- **阵营一键禁用**（第一步）：按「大河流域 / 三分之地 / 逐鹿 / 日落海 / 河洛 / 无阵营」六大阵营一键禁用 / 启用其下全部阵容
- **搜索 / 筛选**（第一步）：按阵容名 / 英雄名 / 阵营搜索，按「类型 / 强度」一键筛选，快速定位目标阵容
- **本地收藏**（第三步）：点击卡片右上角 ☆ 收藏阵容，使用浏览器 localStorage 持久化，刷新 / 重开仍保留；支持「只看收藏」快速回顾
- **基础数据库 · 图鉴**：顶部「图鉴」入口，浏览全部**英雄 / 效果牌 / 天赋 / 装备**与六大**阵营羁绊**及其英雄构成（数据来自官方 CDN，定时刷新）
- **多来源出处**：每套推荐标注平台 / 作者 / 链接 / 日期，可点击跳转；「数据来源」面板按平台分组汇总
- **动态更新**：编辑 `public/data/*.json` 提交即可让线上数据生效，无需重新构建

当前内置数据（由官方 CDN 抓取归一化）：**500+ 套推荐阵容 / 6 大阵营 / 85 名英雄 / 258 张天赋牌 / 73 件装备牌 / 98 张效果牌**，阵容出处覆盖腾讯王者万象棋官方（营地 / 官网）。

## 基础数据库与定时刷新

本项目的核心数据并非手工录入，而是由脚本 `scripts/build-db.mjs` 从**腾讯王者万象棋官方 CDN 接口**抓取并归一化：

- **英雄牌 / 天赋牌 / 装备牌 / 效果牌**：`game.gtimg.cn/images/amside/ide_timer/589094_oscard_new_{1,8,4,2}.js`
- **推荐阵容（分页）**：`game.gtimg.cn/images/amside/ide_timer/598252_oslineupbyrecommend_pro_<page>.js`

抓取结果写入 `public/data/database.json`（图鉴用）与 `public/data/lineups.json`（推荐用），并附带 `public/data/meta.json`（抓取时间 / 来源 / 数量）。

**定时刷新（联动部署）**：`.github/workflows/refresh-db.yml` 以 `cron` 每日运行一次，自动抓取最新官方数据并**提交到 `main`**，从而触发 `deploy.yml` 重新构建并部署到 GitHub Pages——实现「抓取 → 入库 → 上线」全链路自动化。也可在 Actions 页面手动 **Run workflow** 立即刷新。

```bash
npm run db:build     # 本地重新抓取并生成 public/data/*.json
```

## 技术栈

- [Vite](https://vitejs.dev/) + React 18 + TypeScript
- Tailwind CSS v3（暗色「竞技场」风：近黑底 + 王者金 + 绯红强调）
- Framer Motion（动效：错峰揭示、向导平滑过渡、卡片 hover 金边）
- 字体：ZCOOL KuaiLe（标题）/ Noto Sans SC（正文）/ Rajdhani（数字，Google Fonts）

## 本地运行

```bash
npm install
npm run dev        # 本地开发，默认 http://localhost:5173
```

## 构建

```bash
npm run build      # 类型检查 + 产物输出到 dist/
npm run preview    # 本地预览构建产物
```

`vite.config.ts` 已设置 `base: './'`，因此 `dist/` 可直接作为 GitHub Pages **项目页**
（`https://<user>.github.io/<repo>/`）使用，无需修改路径。

## 部署到 GitHub Pages

本项目使用官方 Pages Actions 部署（`dist/` → `gh-pages`）：

1. 将代码推送到 `main` 分支（或手动在 Actions 中运行 `Deploy to GitHub Pages`）。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 等待 workflow 完成，站点即可通过 `https://<user>.github.io/<repo>/` 访问。

> 根目录已放置 `.nojekyll`，避免 GitHub Pages 忽略以下划线开头的文件。

## 如何新增 / 更新来源与阵容

所有数据以 JSON 存放于 `public/data/`：

- `public/data/lineups.json` —— 阵容与每套的 `sources` 出处
- `public/data/chessPlayers.json` —— 棋手与出处

**动态更新机制**：站点运行时通过 `fetch` 加载这两个文件，因此
**只需编辑 JSON 并提交，无需重新构建** 即可让线上数据生效。

新增一套阵容的出处示例：

```json
{
  "platform": "玩一玩",
  "author": "卷心菜",
  "url": "https://www.wywyx.com/",
  "date": "2026-09-10",
  "note": "王者万象棋最强阵容推荐（XX流）"
}
```

> 兜底：若 `fetch` 失败（离线 / 某些静态托管限制），站点会自动回退到
> `src/data/fallback.ts` 中的内联数据，保证始终可用。

## 目录结构

```
wzwxq-assistant/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .nojekyll
├── .github/workflows/
│   ├── deploy.yml         # 构建并部署 Pages
│   └── refresh-db.yml     # 定时抓取官方数据并提交（联动部署）
├── public/
│   ├── favicon.svg
│   └── data/
│       ├── database.json  # 基础数据库（英雄/天赋/装备/效果牌/阵营）图鉴用
│       ├── lineups.json   # 推荐阵容（官方推荐阵容归一化）
│       ├── chessPlayers.json
│       └── meta.json      # 抓取时间/来源/数量
├── scripts/
│   └── build-db.mjs       # 抓取官方 CDN 并生成基础数据库
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types.ts
    ├── lib/{cn.ts, recommend.ts}
    ├── data/fallback.ts
    ├── hooks/useGameData.ts
    └── components/
        ├── Header.tsx
        ├── StepProgress.tsx
        ├── BanStep.tsx
        ├── ChessPlayerStep.tsx
        ├── RecommendStep.tsx
        ├── LineupCard.tsx
        ├── ChessPlayerCard.tsx
        ├── SourceBadge.tsx
        ├── SourcesPanel.tsx
        ├── CodexPanel.tsx
        └── Footer.tsx
```

## 推荐算法说明

评分（透明可解释，见 `src/lib/recommend.ts`）：

- 基础分：T0=100 / T1=80 / T2=60
- **数据驱动匹配**（最强信号）：该阵容官方推荐的棋手包含玩家所选棋手 → +30
- 棋手类型匹配（`fitType` === 玩家棋手类型）：+25
- 克制加成（被禁用的阵容恰好被本阵容克制）：+15
- 稳定微扰：基于 id 的确定性伪随机（0~5），保证排序每次一致

推荐时会**自动排除第一步已禁用的阵容**（含阵营一键禁用触发的批量禁用）。

最终按分数降序排序，并附带每条「推荐理由」用于 UI 展示。

> 说明：棋手技能与阵容内容均来自公开攻略（已在每套 `sources` 标注出处），版权归原作者所有；
> 数据随版本迭代，欢迎在 `public/data/` 中补充 / 修正并提 PR。
