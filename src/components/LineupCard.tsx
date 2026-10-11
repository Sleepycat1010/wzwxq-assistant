import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ScoredLineup, RecommendReason } from '../lib/recommend';
import type { Tier } from '../types';
import { cn } from '../lib/cn';
import { SourceBadge } from './SourceBadge';
import { ImgIcon } from './ImgIcon';
import { StarRating } from './StarRating';

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
    <div className="panel p-3">
      <div
        className={cn(
          'mb-1.5 font-mono text-xs font-semibold uppercase tracking-wide',
          accent,
        )}
      >
        {title}
      </div>
      <p className="text-sm leading-relaxed text-text-dim">
        {text || '（官方暂未提供该阶段运营）'}
      </p>
    </div>
  );
}

/** 站位棋盘：依官方 positionX / positionZ 绘制网格；z 越小越靠前排，前排置于底部 */
function PositionBoard({
  positions,
  thumbs,
}: {
  positions: { name: string; x: number | null; z: number | null; equip?: string[] }[];
  /** 英雄名 -> 头像 URL */
  thumbs?: Record<string, string>;
}) {
  const valid = positions.filter(
    (p) => typeof p.x === 'number' && typeof p.z === 'number',
  );
  if (valid.length === 0) return null;
  const cols = Math.max(6, ...valid.map((p) => (p.x as number) + 1));
  // 后排(z 大)在上，前排(z=0)在下
  const zs = [...new Set(valid.map((p) => p.z as number))].sort((a, b) => b - a);
  const rowLabel = (i: number) =>
    i === zs.length - 1 ? '前排' : i === 0 ? '后排' : `第${i + 1}排`;

  return (
    <div className="panel p-3">
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gold">
        站位棋盘
      </div>
      <div className="space-y-1">
        {zs.map((z, i) => (
          <div key={z} className="flex items-stretch gap-1">
            <div className="flex w-8 shrink-0 items-center justify-center rounded bg-white/5 text-[10px] text-text-dim">
              {rowLabel(i)}
            </div>
            <div
              className="grid flex-1 gap-1"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: cols }).map((__, c) => {
                const hero = valid.find((p) => p.x === c && p.z === z);
                return (
                  <div
                    key={c}
                    title={hero ? hero.name : undefined}
                    className={cn(
                      'flex aspect-square items-center justify-center overflow-hidden rounded-md',
                      hero
                        ? 'bg-gold/15'
                        : 'bg-white/[0.03]',
                    )}
                  >
                    {hero ? (
                      <ImgIcon
                        src={thumbs?.[hero.name]}
                        alt={hero.name}
                        className="h-full w-full text-[8px]"
                        fallbackClassName="text-[8px]"
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 text-[10px] text-text-dim/70">
        （下为前排 z=0，上为后排）
      </div>
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
  heroThumbs,
  onHeroClick,
  myRating = 0,
  onRate,
}: {
  scored: ScoredLineup;
  index: number;
  defaultOpen?: boolean;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  /** 英雄名 -> 头像 URL（用于站位棋盘与核心英雄） */
  heroThumbs?: Record<string, string>;
  /** 点击核心英雄时回调（用于打开英雄详解） */
  onHeroClick?: (name: string) => void;
  /** 本机玩家对该阵容的自评分 0–5 */
  myRating?: number;
  /** 点击星级回调（传 0 清除） */
  onRate?: (value: number) => void;
}) {
  const [open, setOpen] = useState(defaultOpen ?? index === 0);
  const { lineup, reasons } = scored;
  // 官方评分仅在 >0 时有意义（官方对多数阵容未给分，值为 0）
  const officialScore =
    typeof lineup.score === 'number' && lineup.score > 0 ? lineup.score : null;

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
            <h3 className="font-display text-lg font-bold text-text">{lineup.name}</h3>
            <TierBadge tier={lineup.tier} />
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-text-dim">
              {lineup.fitType}
            </span>
            {lineup.faction ? (
              <span className="rounded-md bg-gold/15 px-2 py-0.5 text-xs text-gold">
                {lineup.faction}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-text-dim">{lineup.tagline}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-dim/80">
            {officialScore !== null ? (
              <span className="text-gold/90">官方评分 {officialScore}</span>
            ) : null}
            {lineup.useNum ? (
              <span>使用 {lineup.useNum.toLocaleString()} 次</span>
            ) : null}
            {lineup.author ? <span>作者 {lineup.author}</span> : null}
            {onRate ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="text-text-dim/70">我的评分</span>
                <StarRating value={myRating} onRate={onRate} />
              </span>
            ) : null}
          </div>
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
                      <button
                        key={h}
                        type="button"
                        onClick={() => onHeroClick?.(h)}
                        className="rounded-lg border border-gold/30 bg-gold/10 px-2.5 py-1 text-sm text-gold transition-colors hover:border-gold/60 hover:bg-gold/20"
                        title="查看英雄详情"
                      >
                        {h}
                      </button>
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

              {/* 推荐棋手 */}
              {lineup.recommendedLords && lineup.recommendedLords.length > 0 ? (
                <div>
                  <div className="section-label mb-1.5">
                    官方推荐棋手
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lineup.recommendedLords.map((n) => (
                      <span
                        key={n}
                        className="rounded-lg border border-jade/30 bg-jade/10 px-2.5 py-1 text-sm text-jade"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* 站位棋盘 */}
              {lineup.heroPositions && lineup.heroPositions.length > 0 ? (
                <PositionBoard
                  positions={lineup.heroPositions}
                  thumbs={heroThumbs}
                />
              ) : null}

              {/* 出装明细（按英雄） */}
              {lineup.heroPositions &&
              lineup.heroPositions.some((h) => h.equip && h.equip.length > 0) ? (
                <div>
                  <div className="section-label mb-1.5">
                    出装明细（按英雄）
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lineup.heroPositions
                      .filter((h) => h.equip && h.equip.length > 0)
                      .map((h) => (
                        <span
                          key={h.name}
                          className="rounded-lg border border-white/10 bg-surface-2 px-2.5 py-1 text-sm text-text-dim"
                        >
                          <span className="text-gold">{h.name}</span>：
                          {h.equip!.join('、')}
                        </span>
                      ))}
                  </div>
                </div>
              ) : null}

              {/* 站位 / 出装 */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="panel p-3">
                  <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gold">
                    站位思路
                  </div>
                  <p className="text-sm leading-relaxed text-text-dim">
                    {lineup.positioning}
                  </p>
                </div>
                <div className="panel p-3">
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
