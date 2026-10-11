import { AnimatePresence, motion } from 'framer-motion';
import type { ChangelogCat, ChangelogEntry, ChangelogChange } from '../types';
import { cn } from '../lib/cn';

const CAT_LABEL: Record<ChangelogCat, string> = {
  heroes: '英雄',
  lords: '棋手',
  equipments: '装备',
  effectCards: '效果牌',
  talents: '天赋',
};

const CHANGE_LABEL: Record<ChangelogChange['type'], string> = {
  added: '新增',
  removed: '移除',
  changed: '改动',
};

function ChangeBadge({ type }: { type: ChangelogChange['type'] }) {
  const cls =
    type === 'added'
      ? 'bg-jade/15 text-jade'
      : type === 'removed'
        ? 'bg-crimson/15 text-crimson'
        : 'bg-gold/15 text-gold';
  return (
    <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-medium', cls)}>
      {CHANGE_LABEL[type]}
    </span>
  );
}

function Entry({ entry }: { entry: ChangelogEntry }) {
  if (entry.baseline) {
    const counts = entry.summary?.counts ?? {};
    return (
      <div className="card-base p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-lg font-bold text-gold">{entry.title}</span>
          <span className="font-mono text-xs text-text-dim">{entry.date}</span>
        </div>
        <p className="mt-2 text-sm text-text-dim">
          全量同步官方数据，建立本地基础数据库：
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {(Object.keys(counts) as ChangelogCat[]).map((k) => (
            <span
              key={k}
              className="rounded-lg border border-white/10 bg-surface-2 px-2.5 py-1 text-text-dim"
            >
              {CAT_LABEL[k]} {counts[k]}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const changes = entry.changes ?? [];
  const summary = entry.summary ?? {};
  return (
    <div className="card-base p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-lg font-bold text-text">{entry.title}</span>
        <span className="font-mono text-xs text-text-dim">{entry.date}</span>
        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-text-dim">
          版本 {entry.version}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {(['added', 'removed', 'changed'] as const).map((t) => {
          const groups = summary[t] ?? {};
          const total = Object.values(groups).reduce((a, b) => a + b, 0);
          if (!total) return null;
          return (
            <span
              key={t}
              className={cn(
                'rounded-lg px-2.5 py-1',
                t === 'added'
                  ? 'bg-jade/10 text-jade'
                  : t === 'removed'
                    ? 'bg-crimson/10 text-crimson'
                    : 'bg-gold/10 text-gold',
              )}
            >
              {CHANGE_LABEL[t]} {total}
            </span>
          );
        })}
      </div>

      {changes.length > 0 ? (
        <div className="mt-3 divide-y divide-white/5">
          {changes.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-2 py-1.5 text-sm text-text-dim"
            >
              <ChangeBadge type={c.type} />
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-text-dim">
                {CAT_LABEL[c.cat]}
              </span>
              <span className="text-text">{c.name}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * 版本更新日志页（独立覆盖层）：按版本 / 日期倒序列出改动。
 * 数据来自 public/data/changelog.json（由定时抓取自动对比生成）。
 */
export function ChangelogPage({
  open,
  onClose,
  changelog,
}: {
  open: boolean;
  onClose: () => void;
  changelog?: ChangelogEntry[];
}) {
  const entries = (changelog ?? []).slice().sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="card-base relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 p-5">
              <div>
                <h3 className="font-display text-xl font-bold text-gold">版本更新日志</h3>
                <p className="mt-1 text-xs text-text-dim">
                  由定时抓取自动对比官方数据生成，记录英雄 / 棋手 / 装备的改动
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-1 text-text-dim transition-colors hover:bg-surface-2 hover:text-text"
                aria-label="关闭"
              >
                关闭
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto p-5">
              {entries.length === 0 ? (
                <div className="card-base p-10 text-center text-text-dim">
                  <p className="font-display text-lg font-bold text-text">
                    暂无版本更新记录
                  </p>
                  <p className="mt-2 text-sm">
                    数据将在每日定时刷新并检测到官方改动后自动生成。
                  </p>
                </div>
              ) : (
                entries.map((e, i) => <Entry key={`${e.date}-${i}`} entry={e} />)
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
