import type { ChessPlayer, Lineup } from '../types';

/** 单条推荐理由（用于 UI 展示） */
export type RecommendReason = string;

/** 带评分与理由的阵容推荐结果 */
export type ScoredLineup = {
  lineup: Lineup;
  /** 综合评分（越高越推荐） */
  score: number;
  /** 透明、可解释的推荐理由 */
  reasons: RecommendReason[];
};

/** 各强度评级的基础分 */
const TIER_BASE: Record<Lineup['tier'], number> = {
  T0: 100,
  T1: 80,
  T2: 60,
};

/**
 * 基于 id 的确定性伪随机微扰（0 ~ 5）。
 * 使用稳定的字符串哈希，保证每次运行排序结果一致（不随时间抖动）。
 */
function stableJitter(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) % 100000;
  }
  return (h % 500) / 100; // 0.00 ~ 4.99
}

/**
 * 对单个阵容打分并生成理由（纯函数）。
 *
 * 评分规则（透明可解释）：
 *  - 基础分：T0=100 / T1=80 / T2=60
 *  - 数据驱动匹配：该阵容官方推荐的棋手包含玩家所选棋手 → +30（最强信号）
 *  - 棋手类型匹配：fitType === 玩家棋手类型  → +25
 *  - 克制加成：若「被禁用的阵容」恰好被本阵容克制 → +15（命中即加，不论命中几条）
 *  - 稳定微扰：基于 id 的伪随机小数（0~5），使排序稳定且每次一致
 *
 * @param lineup    待评分阵容
 * @param bannedIds 用户禁用的阵容 id 集合
 * @param player    用户选择的棋手（未选传 null）
 */
export function scoreLineup(
  lineup: Lineup,
  bannedIds: Set<string>,
  player: ChessPlayer | null,
  nameById: Map<string, string> = new Map(),
): { score: number; reasons: RecommendReason[] } {
  let score = TIER_BASE[lineup.tier];
  const reasons: RecommendReason[] = [`强度评级 ${lineup.tier}`];

  // 数据驱动匹配：阵容官方推荐棋手命中玩家所选棋手（最强信号）
  const recommended = lineup.recommendedLords ?? [];
  if (player && recommended.includes(player.name)) {
    score += 30;
    reasons.push(`官方推荐搭配「${player.name}」`);
  } else if (player && lineup.fitType === player.type) {
    // 退而求其次：棋手类型匹配
    score += 25;
    reasons.push(`契合你的${player.type}棋手`);
  }

  // 克制加成：本阵容 counter 的阵容中，若有被用户禁用者，则加分
  const counters = lineup.counters ?? [];
  const counteredBanned = counters.filter((cid) => bannedIds.has(cid));
  if (counteredBanned.length > 0) {
    score += 15;
    const names = counteredBanned
      .map((cid) => nameById.get(cid) ?? cid)
      .join('、');
    reasons.push(`克制你禁用的「${names}」`);
  }

  // 稳定微扰（保持确定性，不影响可解释性）
  score += stableJitter(lineup.id);

  return { score, reasons };
}

/**
 * 推荐主函数（纯函数）。
 * 1. 过滤掉被禁用的阵容；
 * 2. 对剩余阵容打分并生成理由；
 * 3. 按分数降序排序。
 *
 * @returns 排序后的推荐列表（已排除禁用阵容，并附带推荐理由）
 */
export function recommendLineups(
  lineups: Lineup[],
  bannedIds: string[],
  player: ChessPlayer | null,
): ScoredLineup[] {
  const bannedSet = new Set(bannedIds);
  const nameById = new Map(lineups.map((l) => [l.id, l.name]));

  return lineups
    .filter((l) => !bannedSet.has(l.id))
    .map((l) => {
      const { score, reasons } = scoreLineup(l, bannedSet, player, nameById);
      return { lineup: l, score, reasons };
    })
    .sort((a, b) => b.score - a.score);
}
