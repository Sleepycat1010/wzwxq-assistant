import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { Lineup, Tier } from '../types';
import { cn } from '../lib/cn';

function TierBadge({ tier }: { tier: Tier }) {
  const styles: Record<Tier, string> = {
    T0: 'bg-gold text-bg',
    T1: 'bg-jade/20 text-jade',
    T2: 'bg-white/10 text-text-dim',
  };
  return (
    <span
      className={cn(
        'rounded-md px-2 py-0.5 font-mono text-xs font-semibold',
        styles[tier],
      )}
    >
      {tier}
    </span>
  );
}

const TYPE_OPTIONS = ['全部', '经济运营型', '战斗增益型'] as const;
const TIER_OPTIONS = ['全部', 'T0', 'T1', 'T2'] as const;

/**
 * Step 1：禁用阵容（多选）+ 搜索 / 筛选。
 * 网格展示所有阵容卡片，每张可切换「本局禁用」状态。
 */
export function BanStep({
  lineups,
  bannedIds,
  onToggleBan,
  onNext,
}: {
  lineups: Lineup[];
  bannedIds: string[];
  onToggleBan: (id: string) => void;
  onNext: () => void;
}) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] =
    useState<(typeof TYPE_OPTIONS)[number]>('全部');
  const [tierFilter, setTierFilter] =
    useState<(typeof TIER_OPTIONS)[number]>('全部');

  const filtered = useMemo(() => {
    const q = query.trim();
    return lineups.filter((l) => {
      if (typeFilter !== '全部' && l.fitType !== typeFilter) return false;
      if (tierFilter !== '全部' && l.tier !== tierFilter) return false;
      if (q) {
        const hay = [l.name, ...l.coreHeroes, ...(l.lateHeroes ?? [])].join(
          ' ',
        );
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [lineups, query, typeFilter, tierFilter]);

  const chipBase =
    'rounded-full border px-3 py-1 text-xs font-medium transition-colors';

  return (
    <section>
      <div className="mb-5">
        <h2 className="font-display text-xl text-text">第一步 · 禁用本局阵容</h2>
        <p className="mt-1 text-sm text-text-dim">
          勾选本局不能玩的阵容（可多选），系统将在推荐中自动排除它们。
        </p>
      </div>

      {/* 搜索 + 筛选 */}
      <div className="mb-5 space-y-3 rounded-xl border border-white/5 bg-surface/60 p-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索阵容名 / 英雄（如：三分、花木兰、嬴政）"
          className="w-full rounded-lg border border-white/10 bg-surface-2 px-4 py-2.5 text-sm text-text placeholder:text-text-dim/70 focus:border-gold/50 focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs text-text-dim">类型</span>
          {TYPE_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={cn(
                chipBase,
                typeFilter === t
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-white/10 text-text-dim hover:border-gold/30',
              )}
            >
              {t}
            </button>
          ))}
          <span className="mx-1 text-xs text-text-dim">强度</span>
          {TIER_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTierFilter(t)}
              className={cn(
                chipBase,
                tierFilter === t
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-white/10 text-text-dim hover:border-gold/30',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-xs text-text-dim">
        <span>
          筛选结果{' '}
          <span className="font-mono text-gold">{filtered.length}</span> /{' '}
          {lineups.length} 套
        </span>
        {(query || typeFilter !== '全部' || tierFilter !== '全部') && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setTypeFilter('全部');
              setTierFilter('全部');
            }}
            className="text-gold/80 hover:text-gold"
          >
            清除筛选
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="card-base p-10 text-center text-text-dim">
          <p className="font-display text-lg text-text">没有匹配的阵容</p>
          <p className="mt-2 text-sm">试着放宽搜索词或筛选条件。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l, i) => {
            const banned = bannedIds.includes(l.id);
            return (
              <motion.button
                key={l.id}
                type="button"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onToggleBan(l.id)}
                aria-pressed={banned}
                className={cn(
                  'card-base p-4 text-left transition-all duration-200',
                  banned
                    ? 'border-crimson/60 bg-crimson/10 shadow-crimson'
                    : 'hover:border-gold/40 hover:shadow-gold',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg leading-tight text-text">
                    {l.name}
                  </h3>
                  <TierBadge tier={l.tier} />
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-text-dim">
                  <span>{l.fitType}</span>
                  {l.coreHeroes.length > 0 ? (
                    <span className="truncate">
                      · {l.coreHeroes.join(' / ')}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-text-dim">{l.tagline}</p>
                <div
                  className={cn(
                    'mt-3 inline-flex items-center gap-1 rounded-lg px-3 py-1 text-sm font-medium transition-colors',
                    banned
                      ? 'bg-crimson text-white'
                      : 'bg-surface-2 text-text',
                  )}
                >
                  {banned ? '已禁用' : '禁用本局'}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm text-text-dim">
          已选禁用：
          <span className="font-mono text-crimson">{bannedIds.length}</span> 套
        </span>
        <button className="btn-gold" onClick={onNext}>
          下一步：选择棋手 →
        </button>
      </div>
    </section>
  );
}
