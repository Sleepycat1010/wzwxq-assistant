import { useMemo } from 'react';
import type { Lineup } from '../types';
import { cn } from '../lib/cn';

/**
 * Step 1：仅按阵营选择（可多选禁用）。
 * 阵营以指挥式切换卡呈现：未禁用为中性、悬停金边；已禁用为绯红语义（禁用 = 负面动作）。
 */
export function BanStep({
  lineups,
  factions,
  bannedIds,
  onToggleFaction,
  onNext,
}: {
  lineups: Lineup[];
  factions: { name: string; heroCount: number }[];
  bannedIds: string[];
  onToggleFaction: (faction: string) => void;
  onNext: () => void;
}) {
  const factionStat = useMemo(() => {
    const map = new Map<string, { total: number; banned: number }>();
    for (const f of factions) {
      const inFaction = lineups.filter((l) => l.faction === f.name);
      const banned = inFaction.filter((l) => bannedIds.includes(l.id)).length;
      map.set(f.name, { total: inFaction.length, banned });
    }
    return map;
  }, [lineups, factions, bannedIds]);

  const bannedFactions = useMemo(
    () =>
      factions.filter((f) => {
        const s = factionStat.get(f.name);
        return s && s.total > 0 && s.banned === s.total;
      }),
    [factions, factionStat],
  );

  return (
    <section>
      <div className="mb-5">
        <h2 className="font-display text-2xl font-black tracking-tight text-text">
          第一步 · 禁用阵营
        </h2>
        <p className="mt-1.5 text-sm text-text-dim">
          勾选本局不玩的羁绊（可多选），第三步推荐会自动排除对应阵容。
        </p>
      </div>

      {/* 阵营切换卡 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {factions.map((f) => {
          const s = factionStat.get(f.name);
          const allBanned = s && s.total > 0 && s.banned === s.total;
          return (
            <button
              key={f.name}
              type="button"
              onClick={() => onToggleFaction(f.name)}
              aria-pressed={allBanned}
              className={cn(
                'focusable group relative flex flex-col items-start gap-2 overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200',
                allBanned
                  ? 'border-crimson/60 bg-crimson/10 shadow-crimson'
                  : 'border-white/[0.07] bg-surface/70 hover:border-gold/40 hover:bg-surface',
              )}
            >
              <span
                className={cn(
                  'font-display text-lg font-black leading-tight',
                  allBanned ? 'text-crimson' : 'text-text',
                )}
              >
                {f.name}
              </span>
              <span
                className={cn(
                  'text-xs',
                  allBanned ? 'text-crimson/80' : 'text-text-dim',
                )}
              >
                {f.heroCount} 名英雄
              </span>
              <span
                className={cn(
                  'mt-auto inline-flex items-center gap-1.5 pt-2 text-xs font-medium',
                  allBanned ? 'text-crimson' : 'text-text-dim/70',
                )}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 items-center justify-center rounded-full border text-[10px]',
                    allBanned
                      ? 'border-crimson bg-crimson text-white'
                      : 'border-white/25 text-transparent group-hover:border-gold/50',
                  )}
                >
                  {allBanned ? '✓' : ''}
                </span>
                {allBanned ? '已禁用' : '点击禁用'}
              </span>
            </button>
          );
        })}
      </div>

      {/* 状态提示 */}
      <div className="mt-5">
        {bannedFactions.length > 0 ? (
          <div className="panel flex flex-wrap items-center gap-2 border-crimson/30 bg-crimson/10 px-4 py-3 text-sm text-crimson">
            <span className="font-semibold">已禁用：</span>
            {bannedFactions.map((f) => f.name).join('、')}
            <span className="text-crimson/80">
              （共排除 {bannedIds.length} 套阵容）
            </span>
          </div>
        ) : (
          <div className="text-sm text-text-dim/70">
            尚未禁用任何阵营，点击上方卡片即可禁用。
          </div>
        )}
      </div>

      {/* 吸底操作栏：滚动时「下一步」始终可见 */}
      <div className="sticky bottom-4 z-30 mt-6 flex items-center justify-between gap-3 rounded-full border border-white/10 bg-surface/85 p-1.5 pl-4 shadow-lift backdrop-blur-md">
        <span className="text-sm text-text-dim">
          已选禁用：
          <span className="stat-num text-crimson">{bannedIds.length}</span> 套
          <span className="text-text-dim/70">（{bannedFactions.length} 个阵营）</span>
        </span>
        <button className="btn-gold rounded-full px-6" onClick={onNext}>
          下一步：选择棋手 →
        </button>
      </div>
      <div className="h-4" aria-hidden />
    </section>
  );
}
