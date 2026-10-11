import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { ChessPlayer, Database, Hero } from '../types';
import type { ScoredLineup } from '../lib/recommend';
import { cn } from '../lib/cn';
import { LineupCard } from './LineupCard';
import { HeroDetailModal } from './HeroDetailModal';

/**
 * Step 3：推荐结果 + 本地收藏。
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
}) {
  const displayed = favOnly
    ? scored.filter((s) => favoriteIds.includes(s.lineup.id))
    : scored;

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

  const [detailHero, setDetailHero] = useState<Hero | undefined>();

  return (
    <section>
      <div className="mb-5">
        <h2 className="font-display text-xl text-text">第三步 · 可用阵容推荐</h2>
        <p className="mt-1 text-sm text-text-dim">
          已为你排除禁用阵容，并按强度、棋手契合度与克制关系综合排序。
        </p>
      </div>

      {/* 概要条 */}
      <div className="card-base mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-sm text-text-dim">
          已禁用 <span className="font-mono text-crimson">{bannedCount}</span> 套
          · 已选棋手{' '}
          <span className="font-mono text-gold">{player?.name ?? '—'}</span>
        </div>
        <div className="flex items-center gap-3">
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

      {scored.length === 0 ? (
        <div className="card-base p-10 text-center text-text-dim">
          <p className="font-display text-lg text-text">所有阵容都被禁用了</p>
          <p className="mt-2 text-sm">
            请返回第一步取消部分禁用，或点击「重新开始」重新选择。
          </p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="card-base p-10 text-center text-text-dim">
          {favOnly ? (
            <>
              <p className="font-display text-lg text-text">还没有收藏的阵容</p>
              <p className="mt-2 text-sm">
                在卡片右上角点击 ☆ 即可收藏，刷新或重开也会保留。
              </p>
            </>
          ) : (
            <p className="font-display text-lg text-text">没有可推荐的阵容</p>
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
            />
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <motion.button
          className="btn-ghost"
          onClick={onRestart}
          whileTap={{ scale: 0.98 }}
        >
          重新开始
        </motion.button>
      </div>

      <HeroDetailModal
        hero={detailHero}
        open={!!detailHero}
        onClose={() => setDetailHero(undefined)}
      />
    </section>
  );
}
