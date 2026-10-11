import { motion } from 'framer-motion';
import type { DataStatus } from '../hooks/useGameData';

/**
 * 站点头部：站名 + 副标题 + 数据来源 / 图鉴 / 版本更新入口。
 */
export function Header({
  onOpenSources,
  onOpenCodex,
  onOpenChangelog,
  status,
  hasNewUpdate,
}: {
  onOpenSources: () => void;
  onOpenCodex: () => void;
  onOpenChangelog: () => void;
  status: DataStatus;
  hasNewUpdate?: boolean;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ rotate: -6, scale: 0.92, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold/30 bg-gradient-to-br from-gold/90 to-gold-2/80 font-display text-2xl font-black text-bg shadow-gold"
          aria-hidden
        >
          象
        </motion.div>
        <div>
          <h1 className="font-display text-xl font-black leading-none tracking-tight text-text sm:text-2xl">
            王者万象棋<span className="text-gold">小助手</span>
          </h1>
          <p className="mt-1 hidden text-xs text-text-dim sm:block">
            禁用阵容 · 选将 · 智能推荐可用阵容
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-xs text-text-dim sm:inline-flex"
          title={
            status === 'ready'
              ? '已加载最新线上数据'
              : '使用内置兜底数据（可离线运行）'
          }
        >
          <span
            className={
              status === 'ready'
                ? 'h-1.5 w-1.5 rounded-full bg-jade'
                : 'h-1.5 w-1.5 rounded-full bg-gold'
            }
          />
          {status === 'ready' ? '数据在线' : '内置数据'}
        </span>

        <button className="btn-ghost relative px-4 py-2" onClick={onOpenChangelog}>
          版本更新
          {hasNewUpdate ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-crimson px-1 text-[9px] font-bold text-white">
              新
            </span>
          ) : null}
        </button>
        <button className="btn-ghost px-4 py-2" onClick={onOpenCodex}>
          图鉴
        </button>
        <button className="btn-ghost px-4 py-2" onClick={onOpenSources}>
          来源
        </button>
      </div>
    </header>
  );
}
