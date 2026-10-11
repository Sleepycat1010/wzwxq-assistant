import { motion } from 'framer-motion';
import type { ChessPlayer } from '../types';
import { cn } from '../lib/cn';
import { ImgIcon } from './ImgIcon';

/**
 * 棋手卡片（Step 2 使用）：单选。
 */
export function ChessPlayerCard({
  player,
  selected,
  onSelect,
  onShowDetail,
}: {
  player: ChessPlayer;
  selected: boolean;
  onSelect: (id: string) => void;
  onShowDetail?: () => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(player.id)}
      aria-pressed={selected}
      className={cn(
        'card-base flex flex-col p-4 text-left transition-all duration-200',
        selected ? 'border-gold shadow-gold' : 'hover:border-gold/40',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <ImgIcon
            src={player.avatar || player.icon}
            alt={player.name}
            className="h-11 w-11 shrink-0 rounded-xl border border-white/10"
            fallbackClassName="text-base"
          />
          <h3 className="truncate font-display text-lg font-bold leading-tight text-text">
            {player.name}
          </h3>
        </div>
      </div>

      <div className="mt-3">
        <span
          className={cn(
            'chip border-transparent px-2.5 py-0.5 text-xs font-medium',
            player.type === '经济运营型'
              ? 'bg-gold/15 text-gold'
              : player.type === '战斗增益型'
                ? 'bg-crimson/15 text-crimson'
                : 'bg-white/10 text-text-dim',
          )}
        >
          {player.type}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-text-dim">
        {player.skill}
      </p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className={cn(
            'inline-flex w-fit items-center gap-1 rounded-lg px-3 py-1 text-sm font-semibold transition-colors',
            selected ? 'bg-gold text-bg' : 'bg-surface-2 text-text',
          )}
        >
          {selected ? '已选择' : '选择此棋手'}
        </span>
        {onShowDetail ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShowDetail();
            }}
            className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-text-dim transition-colors hover:border-gold/40 hover:text-gold"
          >
            技能详解 ›
          </button>
        ) : null}
      </div>
    </motion.button>
  );
}
