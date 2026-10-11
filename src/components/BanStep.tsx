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

/**
 * Step 1：禁用阵容（多选）。
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
  return (
    <section>
      <div className="mb-5">
        <h2 className="font-display text-xl text-text">第一步 · 禁用本局阵容</h2>
        <p className="mt-1 text-sm text-text-dim">
          勾选本局不能玩的阵容（可多选），系统将在推荐中自动排除它们。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lineups.map((l, i) => {
          const banned = bannedIds.includes(l.id);
          return (
            <motion.button
              key={l.id}
              type="button"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.4) }}
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
                  <span className="truncate">· {l.coreHeroes.join(' / ')}</span>
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

      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm text-text-dim">
          已选禁用：<span className="font-mono text-crimson">{bannedIds.length}</span> 套
        </span>
        <button className="btn-gold" onClick={onNext}>
          下一步：选择棋手 →
        </button>
      </div>
    </section>
  );
}
