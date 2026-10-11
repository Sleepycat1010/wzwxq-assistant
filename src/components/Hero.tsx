import { motion } from 'framer-motion';
import type { ChangelogEntry } from '../types';

const TEASER = [
  { n: '01', label: '禁用阵营', desc: '勾掉本局不玩的羁绊' },
  { n: '02', label: '选择棋手', desc: '锁定你的本局棋手' },
  { n: '03', label: '查看推荐', desc: '即时筛出可用阵容' },
] as const;

function latestUpdate(entry?: ChangelogEntry): { date: string; added: number; changed: number; removed: number } | null {
  if (!entry || entry.baseline || !entry.changes) return null;
  const s = entry.summary ?? {};
  return {
    date: entry.date,
    added: Object.values(s.added ?? {}).reduce((a, b) => a + b, 0),
    changed: Object.values(s.changed ?? {}).reduce((a, b) => a + b, 0),
    removed: Object.values(s.removed ?? {}).reduce((a, b) => a + b, 0),
  };
}

/**
 * 站点主视觉：左标题 + 右战术数据面板（非对称构图），下方版本动态条。
 */
export function Hero({
  stats,
  changelog,
  onOpenChangelog,
}: {
  stats: { heroes: number; equipments: number; effectCards: number; talents: number; lords: number };
  changelog?: ChangelogEntry[];
  onOpenChangelog: () => void;
}) {
  const sorted = (changelog ?? [])
    .filter((e) => !e.baseline)
    .sort((a, b) => b.date.localeCompare(a.date));
  const upd = latestUpdate(sorted[0]);

  return (
    <section className="relative mb-10">
      <div className="grid items-center gap-8 lg:grid-cols-[1.45fr_1fr]">
        {/* 左：价值主张 */}
        <div>
          <motion.div
            aria-hidden
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mb-5 h-px w-20 origin-left bg-gradient-to-r from-gold to-transparent"
          />

          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="eyebrow"
          >
            王者万象棋 · 阵容决策
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="mt-3 font-display text-4xl font-black leading-[1.05] tracking-tight text-text sm:text-5xl"
          >
            禁用即避，<span className="text-gold">选将即成阵</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="mt-4 max-w-xl text-base leading-relaxed text-text-dim sm:text-lg"
          >
            三步锁定本局可用阵容：先禁掉不玩的阵营，再选你的棋手，系统即时筛出最契合的搭配与多源攻略出处。
          </motion.p>

          {/* 三步流程预告 */}
          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {TEASER.map((t, i) => (
              <motion.div
                key={t.n}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                className="panel flex items-center gap-3 p-3.5"
              >
                <span className="stat-num text-lg text-gold/90">{t.n}</span>
                <div className="min-w-0">
                  <div className="font-display text-sm font-bold text-text">{t.label}</div>
                  <div className="truncate text-xs text-text-dim">{t.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 右：战术数据库面板 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="card-base relative overflow-hidden p-6"
        >
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/10 blur-2xl"
            aria-hidden
          />
          <div className="eyebrow">战术数据库</div>
          <p className="mt-1 text-sm text-text-dim">实时同步官方接口的数据规模</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Stat label="英雄" value={stats.heroes} />
            <Stat label="棋手" value={stats.lords} />
            <Stat label="装备" value={stats.equipments} />
            <Stat label="效果牌" value={stats.effectCards} />
            <Stat label="天赋" value={stats.talents} />
            <Stat label="阵营" value={6} />
          </div>
        </motion.div>
      </div>

      {/* 版本动态条 */}
      {upd ? (
        <motion.button
          type="button"
          onClick={onOpenChangelog}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="card-base focusable mt-5 flex w-full flex-wrap items-center gap-3 px-5 py-3.5 text-left transition-colors hover:border-gold/40"
        >
          <span className="rounded-full bg-jade/15 px-3 py-1 text-xs font-semibold text-jade">
            版本动态
          </span>
          <span className="stat-num text-sm text-text">{upd.date}</span>
          <span className="text-sm text-text-dim">
            {upd.added > 0 ? `新增 ${upd.added} ` : ''}
            {upd.changed > 0 ? `改动 ${upd.changed} ` : ''}
            {upd.removed > 0 ? `移除 ${upd.removed} ` : ''}
            项内容已同步官方
          </span>
          <span className="ml-auto text-sm font-medium text-gold">查看日志 ›</span>
        </motion.button>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="panel flex items-baseline justify-between px-3 py-2.5">
      <span className="text-xs text-text-dim">{label}</span>
      <span className="stat-num text-xl text-text">{value}</span>
    </div>
  );
}
