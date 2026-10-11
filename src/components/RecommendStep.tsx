import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { ChessPlayer, Database, Hero, Tier } from '../types';
import type { ScoredLineup } from '../lib/recommend';
import { cn } from '../lib/cn';
import { LineupCard } from './LineupCard';
import { HeroDetailModal } from './HeroDetailModal';

type SortKey = 'smart' | 'myRating' | 'useNum' | 'tier';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'smart', label: '综合推荐' },
  { key: 'myRating', label: '我的评分' },
  { key: 'useNum', label: '使用次数' },
  { key: 'tier', label: '梯队' },
];

const TIER_ORDER: Record<Tier, number> = { T0: 0, T1: 1, T2: 2 };

/**
 * Step 3：推荐结果 + 本地收藏 + 玩家评分与多维排序。
 */
export function RecommendStep({
  scored,
  bannedCount,
  player,
  onRestart,
  favoriteIds,
  onToggleFavorite,
  favOnly,
  onToggleFavOnly,
  database,
  ratings,
  onRate,
  ratingsSyncing,
  ratingsCloudError,
  favoritesSyncing,
  favoritesCloudError,
}: {
  scored: ScoredLineup[];
  bannedCount: number;
  player: ChessPlayer;
  onRestart: () => void;
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  favOnly: boolean;
  onToggleFavOnly: () => void;
  database?: Database;
  ratings: Record<string, number>;
  onRate: (id: string, value: number) => void;
  ratingsSyncing?: boolean;
  ratingsCloudError?: string | null;
  favoritesSyncing?: boolean;
  favoritesCloudError?: string | null;
}) {
  const [sort, setSort] = useState<SortKey>('smart');

  // 英雄头像 / 详情映射（用于站位棋盘与英雄详解）
  const { heroThumbs, heroMap } = useMemo(() => {
    const thumbs: Record<string, string> = {};
    const map: Record<string, Hero> = {};
    for (const h of database?.heroes ?? []) {
      if (h.thumb || h.image) thumbs[h.name] = h.thumb || h.image;
      map[h.name] = h;
    }
    return { heroThumbs: thumbs, heroMap: map };
  }, [database]);

  // 排序（收藏过滤在排序之后应用）
  const sorted = useMemo(() => {
    const arr = scored.slice();
    if (sort === 'myRating') {
      arr.sort((a, b) => {
        const ra = ratings[a.lineup.id] ?? 0;
        const rb = ratings[b.lineup.id] ?? 0;
        if (rb !== ra) return rb - ra; // 评分高的前
        return (b.lineup.useNum ?? 0) - (a.lineup.useNum ?? 0); // 同分按热度
      });
    } else if (sort === 'useNum') {
      arr.sort((a, b) => (b.lineup.useNum ?? 0) - (a.lineup.useNum ?? 0));
    } else if (sort === 'tier') {
      arr.sort(
        (a, b) =>
          TIER_ORDER[a.lineup.tier] - TIER_ORDER[b.lineup.tier] ||
          (b.lineup.useNum ?? 0) - (a.lineup.useNum ?? 0),
      );
    }
    // 'smart' 保持 recommendLineups 的原始综合排序
    return arr;
  }, [scored, sort, ratings]);

  const displayed = favOnly
    ? sorted.filter((s) => favoriteIds.includes(s.lineup.id))
    : sorted;

  const [detailHero, setDetailHero] = useState<Hero | undefined>();

  return (
    <section>
      <div className="mb-5">
        <h2 className="font-display text-2xl font-black tracking-tight text-text">
          第三步 · 可用阵容推荐
        </h2>
        <p className="mt-1.5 text-sm text-text-dim">
          已排除禁用阵容，卡片左上角的数字是按当前排序方式得出的推荐名次。点击「展开详情」查看站位、出装与分阶段运营。
        </p>
      </div>

      {/* 概要条 + 排序 */}
      <div className="panel mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-sm text-text-dim">
          已禁用 <span className="stat-num text-crimson">{bannedCount}</span> 套
          · 已选棋手{' '}
          <span className="font-medium text-gold">{player?.name ?? '—'}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 排序选择 */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-dim">排序</span>
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-surface-2/60 p-0.5">
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSort(s.key)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    sort === s.key
                      ? 'bg-gold text-bg'
                      : 'text-text-dim hover:text-gold',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleFavOnly}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              favOnly
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-white/10 text-text-dim hover:border-gold/30',
            )}
          >
            ★ 只看收藏{favoriteIds.length > 0 ? ` (${favoriteIds.length})` : ''}
          </button>
          <span className="rounded-full bg-jade/15 px-3 py-1 text-sm text-jade">
            共 {scored.length} 套可用
          </span>
        </div>
      </div>

      {/* 评分 / 收藏同步状态 */}
      {ratingsCloudError || favoritesCloudError ? (
        <p className="mb-3 text-xs text-crimson">
          {ratingsCloudError ?? favoritesCloudError}
        </p>
      ) : ratingsSyncing || favoritesSyncing ? (
        <p className="mb-3 text-xs text-text-dim">正在同步你的评分与收藏…</p>
      ) : null}

      {scored.length === 0 ? (
        <div className="card-base p-10 text-center text-text-dim">
          <p className="font-display text-lg font-bold text-text">所有阵容都被禁用了</p>
          <p className="mt-2 text-sm">
            请返回第一步取消部分禁用，或点击「重新开始」重新选择。
          </p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="card-base p-10 text-center text-text-dim">
          {favOnly ? (
            <>
              <p className="font-display text-lg font-bold text-text">还没有收藏的阵容</p>
              <p className="mt-2 text-sm">
                在卡片右上角点击 ☆ 即可收藏，刷新或重开也会保留。
              </p>
            </>
          ) : (
            <p className="font-display text-lg font-bold text-text">没有可推荐的阵容</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {displayed.map((s, i) => (
            <LineupCard
              key={s.lineup.id}
              scored={s}
              index={i}
              favorite={favoriteIds.includes(s.lineup.id)}
              onToggleFavorite={() => onToggleFavorite(s.lineup.id)}
              heroThumbs={heroThumbs}
              onHeroClick={(name) => setDetailHero(heroMap[name])}
              myRating={ratings[s.lineup.id] ?? 0}
              onRate={(v) => onRate(s.lineup.id, v)}
            />
          ))}
        </div>
      )}

      {/* 吸底操作栏：滚动时始终可见「重新开始」 */}
      <div className="sticky bottom-4 z-30 mt-8 flex justify-center">
        <div className="rounded-full border border-white/10 bg-surface/85 p-1.5 shadow-lift backdrop-blur-md">
          <motion.button
            className="btn-ghost rounded-full px-6"
            onClick={onRestart}
            whileTap={{ scale: 0.98 }}
          >
            重新开始
          </motion.button>
        </div>
      </div>

      <div className="h-4" aria-hidden />

      <HeroDetailModal
        hero={detailHero}
        open={!!detailHero}
        onClose={() => setDetailHero(undefined)}
      />
    </section>
  );
}
