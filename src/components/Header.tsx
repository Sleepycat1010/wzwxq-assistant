import { motion } from 'framer-motion';
import type { DataStatus } from '../hooks/useGameData';

/**
 * 站点头部：站名 + 副标题 + 数据来源入口。
 */
export function Header({
  onOpenSources,
  onOpenCodex,
  status,
}: {
  onOpenSources: () => void;
  onOpenCodex: () => void;
  status: DataStatus;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <motion.div
          initial={{ rotate: -8, scale: 0.9, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-gold-2 font-display text-2xl text-bg shadow-gold"
          aria-hidden
        >
          象
        </motion.div>
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="font-display text-2xl leading-none text-gold sm:text-3xl"
          >
            王者万象棋小助手
          </motion.h1>
          <p className="mt-1 text-xs text-text-dim sm:text-sm">
            禁用阵容 · 选择棋手 · 智能推荐可用阵容
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
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
          {status === 'ready' ? '数据已更新' : '内置数据'}
        </span>
        <button className="btn-ghost" onClick={onOpenCodex}>
          图鉴
        </button>
        <button className="btn-ghost" onClick={onOpenSources}>
          数据来源
        </button>
      </div>
    </header>
  );
}
