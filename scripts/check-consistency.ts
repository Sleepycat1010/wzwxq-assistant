import { FALLBACK_LINEUPS, FALLBACK_PLAYERS } from '../src/data/fallback';
import lineups from '../public/data/lineups.json';
import players from '../public/data/chessPlayers.json';

const norm = (o: unknown) =>
  JSON.stringify(o, Object.keys({}).length ? null : null) &&
  JSON.stringify(
    o,
    Object.keys(o as object).sort()
  );

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error('❌ FAIL:', msg);
    process.exit(1);
  }
}

// 长度一致
assert(FALLBACK_LINEUPS.length === lineups.length, `lineups 数量 ${FALLBACK_LINEUPS.length} vs ${lineups.length}`);
assert(FALLBACK_PLAYERS.length === players.length, `players 数量 ${FALLBACK_PLAYERS.length} vs ${players.length}`);

// id 集合一致
const lidF = FALLBACK_LINEUPS.map((l) => l.id).sort().join(',');
const lidJ = (lineups as any[]).map((l) => l.id).sort().join(',');
assert(lidF === lidJ, `lineup ids 不一致:\nF:${lidF}\nJ:${lidJ}`);

const pidF = FALLBACK_PLAYERS.map((p) => p.id).sort().join(',');
const pidJ = (players as any[]).map((p) => p.id).sort().join(',');
assert(pidF === pidJ, `player ids 不一致:\nF:${pidF}\nJ:${pidJ}`);

// 深比较（按 key 排序后字符串化，避免顺序差异）
const deep = (a: unknown, b: unknown) =>
  JSON.stringify(a, Object.keys(a as object).sort()) ===
  JSON.stringify(b, Object.keys(b as object).sort());

for (let i = 0; i < lineups.length; i++) {
  const f = FALLBACK_LINEUPS.find((x) => x.id === (lineups as any[])[i].id)!;
  assert(deep(f, (lineups as any[])[i]), `lineup 内容不一致: ${(lineups as any[])[i].id}`);
}
for (let i = 0; i < players.length; i++) {
  const f = FALLBACK_PLAYERS.find((x) => x.id === (players as any[])[i].id)!;
  assert(deep(f, (players as any[])[i]), `player 内容不一致: ${(players as any[])[i].id}`);
}

console.log(`✅ 一致性校验通过：lineups=${lineups.length}, players=${players.length}`);
// 顺便统计来源平台分布
const platforms = new Set<string>();
(FALLBACK_LINEUPS as any[]).forEach((l) => l.sources.forEach((s: any) => platforms.add(s.platform)));
console.log('来源平台:', [...platforms].join(' / '));
