# 王者万象棋小助手

一个可挂载在 **GitHub Pages** 上的动态静态网站，帮助玩家三步搞定本局阵容选择：

1. **多选本局禁用的阵容**（这些阵容本局不能玩）；
2. **单选自己的棋手**；
3. 系统**推荐可用阵容**（自动排除已禁用），每套推荐包含
   **站位、出装思路、前期/中期/后期运营思路**，并**标注多来源出处**
   （王者营地 · 玩一玩 · 王者攻略库(ima) · Bilibili 等），数据**运行时动态加载**，改 JSON 无需重新构建即可更新。

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
├── .github/workflows/deploy.yml
├── public/
│   ├── favicon.svg
│   └── data/
│       ├── lineups.json
│       └── chessPlayers.json
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
        └── Footer.tsx
```

## 推荐算法说明

评分（透明可解释，见 `src/lib/recommend.ts`）：

- 基础分：T0=100 / T1=80 / T2=60
- 棋手类型匹配（`fitType` === 玩家棋手类型）：+25
- 克制加成（被禁用的阵容恰好被本阵容克制）：+15
- 稳定微扰：基于 id 的确定性伪随机（0~5），保证排序每次一致

最终按分数降序排序，并附带每条「推荐理由」用于 UI 展示。

> 说明：部分棋手（标注「示例·待核实」）为占位数据，待官方资料核实后替换；
> 所有攻略内容版权归原作者所有。
