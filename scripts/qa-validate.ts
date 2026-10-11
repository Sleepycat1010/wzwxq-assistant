/**
 * QA 校验脚本：数据完整性 + fallback 兜底一致性。
 * 校验 public/data/*.json 结构，并比对 src/data/fallback.ts 是否与 JSON 内容一致。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { FALLBACK_LINEUPS, FALLBACK_PLAYERS } from '../src/data/fallback';
import type { ChessPlayer, Lineup } from '../src/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const lineupsJson = JSON.parse(
  readFileSync(join(root, 'public/data/lineups.json'), 'utf-8'),
) as Lineup[];
const playersJson = JSON.parse(
  readFileSync(join(root, 'public/data/chessPlayers.json'), 'utf-8'),
) as ChessPlayer[];

let failures = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) console.log(`  ✅ PASS: ${msg}`);
  else {
    failures += 1;
    console.error(`  ❌ FAIL: ${msg}`);
  }
}

function norm(v: unknown): string {
  return JSON.stringify(
    v,
    (_k, val) => (val && typeof val === 'object' && !Array.isArray(val)
      ? Object.keys(val).sort().reduce((o: Record<string, unknown>, k) => {
          o[k] = (val as Record<string, unknown>)[k];
          return o;
        }, {})
      : val),
  );
}

// ---- lineups.json 结构 ----
console.log('\n========== lineups.json 结构校验 ==========');
assert(Array.isArray(lineupsJson) && lineupsJson.length === 5, `共 5 套阵容（实际 ${lineupsJson.length}）`);
const requiredLineupKeys = [
  'id', 'name', 'tier', 'fitType', 'coreHeroes', 'tagline', 'strategy',
  'positioning', 'equipment', 'operations', 'sources',
];
for (const l of lineupsJson) {
  const missing = requiredLineupKeys.filter((k) => !(k in l));
  assert(
    missing.length === 0,
    `阵容 ${l.id ?? '?'} 字段齐全（缺失：${missing.join(',') || '无'}）`,
  );
  assert(
    Array.isArray(l.sources) && l.sources.length >= 1,
    `阵容 ${l.id} 的 sources 数组长度 ≥ 1（实际 ${l.sources?.length}）`,
  );
  for (const s of l.sources ?? []) {
    assert(
      typeof s.url === 'string' && s.url.length > 0,
      `阵容 ${l.id} 的 source 含 url 字段（平台=${s.platform}）`,
    );
  }
  assert(
    l.operations && ['early', 'mid', 'late'].every((k) => typeof (l.operations as Record<string, unknown>)[k] === 'string'),
    `阵容 ${l.id} 的 operations 含 early/mid/late 文本`,
  );
}

// ---- chessPlayers.json 结构 ----
console.log('\n========== chessPlayers.json 结构校验 ==========');
assert(Array.isArray(playersJson) && playersJson.length === 5, `共 5 个棋手（实际 ${playersJson.length}）`);
const first3 = playersJson.slice(0, 3);
const last2 = playersJson.slice(3);
assert(
  first3.every((p) => p.source && typeof p.source.url === 'string' && p.source.url.length > 0),
  '前 3 个棋手均有 source（含 url）',
);
assert(
  last2.length === 2 && last2.every((p) => p.placeholder === true),
  '后 2 个棋手 placeholder === true',
);

// ---- fallback.ts 与 JSON 一致性 ----
console.log('\n========== fallback.ts 与 JSON 一致性 ==========');
assert(
  norm(FALLBACK_LINEUPS) === norm(lineupsJson),
  'FALLBACK_LINEUPS 与 lineups.json 内容一致',
);
assert(
  norm(FALLBACK_PLAYERS) === norm(playersJson),
  'FALLBACK_PLAYERS 与 chessPlayers.json 内容一致',
);

console.log('\n========== 汇总 ==========');
if (failures === 0) {
  console.log('🎉 数据校验全部通过 (0 失败)');
  process.exit(0);
} else {
  console.error(`💥 存在 ${failures} 条校验失败`);
  process.exit(1);
}
