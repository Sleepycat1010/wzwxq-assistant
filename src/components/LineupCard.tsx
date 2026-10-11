import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ScoredLineup, RecommendReason } from '../lib/recommend';
import type { Tier } from '../types';
import { cn } from '../lib/cn';
import { SourceBadge } from './SourceBadge';

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

function ReasonPill({ reason }: { reason: RecommendReason }) {
  return (
    <li className="flex items-start gap-2 rounded-lg bg-surface-2/60 px-3 py-2 text-sm text-text-dim">
      <span className="mt-0.5 text-jade">✓</span>
      <span>{reason}</span>
    </li>
  );
}

function OperationColumn({
  title,
  text,
  accent,
}: {
  title: string;
  text: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-surface-2/50 p-3">
      <div
        className={cn(
          'mb-1.5 font-mono text-xs font-semibold uppercase tracking-wide',
          accent,
        )}
      >
        {title}
      </div>
      <p className="text-sm leading-relaxed text-text-dim">{text}</p>
    </div>
  );
}

/**
 * 推荐阵容卡片（Step 3 使用）。
 * 默认展开第一张，其余可点击展开查看站位/出装/运营/理由/出处。
 */
export function LineupCard({
  scored,
  index,
  defaultOpen,
  favorite,
  onToggleFavorite,
}: {
  scored: ScoredLineup;
  index: number;
  defaultOpen?: boolean;
  favorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen ?? index === 0);
  const { lineup, reasons } = scored;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
      className="card-base overflow-hidden p-4 sm:p-5"
    >
      {/* 头部：排名 + 名称 + 评级 + 一句话 */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-2 font-mono text-bg">
          <span className="text-sm font-bold leading-none">{index + 1}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg text-text">{lineup.name}</h3>
            <TierBadge tier={lineup.tier} />
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-text-dim">
              {lineup.fitType}
            </span>
          </div>
          <p className="mt-1 text-sm text-text-dim">{lineup.tagline}</p>
        </div>

        {/* 收藏星标 */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.();
          }}
          aria-label={favorite ? '取消收藏' : '收藏阵容'}
          className={cn(
            'mt-0.5 shrink-0 rounded-lg border px-2 py-1 text-lg leading-none transition-colors',
            favorite
              ? 'border-gold/50 bg-gold/10 text-gold'
              : 'border-white/10 text-text-dim hover:border-gold/40 hover:text-gold',
          )}
        >
          {favorite ? '★' : '☆'}
        </button>
      </div>

      {/* 展开/收起按钮 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-gold transition-colors hover:text-gold-2"
      >
        {open ? '收起详情' : '展开详情'}
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="inline-block">
          ▾
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4 border-t border-white/5 pt-4">
              {/* 核心英雄 */}
              <div>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-dim">
                  核心英雄
                </div>
                <div className="flex flex-wrap gap-2">
                  {lineup.coreHeroes.length > 0 ? (
                    lineup.coreHeroes.map((h) => (
                      <span
                        key={h}
                        className="rounded-lg border border-gold/30 bg-gold/10 px-2.5 py-1 text-sm text-gold"
                      >
                        {h}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-text-dim">
                      依版本灵活搭配（无强制核心）
                    </span>
                  )}
                  {lineup.lateHeroes && lineup.lateHeroes.length > 0 ? (
                    lineup.lateHeroes.map((h) => (
                      <span
                        key={h}
                        className="rounded-lg border border-white/10 bg-surface-2 px-2.5 py-1 text-sm text-text-dim"
                        title="后期补强"
                      >
                        {h}
                        <span className="ml-1 text-[10px]">后期</span>
                      </span>
                    ))
                  ) : null}
                </div>
              </div>

              {/* 整体思路 */}
              <p className="text-sm leading-relaxed text-text-dim">
                {lineup.strategy}
              </p>

              {/* 站位 / 出装 */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/5 bg-surface-2/50 p-3">
                  <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gold">
                    站位思路
                  </div>
                  <p className="text-sm leading-relaxed text-text-dim">
                    {lineup.positioning}
                  </p>
                </div>
                <div className="rounded-xl border border-white/5 bg-surface-2/50 p-3">
                  <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gold">
                    出装思路
                  </div>
                  <p className="text-sm leading-relaxed text-text-dim">
                    {lineup.equipment}
                  </p>
                </div>
              </div>

              {/* 分阶段运营：前期 / 中期 / 后期 */}
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-dim">
                  分阶段运营
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <OperationColumn
                    title="前期"
                    text={lineup.operations.early}
                    accent="text-jade"
                  />
                  <OperationColumn
                    title="中期"
                    text={lineup.operations.mid}
                    accent="text-gold"
                  />
                  <OperationColumn
                    title="后期"
                    text={lineup.operations.late}
                    accent="text-crimson"
                  />
                </div>
              </div>

              {/* 推荐理由 */}
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-dim">
                  推荐理由
                </div>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {reasons.map((r, i) => (
                    <ReasonPill key={i} reason={r} />
                  ))}
                </ul>
              </div>

              {/* 出处 */}
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-dim">
                  攻略出处
                </div>
                <div className="flex flex-wrap gap-2">
                  {lineup.sources.map((s, i) => (
                    <SourceBadge key={i} source={s} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
