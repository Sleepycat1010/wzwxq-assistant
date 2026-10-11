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
export type FitType = '经济运营型' | '战斗增益型' | '通用';

/** 阵容内英雄的站位 */
export type HeroPosition = {
  name: string;
  /** 棋盘列坐标（0 起） */
  x: number | null;
  /** 棋盘行坐标（0 起；z 越小越靠前排） */
  z: number | null;
  level?: number | null;
  /** 该英雄的推荐装备（官方 per-hero equipList 反推） */
  equip?: string[];
};

/** 阵容 */
export type Lineup = {
  id: string;
  name: string;
  tier: Tier;
  /** 适配棋手类型（通用表示未明确归类） */
  fitType: FitType;
  /** 阵营 / 羁绊（大河流域 / 三分之地 / 逐鹿 / 日落海 / 河洛 / 无阵营） */
  faction?: string;
  /** 核心英雄（含全部上阵英雄） */
  coreHeroes: string[];
  /** 后期补强英雄（可选） */
  lateHeroes?: string[];
  /** 一句话卖点 */
  tagline: string;
  /** 整体思路 */
  strategy: string;
  /** 站位思路（文字描述，可选；更精确见 heroPositions） */
  positioning: string;
  /** 出装思路 */
  equipment: string;
  /** 每阶段运营思路 */
  operations: { early: string; mid: string; late: string };
  /** 英雄站位坐标（官方数据，可选） */
  heroPositions?: HeroPosition[];
  /** 官方推荐棋手（数据驱动匹配用） */
  recommendedLords?: string[];
  /** 使用次数（官方热度） */
  useNum?: number;
  /** 官方评分（可选） */
  score?: number | null;
  /** 作者（可选） */
  author?: string;
  /** 克制的阵容 id（用于推荐加权，启发式） */
  counters?: string[];
  /** 多来源出处（必填，至少 1 条） */
  sources: Source[];
};

/** 棋手技能组中的单张关联卡 */
export type LordTalentCard = {
  name: string;
  thumb: string;
  desc: string;
};

/** 棋手技能（官方 talent 归一化） */
export type LordTalent = {
  name: string;
  level: number;
  icon: string;
  /** 技能描述（关联卡 desc 合并清洗） */
  desc: string;
  /** 该技能关联的卡（效果/天赋等） */
  cards: LordTalentCard[];
};

/** 棋手 */
export type ChessPlayer = {
  id: string;
  name: string;
  type: FitType;
  /** 专属技能描述（取自官方 talent[0]） */
  skill: string;
  /** 天赋（技能组首名，可选） */
  talent?: string;
  desc: string;
  /** 棋手出处（有则填，无则 null） */
  source?: Source | null;
  /** 官方头像 / 海报图标（CDN） */
  icon?: string;
  /** 棋手头像（touxiang，可选） */
  avatar?: string;
  /** 棋手半身像（可选） */
  portrait?: string;
  /** 官方棋手 id */
  lordId?: number;
  /** 技能组（含图标与关联卡，用于详解） */
  talents?: LordTalent[];
  /** 关联卡（效果/天赋等，可选） */
  relatedCards?: { name: string; thumb: string }[];
  /** 示例占位（待官方数据替换）标记 */
  placeholder?: boolean;
};

/* ============ 基础数据库（图鉴）类型 ============ */

/** 卡牌基础字段（英雄 / 天赋 / 装备 / 效果牌 通用） */
export type CardBase = {
  id: number | string;
  name: string;
  /** 卡牌大类（官方 type 字段，含义随类别不同） */
  type?: number;
  /** 品质（1/2/3 品等） */
  quality?: number;
  image: string;
  thumb: string;
  /** 清洗后的纯文本描述 */
  desc: string;
  /** 羁绊 / 阵营（英雄专属） */
  relationName?: string | null;
  relationId?: number | null;
};

export type Hero = CardBase & {
  faction: string;
  /** 购买费用（shopBuyCost.Count） */
  cost?: number | null;
  /** 效果类型描述（部分英雄为空） */
  effectTypeDesc?: string;
  /** 觉醒/进化形态（部分英雄无） */
  evolution?: { name: string; image: string; desc: string } | null;
  /** 关联卡名称（效果/装备/天赋，可选） */
  relatedCards?: string[];
};

export type Faction = {
  name: string;
  heroCount: number;
  heroes: string[];
};

export type DatabaseMeta = {
  fetchedAt: string;
  source: string;
  sourceUrls: Record<string, string>;
  counts: {
    heroes: number;
    talents: number;
    equipments: number;
    effectCards: number;
    factions: number;
    lineups: number;
  };
  note?: string;
};

/** 基础数据库：英雄 / 天赋 / 装备 / 效果牌 / 阵营 */
export type Database = {
  meta: DatabaseMeta;
  factions: Faction[];
  heroes: Hero[];
  talents: CardBase[];
  equipments: CardBase[];
  effectCards: CardBase[];
};

/* ============ 版本更新日志 ============ */

export type ChangelogCat =
  | 'heroes'
  | 'lords'
  | 'equipments'
  | 'effectCards'
  | 'talents';

export type ChangelogChange = {
  cat: ChangelogCat;
  type: 'added' | 'removed' | 'changed';
  name: string;
  id: string | number;
};

export type ChangelogEntry = {
  /** 版本标签（通常为日期 YYYY-MM-DD） */
  version: string;
  /** 日期 YYYY-MM-DD */
  date: string;
  /** 标题，如「官方数据更新」「数据库初始化」 */
  title: string;
  /** 是否为首次基线 */
  baseline?: boolean;
  /** 改动汇总：基线为 counts，更新为 added/removed/changed */
  summary?: {
    added?: Partial<Record<ChangelogCat, number>>;
    removed?: Partial<Record<ChangelogCat, number>>;
    changed?: Partial<Record<ChangelogCat, number>>;
    counts?: Partial<Record<ChangelogCat, number>>;
  };
  /** 逐条改动（基线为空） */
  changes: ChangelogChange[];
};

/** 一次完整的数据加载结果 */
export type GameData = {
  lineups: Lineup[];
  chessPlayers: ChessPlayer[];
  /** 基础数据库（图鉴），可能为空（加载失败时） */
  database?: Database;
  /** 版本更新日志（可选） */
  changelog?: ChangelogEntry[];
};
