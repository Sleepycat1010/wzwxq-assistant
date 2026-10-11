/**
 * QA 验证脚本：真实执行推荐算法（src/lib/recommend.ts）。
 * 通过 esbuild 打包为 ESM 后用 node 运行，避免 JSON 模块 / 类型解析问题。
 *
 * 用例 A：棋手=战斗增益型，禁用=[dunaixuhang]
 *   期望：dunaixuhang 被排除；fuxuomulan 第一；
 *         qianpaitank(T2+匹配=85) 高于 citiaoliandong/jingjisu7(T1 无匹配=80)。
 * 用例 B：棋手=经济运营型，禁用=[]
 *   期望：3 个经济运营型 T1(=105) 排在 fuxuomulan(T0=100) 之前；qianpaitank(=60) 排最后。
 * 同时：每条结果 reasons 非空，文案含「强度评级」「契合你的X棋手」「克制你禁用的…」。
 */
import { recommendLineups, type ScoredLineup } from '../src/lib/recommend';
import type { ChessPlayer, Lineup, GameData } from '../src/types';
import lineupsJson from '../public/data/lineups.json';
import playersJson from '../public/data/chessPlayers.json';

const data = {
  lineups: lineupsJson as Lineup[],
  chessPlayers: playersJson as ChessPlayer[],
} satisfies GameData;

let failures = 0;
function assert(cond: boolean, msg: string): void {
  if (cond) {
    console.log(`  ✅ PASS: ${msg}`);
  } else {
    failures += 1;
    console.error(`  ❌ FAIL: ${msg}`);
  }
}

function report(title: string, scored: ScoredLineup[]): string {
  const rows = scored
    .map((s, i) => `    ${i + 1}. ${s.lineup.id} (${s.lineup.tier}/${s.lineup.fitType}) score=${s.score.toFixed(2)}`)
    .join('\n');
  console.log(`${title}\n${rows}`);
  return scored.map((s) => s.lineup.id).join(' > ');
}

// ---------------------------------------------------------------------------
console.log('\n========== 用例 A：战斗增益型 + 禁用 dunaixuhang ==========');
const playerA = data.chessPlayers.find((p) => p.type === '战斗增益型')!;
console.log(`  使用棋手: ${playerA.name} (${playerA.type})`);
const resA = recommendLineups(data.lineups, ['dunaixuhang'], playerA);
report('  A 排序:', resA);
const idsA = resA.map((r) => r.lineup.id);

assert(!idsA.includes('dunaixuhang'), 'A: 被禁用阵容 dunaixuhang 已从推荐中排除');
assert(idsA[0] === 'fuxuomulan', `A: 排第一为 fuxuomulan（实际：${idsA[0]}）`);
const rankQ = idsA.indexOf('qianpaitank');
const rankC = idsA.indexOf('citiaoliandong');
const rankJ = idsA.indexOf('jingjisu7');
assert(
  rankQ >= 0 && rankC >= 0 && rankJ >= 0 && rankQ < rankC && rankQ < rankJ,
  `A: qianpaitank(排名${rankQ + 1}) 高于 citiaoliandong(排名${rankC + 1}) 与 jingjisu7(排名${rankJ + 1})`,
);
const fx = resA.find((r) => r.lineup.id === 'fuxuomulan')!;
assert(fx.reasons.length > 0, 'A: fuxuomulan 的 reasons 非空');
assert(fx.reasons.some((r) => r.includes('强度评级')), `A: reasons 含「强度评级」（实际：${fx.reasons.join(' | ')}）`);
assert(fx.reasons.some((r) => r.includes('契合你的')), `A: reasons 含「契合你的X棋手」（实际：${fx.reasons.join(' | ')}）`);
assert(fx.reasons.some((r) => r.includes('克制你禁用的')), `A: reasons 含「克制你禁用的…」（实际：${fx.reasons.join(' | ')}）`);
assert(resA.every((r) => r.reasons.length > 0), 'A: 全部结果的 reasons 均非空');

// ---------------------------------------------------------------------------
console.log('\n========== 用例 B：经济运营型 + 无禁用 ==========');
const playerB = data.chessPlayers.find((p) => p.type === '经济运营型')!;
console.log(`  使用棋手: ${playerB.name} (${playerB.type})`);
const resB = recommendLineups(data.lineups, [], playerB);
report('  B 排序:', resB);
const idsB = resB.map((r) => r.lineup.id);

const fxRankB = idsB.indexOf('fuxuomulan');
for (const id of ['dunaixuhang', 'citiaoliandong', 'jingjisu7']) {
  const rank = idsB.indexOf(id);
  assert(
    rank >= 0 && rank < fxRankB,
    `B: 经济运营型 T1 ${id}(排名${rank + 1}) 排在 fuxuomulan(排名${fxRankB + 1}) 之前`,
  );
}
assert(
  idsB[idsB.length - 1] === 'qianpaitank',
  `B: qianpaitank 排最后（实际末位：${idsB[idsB.length - 1]}）`,
);
assert(resB.every((r) => r.reasons.length > 0), 'B: 全部结果的 reasons 均非空');

// ---------------------------------------------------------------------------
console.log('\n========== 汇总 ==========');
if (failures === 0) {
  console.log('🎉 全部断言通过 (0 失败)');
  process.exit(0);
} else {
  console.error(`💥 存在 ${failures} 条断言失败`);
  process.exit(1);
}
