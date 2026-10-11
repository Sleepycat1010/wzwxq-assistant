// build-db.mjs
// 抓取王者万象棋官方 CDN 数据，归一化生成基础数据库 + 推荐阵容库。
// 数据源（稳定 CDN 直链，返回纯 JSON）：
//   英雄牌  https://game.gtimg.cn/images/amside/ide_timer/589094_oscard_new_1.js
//   天赋牌  https://game.gtimg.cn/images/amside/ide_timer/589094_oscard_new_8.js
//   装备牌  https://game.gtimg.cn/images/amside/ide_timer/589094_oscard_new_4.js
//   效果牌  https://game.gtimg.cn/images/amside/ide_timer/589094_oscard_new_2.js
//   推荐阵容 https://game.gtimg.cn/images/amside/ide_timer/598252_oslineupbyrecommend_pro_<page>.js  (分页)
//
// 运行：node scripts/build-db.mjs
// 产出：public/data/database.json  public/data/lineups.json  public/data/meta.json

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../public/data');

const SOURCE_BASE = 'https://game.gtimg.cn/images/amside/ide_timer/';
const SOURCES = {
  cardHero: SOURCE_BASE + '589094_oscard_new_1.js',
  cardTalent: SOURCE_BASE + '589094_oscard_new_8.js',
  cardEquip: SOURCE_BASE + '589094_oscard_new_4.js',
  cardEffect: SOURCE_BASE + '589094_oscard_new_2.js',
  lineup: (page) => SOURCE_BASE + `598252_oslineupbyrecommend_pro_${page}.js`,
};

// 棋手名 -> 类型（经济运营型 / 战斗增益型），用于阵容 fitType 标注。
// 来源：本项目 curated chessPlayers.json（白歌/乔汐/香香等真实棋手）。
const LORD_TYPE_MAP = {
  白歌: '经济运营型',
  乔汐: '战斗增益型',
  香香: '战斗增益型',
  庄小鱼: '经济运营型',
  瑶妹: '战斗增益型',
  玉环: '战斗增益型',
  马可: '经济运营型',
  弈星: '战斗增益型',
};

const PLATFORM = '王者万象棋官方（营地/官网）';

/** 清洗官方描述里的 HTML 标签与多余空白，保留纯文本。 */
function cleanDesc(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(color|b|i|u|strong|em|a)[^>]*>/gi, '')
    .replace(/<a[^>]*href=(\d+)[^>]*>/gi, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\n{2,}/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** 带超时与重试的 fetch JSON。 */
async function fetchJSON(url, { retries = 2, timeout = 20000 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 wzwxq-db-builder' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      // CDN 文件虽以 .js 结尾，实为纯 JSON（可能外层包了变量赋值，需剥离）。
      const json = extractJSON(text);
      clearTimeout(t);
      return json;
    } catch (e) {
      clearTimeout(t);
      if (attempt === retries) {
        console.error(`[WARN] 抓取失败 ${url}: ${e.message}`);
        return null;
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return null;
}

/** 兼容纯 JSON 或被 `var x = {...};` 包裹的 JSON。 */
function extractJSON(text) {
  const t = text.trim();
  // 直接是 JSON
  try {
    return JSON.parse(t);
  } catch {}
  // 形如 var x = {...}; 或 window.x = [...];
  const m = t.match(/=\s*([\[{][\s\S]*?)\s*;?\s*$/);
  if (m) {
    try {
      return JSON.parse(m[1]);
    } catch {}
  }
  throw new Error('无法解析 JSON');
}

function normalizeCard(item) {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    quality: item.quality,
    image: item.image || item.thumb || '',
    thumb: item.thumb || item.image || '',
    desc: cleanDesc(item.desc),
    relationId: item.relationID ?? null,
    relationName: item.relationName || null,
  };
}

async function buildCards() {
  const [heroJ, talentJ, equipJ, effectJ] = await Promise.all([
    fetchJSON(SOURCES.cardHero),
    fetchJSON(SOURCES.cardTalent),
    fetchJSON(SOURCES.cardEquip),
    fetchJSON(SOURCES.cardEffect),
  ]);

  const heroes = (heroJ?.heroCards || []).map(normalizeCard);
  const talents = (talentJ?.talentCards || []).map(normalizeCard);
  const equipments = (equipJ?.equipCards || []).map(normalizeCard);
  const effectCards = (effectJ?.effectCards || []).map(normalizeCard);

  // 阵营（羁绊）从英雄 relationName 归类
  const factionMap = new Map();
  for (const h of heroes) {
    const f = h.relationName || '未分类';
    if (!factionMap.has(f)) factionMap.set(f, []);
    factionMap.get(f).push(h.name);
  }
  const factions = [...factionMap.entries()]
    .map(([name, heroes]) => ({ name, heroCount: heroes.length, heroes }))
    .sort((a, b) => b.heroCount - a.heroCount);

  return { heroes, talents, equipments, effectCards, factions };
}

/** 由英雄名查阵营（用于给阵容标注阵营）。 */
function buildHeroFactionIndex(heroes) {
  const idx = new Map();
  for (const h of heroes) {
    if (h.relationName) idx.set(h.name, h.relationName);
  }
  return idx;
}

function tierFromUseNum(useNum, sortedNums) {
  if (!sortedNums.length) return 'T2';
  const rank = sortedNums.findIndex((n) => n === useNum);
  const pct = rank / sortedNums.length;
  if (pct < 0.15) return 'T0';
  if (pct < 0.5) return 'T1';
  return 'T2';
}

async function buildLineups(heroFactionIdx) {
  const all = [];
  let page = 1;
  // 分页抓取，直到拿不到数组或为空（最多 30 页保护）
  while (page <= 30) {
    const data = await fetchJSON(SOURCES.lineup(page));
    if (!data || !Array.isArray(data) || data.length === 0) break;
    all.push(...data);
    page += 1;
    if (data.length < 20) break; // 末页通常不足 20
  }

  const useNums = all.map((l) => Number(l.useNum) || 0).sort((a, b) => a - b);

  const lineups = all.map((l) => {
    const heroes = (l.heroList || []).map((h) => ({
      name: h.name,
      x: h.positionX ?? null,
      z: h.positionZ ?? null,
      level: h.level ?? null,
    }));
    const recommendedLords = (l.lordList || []).map((x) => x.name);

    // 阵营：取阵容英雄中占比最高的阵营
    const facCount = new Map();
    for (const h of l.heroList || []) {
      const f = heroFactionIdx.get(h.name);
      if (f) facCount.set(f, (facCount.get(f) || 0) + 1);
    }
    let faction = '未分类';
    let max = -1;
    for (const [f, c] of facCount) if (c > max) { max = c; faction = f; }

    // fitType：由推荐棋手中的已知类型推导
    let fitType = '通用';
    for (const name of recommendedLords) {
      if (LORD_TYPE_MAP[name]) { fitType = LORD_TYPE_MAP[name]; break; }
    }

    // 分阶段运营：operationDetails 的 index(1/2/3) -> early/mid/late
    const ops = { early: '', mid: '', late: '' };
    for (const od of l.operationDetails || []) {
      const desc = cleanDesc(od.desc || '');
      const key = od.index === 1 ? 'early' : od.index === 2 ? 'mid' : od.index === 3 ? 'late' : null;
      if (key && desc) ops[key] = desc;
    }

    const tier = tierFromUseNum(Number(l.useNum) || 0, useNums);

    const authorName = l.author?.name || '官方';
    const score = l.interactiveData?.score ? Number(l.interactiveData.score) : null;

    return {
      id: String(l.key),
      name: l.name,
      tier,
      fitType,
      faction,
      coreHeroes: heroes.map((h) => h.name),
      heroPositions: heroes,
      tagline: cleanDesc(l.brief || '').slice(0, 60),
      strategy: cleanDesc(l.brief || ''),
      positioning: cleanDesc(l.positionDesc || ''),
      equipment: cleanDesc(l.equipDesc || ''),
      operations: ops,
      recommendedLords,
      useNum: Number(l.useNum) || 0,
      score,
      author: authorName,
      counters: [],
      sources: [
        {
          platform: PLATFORM,
          author: authorName,
          url: l.jumpUrl || 'https://wxq.qq.com/',
          date: l.createTimestamp || '',
          note: `官方推荐阵容${score ? ` · 评分 ${score}` : ''} · 使用次数 ${Number(l.useNum) || 0}`,
        },
      ],
    };
  });

  return lineups;
}

async function main() {
  console.log('[1/3] 抓取卡牌数据（英雄/天赋/装备/效果牌）…');
  const { heroes, talents, equipments, effectCards, factions } = await buildCards();
  console.log(`  英雄 ${heroes.length} · 天赋 ${talents.length} · 装备 ${equipments.length} · 效果牌 ${effectCards.length} · 阵营 ${factions.length}`);

  const heroFactionIdx = buildHeroFactionIndex(heroes);

  console.log('[2/3] 抓取推荐阵容（分页）…');
  const lineups = await buildLineups(heroFactionIdx);
  console.log(`  推荐阵容 ${lineups.length} 套`);

  const meta = {
    fetchedAt: new Date().toISOString(),
    source: '腾讯王者万象棋官方 CDN（营地/官网）',
    sourceUrls: {
      heroes: SOURCES.cardHero,
      talents: SOURCES.cardTalent,
      equipments: SOURCES.cardEquip,
      effectCards: SOURCES.cardEffect,
      lineups: SOURCES.lineup('<page>'),
    },
    counts: {
      heroes: heroes.length,
      talents: talents.length,
      equipments: equipments.length,
      effectCards: effectCards.length,
      factions: factions.length,
      lineups: lineups.length,
    },
    note: '本数据库由官方公开 CDN 接口抓取并归一化，所有内容版权归腾讯及原作者所有。定时任务会自动刷新。',
  };

  // 安全护栏：若核心数据为空（多为网络 / CDN 异常），不覆盖旧文件，直接退出，避免清空线上数据。
  if (heroes.length < 50 || lineups.length < 50) {
    console.error(
      `[ABORT] 抓取结果异常（英雄 ${heroes.length} / 阵容 ${lineups.length}），疑似网络或 CDN 故障，保留原有数据不覆盖。`,
    );
    process.exit(0);
  }

  const database = { meta, factions, heroes, talents, equipments, effectCards };

  console.log('[3/3] 写入文件…');
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(resolve(OUT_DIR, 'database.json'), JSON.stringify(database, null, 2), 'utf8');
  await writeFile(resolve(OUT_DIR, 'lineups.json'), JSON.stringify(lineups, null, 2), 'utf8');
  await writeFile(resolve(OUT_DIR, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8');
  console.log(`完成：database.json / lineups.json / meta.json 已生成于 ${OUT_DIR}`);
}

main().catch((e) => {
  console.error('构建失败：', e);
  process.exit(1);
});
