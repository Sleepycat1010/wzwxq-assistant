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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(player.id)}
      aria-pressed={selected}
      className={cn(
        'card-base flex flex-col p-4 text-left transition-all duration-200',
        selected ? 'border-gold shadow-gold' : 'hover:border-gold/40',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <ImgIcon
            src={player.icon}
            alt={player.name}
            className="h-9 w-9 shrink-0 rounded-lg border border-white/10"
            fallbackClassName="text-sm"
          />
          <h3 className="truncate font-display text-lg leading-tight text-text">
            {player.name}
          </h3>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={cn(
            'rounded-md px-2 py-0.5 font-medium',
            player.type === '经济运营型'
              ? 'bg-gold/15 text-gold'
              : player.type === '战斗增益型'
                ? 'bg-crimson/15 text-crimson'
                : 'bg-white/10 text-text-dim',
          )}
        >
          {player.type}
        </span>
        {player.talent ? (
          <span className="text-text-dim">天赋 · {player.talent}</span>
        ) : null}
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-text-dim">{player.skill}</p>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div
          className={cn(
            'inline-flex w-fit items-center gap-1 rounded-lg px-3 py-1 text-sm font-medium transition-colors',
            selected ? 'bg-gold text-bg' : 'bg-surface-2 text-text',
          )}
        >
          {selected ? '已选择' : '选择此棋手'}
        </div>
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
