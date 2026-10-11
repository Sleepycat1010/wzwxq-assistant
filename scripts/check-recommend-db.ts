import { recommendLineups } from '../src/lib/recommend';
import type { ChessPlayer, Lineup } from '../src/types';
import { readFileSync } from 'node:fs';

const lineups = JSON.parse(
  readFileSync(process.cwd() + '/public/data/lineups.json', 'utf8'),
) as Lineup[];

// 找一个真实存在的棋手名用于匹配
const player: ChessPlayer = {
  id: 'x',
  name: '香香',
  type: '战斗增益型',
  skill: '',
  desc: '',
};

// 禁用「大河流域」全部阵容
const dahe = lineups.filter((l) => l.faction === '大河流域').map((l) => l.id);
const scored = recommendLineups(lineups, dahe, player);

const leaked = scored.filter((s) => dahe.includes(s.lineup.id));
console.log('大河流域阵容总数:', dahe.length);
console.log('推荐中泄露的大河流域:', leaked.length, '(应为 0)');

const top = scored.slice(0, 5).map((s) => ({
  name: s.lineup.name,
  faction: s.lineup.faction,
  score: Math.round(s.score),
  reasons: s.reasons,
  recLords: s.lineup.recommendedLords,
}));
console.log('Top5:', JSON.stringify(top, null, 2));

// 断言：前 5 中应有官方推荐棋手含「香香」的阵容获得 +30 加成
const matched = scored.find((s) => (s.lineup.recommendedLords ?? []).includes('香香'));
console.log('含香香推荐的阵容最高分:', matched ? Math.round(matched.score) : '无');
console.log('reasons 样例:', matched?.reasons);
console.log('总推荐数:', scored.length);
