#!/usr/bin/env node
/**
 * 抓取《王者万象棋》官方版本更新公告，结构化后并入 public/data/changelog.json。
 *
 * 数据源（腾讯官方 CMS，已实测）：
 *   列表 https://apps.game.qq.com/cmc/cross?serviceId=389&...&chanid=7061   → var userobj={...};
 *   详情 https://apps.game.qq.com/wmp/v3.1/public/searchNews.php?p0=389&... → var searchObj={...};
 *
 * 设计原则：
 *   - 完全 best-effort：任何失败都只打印 [WARN] 并以退出码 0 结束，绝不覆盖 changelog.json。
 *   - 幂等：announcement-state.json 是公告唯一真相源，每次读 changelog → 剔除公告 → 重注入。
 *   - 冷启动防刷屏：只导入最近 N 天的「正式服版本更新公告」，最多 M 条。
 *   - 不存储公告全文，仅保留结构化要点 + 原文链接（摘要性使用）。
 */

import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'public/data');
const STATE_PATH = resolve(OUT_DIR, 'announcement-state.json');
const CHANGELOG_PATH = resolve(OUT_DIR, 'changelog.json');

const SERVICE_ID = '389';
const SOURCE = 'web_pc';
const SIGN_KEY = '9784d353d1f9ca34a59b61752630dade';
const CHANNEL_NOTICE = '7061';
const LIST_LIMIT = 20;
const BOOTSTRAP_LIMIT = 5;
const BOOTSTRAP_WINDOW_DAYS = 30;
const MAX_KEEP = 24;
const FETCH_TIMEOUT_MS = 15000;
const MAX_HIGHLIGHTS = 8;
const MAX_TEXT_LEN = 180;

const UA = 'Mozilla/5.0 (compatible; wzwxq-assistant-builder/1.0)';
const REFERER = 'https://wxq.qq.com/cp/appointment/newslist.html';

/* ------------------------------------------------------------------ */
/* 纯函数区（可离线测试）                                                */
/* ------------------------------------------------------------------ */

/** 生成腾讯 CMS 要求的签名 */
export function makeSign(ts, source = SOURCE, serviceId = SERVICE_ID) {
  return createHash('md5')
    .update(SIGN_KEY + source + serviceId + ts)
    .digest('hex');
}

/** 构造公告列表 URL */
export function buildListUrl(ts, opts = {}) {
  const { start = 0, limit = LIST_LIMIT, channel = CHANNEL_NOTICE } = opts;
  const sign = makeSign(ts);
  const q = new URLSearchParams({
    serviceId: SERVICE_ID,
    withtop: 'yes',
    logic: 'or',
    typeids: '1,2',
    sortby: 'sIdxTime',
    r1: 'userobj',
    start: String(start),
    limit: String(limit),
    source: SOURCE,
    filter: 'channel',
    exclusiveChannel: '40',
    exclusiveChannelSign: sign,
    time: ts,
    chanid: channel,
  });
  return `https://apps.game.qq.com/cmc/cross?${q.toString()}`;
}

/** 构造公告详情 URL */
export function buildDetailUrl(newsId) {
  return `https://apps.game.qq.com/wmp/v3.1/public/searchNews.php?p0=${SERVICE_ID}&source=${SOURCE}&id=${newsId}`;
}

/** 官网原文链接 */
export function buildSourceUrl(newsId) {
  return `https://wxq.qq.com/cp/appointment/newsdetail.html?newsid=${newsId}&tab=3`;
}

/** 解析 `var userobj={...};` / `var searchObj={...};` 这类 JSONP 响应 */
export function parseJsonp(raw) {
  if (raw == null) throw new Error('empty response');
  const text = String(raw).trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('not a JSONP object');
  return JSON.parse(text.slice(start, end + 1));
}

/** 是否为「正式服版本更新公告」（排除体验服、新闻、活动） */
export function isVersionAnnouncement(title) {
  const t = String(title || '');
  if (!/版本更新公告|更新公告|版本更新/.test(t)) return false;
  if (/体验服|招募|爆料|抢先看|情报/.test(t)) return false;
  return true;
}

/** HTML → 纯文本行 */
export function htmlToLines(html) {
  const entities = {
    '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>',
    '&quot;': '"', '&#39;': "'", '&ldquo;': '“', '&rdquo;': '”',
  };
  let s = String(html || '');
  // 标题标签单独成行并加标记，供 sectionOf 识别（官方公告用 h1/h2 划分大段/小段）
  s = s.replace(/<h[1-6][^>]*>/gi, '\n@@H@@').replace(/<\/h[1-6]>/gi, '\n');
  s = s.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<\/div>/gi, '\n');
  s = s.replace(/<[^>]*>/g, '');
  for (const [k, v] of Object.entries(entities)) s = s.split(k).join(v);
  s = s.replace(/&[a-zA-Z#0-9]+;/g, ' ');
  return s.split(/\n+/).map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

const SKIP_LINE = /亲爱的玩家|我们计划于|感谢大家|请以游戏为准|更新完成时间|不停机更新|【更新时间】|【更新范围】|【更新方式】|更新时间[:：]|更新范围[:：]|更新方式[:：]|^\s*全服\s*$|^\s*\*|^@@H@@[一二三四五六七八九十]+、/;

/** 由文本推断要点分类标签（section 名优先于正文，避免正文里的名词串味） */
export function detectTag(text, section = '') {
  const s = String(section || '');
  if (/修复|BUG|问题/.test(s)) return '修复';
  if (/活动|祈愿|棋盘|皮肤|福利|任务|周末/.test(s)) return '活动';
  if (/天赋|商店|投放/.test(s)) return '天赋';
  if (/棋手|阵容|并购/.test(s)) return '棋手';
  if (/英雄|棋子|卡牌/.test(s)) return '英雄';
  if (/装备|效果牌/.test(s)) return '装备';
  if (/优化|体验|调整|社交|定制|系统|追求/.test(s)) return '优化';
  if (/修复|异常|BUG|bug|问题/.test(text)) return '修复';
  if (/活动|上线|开启|祈愿|棋盘|皮肤|福利|任务|周末/.test(text)) return '活动';
  if (/棋手|并购红利|嬴律|赢律/.test(text)) return '棋手';
  if (/天赋|商店|投放|级天赋/.test(text)) return '天赋';
  if (/英雄|棋子|卡牌/.test(text)) return '英雄';
  if (/装备|效果牌/.test(text)) return '装备';
  if (/优化|体验|调整|提示|跳过|邀请/.test(text)) return '优化';
  return '其他';
}

/** 从行里识别分段标题（h1/h2 标记行、【…】、短标题行） */
function sectionOf(line) {
  if (line.startsWith('@@H@@')) {
    const t = line.slice(5).trim();
    // 大段落标题（一、xxx / 二、xxx）作为分组名，小标题也作为分组名
    return t.replace(/^[一二三四五六七八九十]+、\s*/, '') || null;
  }
  const m = line.match(/^【(.+?)】/);
  if (m) return m[1].trim();
  if (line.length <= 18 && /(调整|改动|优化|修复|更新|上线|开启|说明)$/.test(line)) {
    return line;
  }
  return null;
}

/**
 * 从公告 HTML 正文提取结构化要点（规则式，零依赖）。
 * 按 h1/h2 小标题切段，每段合并为一条要点；不足时按【…】/短标题兜底。
 * 返回 [{ section, tag, text, order }]
 */
export function extractHighlights(html) {
  const lines = htmlToLines(html);
  const groups = [];
  let current = '更新内容';
  for (const line of lines) {
    if (SKIP_LINE.test(line)) continue;
    const sec = sectionOf(line);
    if (sec && line.startsWith('@@H@@')) {
      current = sec;
      continue;
    }
    if (sec) {
      current = sec;
      const rest = line.replace(/^【.+?】/, '').trim();
      if (rest) pushGroup(groups, current, rest);
      continue;
    }
    if (line.length < 6) continue;
    pushGroup(groups, current, line);
  }
  return groups
    .map((g, i) => ({
      section: g.section,
      tag: detectTag(g.text, g.section),
      text: g.text.length > MAX_TEXT_LEN ? g.text.slice(0, MAX_TEXT_LEN) + '…' : g.text,
      order: i,
    }))
    .slice(0, MAX_HIGHLIGHTS);
}

function pushGroup(groups, section, text) {
  const last = groups[groups.length - 1];
  if (last && last.section === section) {
    if (last.text.length < MAX_TEXT_LEN) last.text += ' ' + text;
  } else {
    groups.push({ section, text });
  }
}

/** 由公告详情构造 changelog 条目 */
export function toEntry(item, detail, opts = {}) {
  const msg = detail?.msg || {};
  const newsId = String(item.iNewsId ?? item.iId ?? item.id ?? '');
  if (!newsId) throw new Error('missing news id');
  const idxTime = String(item.sIdxTime || msg.sIdxTime || item.sCreated || '');
  const date = idxTime.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('invalid sIdxTime');
  const version = String(msg.sGameVersion || '').trim() || date;
  const digest = String(item.sDesc || msg.sDesc || '').trim();
  const highlights = extractHighlights(msg.sContent || '');
  return {
    kind: 'announcement',
    version,
    date,
    title: String(item.sTitle || msg.sTitle || '').trim(),
    newsId,
    digest,
    highlights,
    summary: {},
    changes: [],
    sourceUrl: buildSourceUrl(newsId),
    source: '腾讯《王者万象棋》官方公告',
    publishedAt: idxTime,
    createdAt: String(item.sCreated || msg.sCreated || '').trim() || undefined,
    fetchedAt: opts.fetchedAt || new Date().toISOString(),
    isBackfill: Boolean(opts.isBackfill),
    parseWarning: highlights.length === 0 || undefined,
  };
}

/** 条目指纹（用于识别官方编辑） */
export function fingerprint(e) {
  return `${e.title}|${e.publishedAt}|${e.createdAt || ''}`;
}

/**
 * 幂等合并：剔除 changelog 中所有公告条目，再从 state 重注入，按日期倒序。
 * 注意：不修改任何 diff 条目（保证 build-db.mjs 生成的记录不丢失）。
 */
export function mergeChangelog(changelog, announcementEntries) {
  const base = (Array.isArray(changelog) ? changelog : []).filter(
    (e) => !e || e.kind !== 'announcement',
  );
  const all = [...base, ...announcementEntries];
  return all.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

/** 冷启动水位线：最近 N 天 */
export function bootstrapSince(now = new Date(), days = BOOTSTRAP_WINDOW_DAYS) {
  const d = new Date(now.getTime() - days * 86400000);
  return d.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* IO / 网络                                                            */
/* ------------------------------------------------------------------ */

async function readJSONSafe(p) {
  try {
    return JSON.parse(await readFile(p, 'utf8'));
  } catch {
    return null;
  }
}

async function fetchText(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { 'User-Agent': UA, Referer: REFERER },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function emptyState() {
  return {
    bootstrapDone: false,
    bootstrapSince: null,
    bootstrapLimit: BOOTSTRAP_LIMIT,
    seenIds: [],
    fingerprints: {},
    entries: [],
    lastFetchedAt: null,
    lastSuccessAt: null,
    parseWarnings: [],
  };
}

/* ------------------------------------------------------------------ */
/* 主流程                                                              */
/* ------------------------------------------------------------------ */

export async function main() {
  const ts = String(Math.floor(Date.now() / 1000));
  const now = new Date();
  const state = (await readJSONSafe(STATE_PATH)) || emptyState();

  // 1) 抓取公告列表
  const listRaw = await fetchText(buildListUrl(ts));
  const listObj = parseJsonp(listRaw);
  if (String(listObj.status) !== '0') throw new Error(`list status=${listObj.status}`);
  const items = listObj?.data?.items;
  if (!Array.isArray(items) || items.length === 0) throw new Error('list items empty');

  const candidates = items.filter((it) => isVersionAnnouncement(it.sTitle));

  // 2) 筛选需要抓取详情的条目
  // seenIds 记录「本次列表里见过的全部版本公告」，包括冷启动因上限被截断、
  // 没有导入的那部分——否则下一次运行会把它们当成新公告一次性补进来（刷屏）。
  const seen = new Set(state.seenIds || []);
  const since = state.bootstrapSince || bootstrapSince(now);
  const toFetch = [];
  const seenThisRun = new Set();
  for (const it of candidates) {
    const id = String(it.iNewsId ?? it.iId ?? it.id ?? '');
    if (!id) continue;
    const date = String(it.sIdxTime || '').slice(0, 10);
    if (date < since) continue; // 水位线以下的历史公告永远不导入
    seenThisRun.add(id);
    if (!state.bootstrapDone) {
      if (toFetch.length >= BOOTSTRAP_LIMIT) continue; // 记已见，但不抓
      toFetch.push({ it, id, isBackfill: true });
    } else if (!seen.has(id)) {
      toFetch.push({ it, id, isBackfill: false });
    }
  }
  const allSeen = new Set([...seen, ...seenThisRun]);

  // 3) 抓详情 + 生成/更新条目
  const byId = new Map((state.entries || []).map((e) => [String(e.newsId), e]));
  const warnings = [];
  for (const { it, id, isBackfill } of toFetch) {
    try {
      const detail = parseJsonp(await fetchText(buildDetailUrl(id)));
      if (String(detail.status) !== '0' || !detail.msg) throw new Error(`detail status=${detail.status}`);
      const entry = toEntry(it, detail, { fetchedAt: now.toISOString(), isBackfill });
      byId.set(id, entry);
    } catch (err) {
      warnings.push(`${id}: ${err.message}`);
      console.warn(`  [WARN] 公告详情失败 ${id}: ${err.message}`);
    }
  }

  // 官方编辑过的公告（sCreated / sIdxTime 变化）也更新要点，但不重复计数
  if (state.bootstrapDone) {
    for (const it of candidates) {
      const id = String(it.iNewsId ?? it.iId ?? it.id ?? '');
      if (String(it.sIdxTime || '').slice(0, 10) < since) continue;
      const old = byId.get(id);
      if (!old) continue;
      const fp = `${it.sTitle}|${it.sIdxTime}|${it.sCreated || ''}`;
      if (state.fingerprints?.[id] && state.fingerprints[id] !== fp) {
        try {
          const detail = parseJsonp(await fetchText(buildDetailUrl(id)));
          const fresh = toEntry(it, detail, { fetchedAt: now.toISOString(), isBackfill: false });
          byId.set(id, fresh);
        } catch { /* 保留旧条目 */ }
      }
    }
  }

  const entries = [...byId.values()]
    .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))
    .slice(0, MAX_KEEP);

  if (entries.length === 0) throw new Error('no announcement entries produced');

  // 4) 幂等合并到 changelog（成功才写，失败完全不碰）
  const existing = await readJSONSafe(CHANGELOG_PATH);
  if (!Array.isArray(existing)) throw new Error('changelog.json 不是数组，跳过写入');
  const merged = mergeChangelog(existing, entries);

  const nextState = {
    ...state,
    bootstrapDone: true,
    bootstrapSince: state.bootstrapSince || since,
    bootstrapLimit: BOOTSTRAP_LIMIT,
    // 含「见过但未导入」的 ID，防止下一次补抓造成刷屏
    seenIds: [...allSeen],
    fingerprints: Object.fromEntries(
      entries.map((e) => [String(e.newsId), fingerprint(e)]),
    ),
    entries,
    lastFetchedAt: now.toISOString(),
    lastSuccessAt: now.toISOString(),
    parseWarnings: warnings,
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(STATE_PATH, JSON.stringify(nextState, null, 2) + '\n', 'utf8');
  await writeFile(CHANGELOG_PATH, JSON.stringify(merged, null, 2) + '\n', 'utf8');

  console.log(`  官方公告：新增/更新 ${toFetch.length} 条，当前共 ${entries.length} 条公告`);
  console.log(`  最早水位线：${nextState.bootstrapSince}｜冷启动：${state.bootstrapDone ? '已完成' : '首次执行'}`);
  const latest = entries[0];
  console.log(`  最新公告：${latest.date} ${latest.title}（${latest.highlights.length} 条要点）`);
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  try {
    await main();
    console.log('  公告链路完成');
  } catch (err) {
    // best-effort：失败不影响主数据库刷新与构建
    console.warn(`  [WARN] 公告抓取跳过：${err?.message || err}`);
    console.warn('  [WARN] changelog.json 保持原样（由 build-db.mjs 生成的结果不受影响）');
    process.exitCode = 0;
  }
}
