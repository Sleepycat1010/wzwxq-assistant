/**
 * 数据模型类型定义。
 * 这些类型同时用于运行时 fetch 的 JSON 与 src/data/fallback.ts 的内联兜底数据，
 * 保证两端数据结构一致。
 */

/** 出处 / 来源 */
export type Source = {
  /** 平台名称，例如 "王者营地" | "玩一玩" | "王者攻略库(ima)" | "Bilibili" */
  platform: string;
  /** 作者 / UP 主（可选） */
  author?: string;
  /** 来源链接（必填，可点击跳转） */
  url: string;
  /** 发布日期，例如 "2026-09-10"（可选） */
  date?: string;
  /** 该出处对应的具体内容说明（可选） */
  note?: string;
};

/** 强度评级 */
export type Tier = 'T0' | 'T1' | 'T2';

/** 棋手 / 阵容适配类型 */
export type FitType = '经济运营型' | '战斗增益型';

/** 阵容 */
export type Lineup = {
  id: string;
  name: string;
  tier: Tier;
  /** 适配棋手类型 */
  fitType: FitType;
  /** 核心英雄 */
  coreHeroes: string[];
  /** 后期补强英雄（可选） */
  lateHeroes?: string[];
  /** 一句话卖点 */
  tagline: string;
  /** 整体思路 */
  strategy: string;
  /** 站位思路 */
  positioning: string;
  /** 出装思路 */
  equipment: string;
  /** 每阶段运营思路 */
  operations: { early: string; mid: string; late: string };
  /** 克制的阵容 id（用于推荐加权，启发式） */
  counters?: string[];
  /** 多来源出处（必填，至少 1 条） */
  sources: Source[];
};

/** 棋手 */
export type ChessPlayer = {
  id: string;
  name: string;
  type: FitType;
  /** 专属技能描述 */
  skill: string;
  /** 天赋（可选） */
  talent?: string;
  desc: string;
  /** 棋手出处（有则填，无则 null） */
  source?: Source | null;
  /** 示例占位（待官方数据替换）标记 */
  placeholder?: boolean;
};

/** 一次完整的数据加载结果 */
export type GameData = {
  lineups: Lineup[];
  chessPlayers: ChessPlayer[];
};
