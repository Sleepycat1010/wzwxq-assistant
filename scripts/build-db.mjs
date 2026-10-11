// build-db.mjs
// 抓取王者万象棋官方 CDN 数据，归一化生成基础数据库 + 推荐阵容库 + 棋手库 + 版本更新日志。
// 数据源（稳定 CDN 直链，返回纯 JSON）：
//   英雄牌  https://game.gtimg.cn/images/amside/ide_timer/589094_oscard_new_1.js
//   天赋牌  https://game.gtimg.cn/images/amside/ide_timer/589094_oscard_new_8.js
//   装备牌  https://game.gtimg.cn/images/amside/ide_timer/589094_oscard_new_4.js
//   效果牌  https://game.gtimg.cn/images/amside/ide_timer/589094_oscard_new_2.js
//   棋手+汇总 https://game.gtimg.cn/images/amside/ide_timer/589094_oscard_new_16.js
//   推荐阵容 https://game.gtimg.cn/images/amside/ide_timer/598252_oslineupbyrecommend_pro_<page>.js  (分页)
//
// 运行：node scripts/build-db.mjs
// 产出：public/data/database.json  public/data/lineups.json  public/data/meta.json
//       public/data/chessPlayers.json  public/data/changelog.json

import { writeFile, mkdir, readFile } from 'node:fs/promises';
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
  combined: SOURCE_BASE + '589094_oscard_new_16.js',
  lineup: (page) => SOURCE_BASE + `598252_oslineupbyrecommend_pro_${page}.js`,
};

// 棋手名 -> 类型（经济运营型 / 战斗增益型 / 通用），用于棋手 fitType 标注。
// 覆盖官方全部 20 位棋手（与 chessPlayers.json 保持一致）。
const LORD_TYPE_MAP = {
  白歌: '经济运营型',
  乔汐: '经济运营型',
  香香: '战斗增益型',
  庄小鱼: '经济运营型',
  瑶妹: '战斗增益型',
  玉环: '经济运营型',
  马可: '经济运营型',
  弈星: '通用',
  小妲己: '经济运营型',
  闹闹: '经济运营型',
  姜导: '战斗增益型',
  班叔: '战斗增益型',
  昭君: '战斗增益型',
  嬴律: '经济运营型',
  常小娥: '战斗增益型',
  明先生: '经济运营型',
  孙小宾: '通用',
  镜: '战斗增益型',
  阿离: '战斗增益型',
  安琪拉: '战斗增益型',
};

/** 判定一段描述是否为"废话占位"（如"如图所示"），需要反推补全。 */
function isJunkText(text) {
  if (!text) return true;
  return /如图所示|见上图|如上图|见下图|如左图|如右图|点击查看/.test(text);
}

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
  try {
    return JSON.parse(t);
  } catch {}
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

/** 英雄归一化：保留技能(desc)、费用、觉醒进化、关联卡与头像。 */
function normalizeHero(item) {
  const evo = item.heroCard?.awakeingCard;
  const related = [];
  for (const k of ['effectCard', 'equipCard', 'talentCard', 'sourceCards']) {
    const arr = item[k];
    if (Array.isArray(arr)) {
      for (const c of arr) if (c && c.name) related.push(c.name);
    }
  }
  const cost =
    item.shopBuyCost && typeof item.shopBuyCost === 'object'
      ? item.shopBuyCost.Count ?? null
      : null;
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    quality: item.quality,
    image: item.image || '',
    thumb: item.thumb || '',
    desc: cleanDesc(item.desc),
    relationId: item.relationID ?? null,
    relationName: item.relationName || null,
    cost,
    effectTypeDesc: item.effectTypeDesc ? cleanDesc(item.effectTypeDesc) : '',
    evolution:
      evo && evo.desc && evo.desc !== item.desc
        ? { name: evo.name, image: evo.image || '', desc: cleanDesc(evo.desc) }
        : null,
    relatedCards: [...new Set(related)],
  };
}

/** 棋手(lord)归一化：技能组(talents)、头像、关联卡。 */
function normalizeLord(item) {
  const talents = (item.talent || []).map((t) => ({
    name: t.name,
    level: t.level ?? 1,
    icon: t.icon || '',
    desc: cleanDesc((t.cards || []).map((c) => c.desc).join('\n')),
    cards: (t.cards || []).map((c) => ({
      name: c.name,
      thumb: c.thumb || '',
      desc: cleanDesc(c.desc),
    })),
  }));
  const relatedCards = (item.relatedCards || []).map((c) => ({
    name: c.name,
    thumb: c.thumb || '',
  }));
  return {
    lordId: item.lordId,
    name: item.name,
    icon: item.icon || '',
    portrait: item.portrait || '',
    avatar: item.avatar || '',
    type: LORD_TYPE_MAP[item.name] || '通用',
    talents,
    relatedCards,
  };
}

/** 由 lords 生成 chessPlayers.json（保留 Step2 选择契约，并附带详解字段）。 */
function buildChessPlayers(lords) {
  return lords.map((l) => ({
    id: String(l.lordId),
    name: l.name,
    type: l.type,
    skill: l.talents[0]?.desc || '',
    talent: l.talents[0]?.name || '',
    icon: l.icon,
    avatar: l.avatar,
    portrait: l.portrait,
    lordId: l.lordId,
    source: {
      platform: PLATFORM,
      author: '官方',
      url: 'https://wxq.qq.com/',
      date: '',
      note: '官方棋手数据（技能/关联卡取自官方接口）',
    },
    talents: l.talents,
    relatedCards: l.relatedCards,
    placeholder: false,
  }));
}

async function buildCards() {
  const [heroJ, talentJ, equipJ, effectJ, combinedJ] = await Promise.all([
    fetchJSON(SOURCES.cardHero),
    fetchJSON(SOURCES.cardTalent),
    fetchJSON(SOURCES.cardEquip),
    fetchJSON(SOURCES.cardEffect),
    fetchJSON(SOURCES.combined),
  ]);

  const heroes = (heroJ?.heroCards || []).map(normalizeHero);
  const talents = (talentJ?.talentCards || []).map(normalizeCard);
  const equipments = (equipJ?.equipCards || []).map(normalizeCard);
  const effectCards = (effectJ?.effectCards || []).map(normalizeCard);
  const lords = (combinedJ?.lords || []).map(normalizeLord);
  const chessPlayers = buildChessPlayers(lords);

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

  return { heroes, talents, equipments, effectCards, lords, chessPlayers, factions };
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

/** 出装思路：优先用官方 equipDesc，缺失时按每个英雄的装备反推。 */
function buildEquipment(l) {
  const desc = cleanDesc(l.equipDesc || '');
  if (!isJunkText(desc)) return desc;
  const items = [];
  for (const h of l.heroList || []) {
    const eq = (h.equipList || []).map((e) => e.name).filter(Boolean);
    if (eq.length) items.push(`${h.name}：${eq.join('、')}`);
  }
  return items.length ? '推荐出装（按英雄）：' + items.join('；') : '';
}

/** 站位思路：优先用官方 positionDesc，缺失时按坐标反推前后排。z=0 为前排。 */
function buildPositioning(l) {
  const desc = cleanDesc(l.positionDesc || '');
  if (!isJunkText(desc)) return desc;
  const rows = {};
  for (const h of l.heroList || []) {
    const z = h.positionZ;
    if (typeof z !== 'number') continue;
    if (!rows[z]) rows[z] = [];
    rows[z].push(h.name);
  }
  const zs = Object.keys(rows).map(Number).sort((a, b) => a - b);
  if (!zs.length) return '';
  const parts = zs.map((z, i) => {
    const label = i === 0 ? '前排' : i === zs.length - 1 ? '后排' : `第${i + 1}排`;
    return `${label}(${z})：${rows[z].join('、')}`;
  });
  return '站位（按坐标反推）：' + parts.join('；');
}

async function buildLineups(heroFactionIdx) {
  const all = [];
  let page = 1;
  while (page <= 30) {
    const data = await fetchJSON(SOURCES.lineup(page));
    if (!data || !Array.isArray(data) || data.length === 0) break;
    all.push(...data);
    page += 1;
  }

  const useNums = all.map((l) => Number(l.useNum) || 0).sort((a, b) => a - b);

  const lineups = all.map((l) => {
    const heroes = (l.heroList || []).map((h) => ({
      name: h.name,
      x: h.positionX ?? null,
      z: h.positionZ ?? null,
      level: h.level ?? null,
      equip: (h.equipList || []).map((e) => e.name).filter(Boolean),
    }));
    const recommendedLords = (l.lordList || []).map((x) => x.name);

    const facCount = new Map();
    for (const h of l.heroList || []) {
      const f = heroFactionIdx.get(h.name);
      if (f) facCount.set(f, (facCount.get(f) || 0) + 1);
    }
    let faction = '未分类';
    let max = -1;
    for (const [f, c] of facCount) if (c > max) { max = c; faction = f; }

    let fitType = '通用';
    for (const name of recommendedLords) {
      if (LORD_TYPE_MAP[name]) { fitType = LORD_TYPE_MAP[name]; break; }
    }

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
      positioning: buildPositioning(l),
      equipment: buildEquipment(l),
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

/* ============ 版本更新 diff ============ */

const CAT_LABEL = {
  heroes: '英雄',
  lords: '棋手',
  equipments: '装备',
  effectCards: '效果牌',
  talents: '天赋',
};

/** 取对象在比较字段上的签名串。 */
function sig(obj, keys) {
  return keys
    .map((k) => {
      const v = obj[k];
      if (v == null) return '';
      return typeof v === 'object' ? JSON.stringify(v) : String(v);
    })
    .join('|');
}

/**
 * 计算两个版本之间的改动。
 * @param oldArr 旧数组（可能为空/缺失，表示首次建立基线）
 * @param newArr 新数组
 * @param idKey 唯一键
 * @param sigKeys 比较字段（仅这些字段变化才算"改动"，避免结构升级刷屏）
 */
function diffCategory(oldArr, newArr, idKey, sigKeys) {
  const out = [];
  const oldMap = new Map(oldArr.map((o) => [String(o[idKey]), o]));
  const newMap = new Map(newArr.map((o) => [String(o[idKey]), o]));
  for (const [id, o] of newMap) {
    if (!oldMap.has(id)) out.push({ type: 'added', name: o.name, id });
  }
  for (const [id, o] of oldMap) {
    if (!newMap.has(id)) out.push({ type: 'removed', name: o.name, id });
  }
  for (const [id, o] of newMap) {
    const old = oldMap.get(id);
    if (old && sig(o, sigKeys) !== sig(old, sigKeys)) {
      out.push({ type: 'changed', name: o.name, id });
    }
  }
  return out;
}

/**
 * 对比新旧数据库，生成版本更新日志条目。
 * 返回 { entry, changed } —— entry 为要写入的日志条目（可能为 null）。
 */
function buildChangelog(oldDb, newDb, oldPlayers, newPlayers, today, changelogExisted) {
  const categories = [
    { key: 'heroes', arr: newDb.heroes, oldArr: oldDb.heroes || [], idKey: 'id', sigKeys: ['name', 'desc', 'relationName'] },
    { key: 'equipments', arr: newDb.equipments, oldArr: oldDb.equipments || [], idKey: 'id', sigKeys: ['name', 'desc'] },
    { key: 'effectCards', arr: newDb.effectCards, oldArr: oldDb.effectCards || [], idKey: 'id', sigKeys: ['name', 'desc'] },
    { key: 'talents', arr: newDb.talents, oldArr: oldDb.talents || [], idKey: 'id', sigKeys: ['name', 'desc'] },
    { key: 'lords', arr: newPlayers, oldArr: oldPlayers || [], idKey: 'lordId', sigKeys: ['name', 'skill', 'talent', 'type'] },
  ];

  // 首次建立基线：旧库缺失/空，或尚未有过任何版本日志（首次启用本功能）-> 只记全量同步。
  // 这样从「手写棋手数据」切换到「官方派生」的过渡不会被当成 20 条噪声改动。
  const isBaseline =
    !changelogExisted || !oldDb.heroes || oldDb.heroes.length === 0;

  const changes = [];
  for (const c of categories) {
    const items = isBaseline ? [] : diffCategory(c.oldArr, c.arr, c.idKey, c.sigKeys);
    for (const it of items) changes.push({ cat: c.key, ...it });
  }

  if (isBaseline) {
    const summary = {};
    for (const c of categories) summary[c.key] = c.arr.length;
    return {
      changed: true,
      entry: {
        version: today,
        date: today,
        title: '数据库初始化 · 全量同步官方数据',
        baseline: true,
        summary,
        changes: [],
      },
    };
  }

  if (changes.length === 0) return { changed: false, entry: null };

  const summary = { added: {}, removed: {}, changed: {} };
  for (const ch of changes) {
    summary[ch.type][ch.cat] = (summary[ch.type][ch.cat] || 0) + 1;
  }
  return {
    changed: true,
    entry: {
      version: today,
      date: today,
      title: '官方数据更新',
      summary,
      changes,
    },
  };
}

async function readJSONSafe(p) {
  try {
    return JSON.parse(await readFile(p, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  console.log('[1/4] 抓取卡牌数据（英雄/天赋/装备/效果牌/棋手）…');
  const { heroes, talents, equipments, effectCards, lords, chessPlayers, factions } = await buildCards();
  console.log(
    `  英雄 ${heroes.length} · 天赋 ${talents.length} · 装备 ${equipments.length} · 效果牌 ${effectCards.length} · 棋手 ${lords.length} · 阵营 ${factions.length}`,
  );

  const heroFactionIdx = buildHeroFactionIndex(heroes);

  console.log('[2/4] 抓取推荐阵容（分页）…');
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
      lords: SOURCES.combined,
      lineups: SOURCES.lineup('<page>'),
    },
    counts: {
      heroes: heroes.length,
      talents: talents.length,
      equipments: equipments.length,
      effectCards: effectCards.length,
      lords: lords.length,
      factions: factions.length,
      lineups: lineups.length,
    },
    note: '本数据库由官方公开 CDN 接口抓取并归一化，所有内容版权归腾讯及原作者所有。定时任务会自动刷新。',
  };

  // 安全护栏：核心数据为空（多为网络 / CDN 异常），不覆盖旧文件，避免清空线上数据。
  if (heroes.length < 50 || lineups.length < 50) {
    console.error(
      `[ABORT] 抓取结果异常（英雄 ${heroes.length} / 阵容 ${lineups.length}），疑似网络或 CDN 故障，保留原有数据不覆盖。`,
    );
    process.exit(0);
  }

  const database = { meta, factions, heroes, talents, equipments, effectCards };

  // 读取上一版（用于版本更新 diff）
  const oldDb = (await readJSONSafe(resolve(OUT_DIR, 'database.json'))) || {};
  const oldPlayers = await readJSONSafe(resolve(OUT_DIR, 'chessPlayers.json'));
  const changelogExisted = !!(await readJSONSafe(resolve(OUT_DIR, 'changelog.json')));
  const today = new Date().toISOString().slice(0, 10);
  const { changed, entry } = buildChangelog(oldDb, database, oldPlayers, chessPlayers, today, changelogExisted);

  console.log('[3/4] 写入文件…');
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(resolve(OUT_DIR, 'database.json'), JSON.stringify(database, null, 2), 'utf8');
  await writeFile(resolve(OUT_DIR, 'lineups.json'), JSON.stringify(lineups, null, 2), 'utf8');
  await writeFile(resolve(OUT_DIR, 'chessPlayers.json'), JSON.stringify(chessPlayers, null, 2), 'utf8');
  await writeFile(resolve(OUT_DIR, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8');

  // 版本更新日志：仅在首次基线或确有改动时写入。
  if (entry) {
    const changelogPath = resolve(OUT_DIR, 'changelog.json');
    const existing = (await readJSONSafe(changelogPath)) || [];
    if (entry.baseline || existing.length === 0) {
      existing.unshift(entry);
    } else {
      // 同一天多次抓取：合并到当天最新条目
      if (existing[0] && existing[0].date === today) {
        const base = existing[0];
        base.changes = [...entry.changes, ...(base.changes || [])];
        const merged = { added: {}, removed: {}, changed: {} };
        for (const grp of [base.summary, entry.summary]) {
          for (const t of ['added', 'removed', 'changed']) {
            for (const [k, v] of Object.entries(grp?.[t] || {})) {
              merged[t][k] = (merged[t][k] || 0) + v;
            }
          }
        }
        base.summary = merged;
      } else {
        existing.unshift(entry);
      }
    }
    const trimmed = existing.slice(0, 60);
    await writeFile(changelogPath, JSON.stringify(trimmed, null, 2), 'utf8');
    console.log(
      changed
        ? `  版本日志已更新：${entry.title}（${entry.changes?.length ?? 0} 条改动）`
        : `  版本日志已建立基线`,
    );
  } else {
    console.log('  版本日志：无改动，保持不变');
  }

  console.log(`完成：database.json / lineups.json / chessPlayers.json / changelog.json 已生成于 ${OUT_DIR}`);
}

main().catch((e) => {
  console.error('构建失败：', e);
  process.exit(1);
});
