import { useMemo } from 'react';
import type { Lineup } from '../types';
import { cn } from '../lib/cn';

/**
 * Step 1：仅按阵营禁用（多选）。
 * 网格展示所有阵容卡片，每张可切换「本局禁用」状态。
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
  // 统计每个阵营被禁用 / 总数（用于快捷条展示）
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

  const chipBase =
    'rounded-full border px-3 py-1 text-xs font-medium transition-colors';

  return (
    <section>
      <div className="mb-5">
        <h2 className="font-display text-xl text-text">第一步 · 选择禁用的阵营</h2>
        <p className="mt-1 text-sm text-text-dim">
          勾选本局不玩的阵营（可多选），系统将在第三步推荐中自动排除对应阵容。
        </p>
      </div>

      {/* 阵营一键禁用 */}
      <div className="space-y-3 rounded-xl border border-white/5 bg-surface/60 p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-dim">阵营（点击切换禁用）</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {factions.map((f) => {
            const s = factionStat.get(f.name);
            const allBanned = s && s.total > 0 && s.banned === s.total;
            const partial = s && s.banned > 0 && !allBanned;
            return (
              <button
                key={f.name}
                type="button"
                onClick={() => onToggleFaction(f.name)}
                className={cn(
                  chipBase,
                  allBanned
                    ? 'border-crimson bg-crimson/15 text-crimson'
                    : partial
                      ? 'border-crimson/50 bg-crimson/5 text-crimson/90'
                      : 'border-white/10 text-text-dim hover:border-gold/30',
                )}
              >
                {f.name}
                <span className="ml-1 opacity-70">
                  {s ? `${s.banned}/${s.total}` : 0}
                </span>
              </button>
            );
          })}
        </div>

        {bannedFactions.length > 0 ? (
          <div className="rounded-lg bg-crimson/10 px-3 py-2 text-xs text-crimson">
            已禁用阵营：
            {bannedFactions.map((f) => f.name).join('、')}
            （共排除 {bannedIds.length} 套阵容）
          </div>
        ) : (
          <div className="text-xs text-text-dim/70">
            尚未禁用任何阵营，点击上方阵营即可禁用。
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm text-text-dim">
          已选禁用：
          <span className="font-mono text-crimson">{bannedIds.length}</span> 套
          （{bannedFactions.length} 个阵营）
        </span>
        <button className="btn-gold" onClick={onNext}>
          下一步：选择棋手 →
        </button>
      </div>
    </section>
  );
}
