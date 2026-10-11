import { motion } from 'framer-motion';
import type { ChessPlayer } from '../types';
import { cn } from '../lib/cn';
import { SourceBadge } from './SourceBadge';

/**
 * 棋手卡片（Step 2 使用）：单选。
 */
export function ChessPlayerCard({
  player,
  selected,
  onSelect,
}: {
  player: ChessPlayer;
  selected: boolean;
  onSelect: (id: string) => void;
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
        player.placeholder && !selected && 'opacity-80',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {player.icon ? (
            <img
              src={player.icon}
              alt={player.name}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              className="h-9 w-9 shrink-0 rounded-lg border border-white/10 object-cover"
            />
          ) : null}
          <h3
            className={cn(
              'truncate font-display text-lg leading-tight',
              player.placeholder ? 'text-text-dim' : 'text-text',
            )}
          >
            {player.name}
          </h3>
        </div>
        {player.placeholder ? (
          <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] text-text-dim">
            示例·待核实
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={cn(
            'rounded-md px-2 py-0.5 font-medium',
            player.type === '经济运营型'
              ? 'bg-gold/15 text-gold'
              : 'bg-crimson/15 text-crimson',
          )}
        >
          {player.type}
        </span>
        {player.talent ? (
          <span className="text-text-dim">天赋 · {player.talent}</span>
        ) : null}
      </div>

      <p className="mt-2 text-sm text-text-dim">{player.skill}</p>
      <p className="mt-2 text-xs text-text-dim/80">{player.desc}</p>

      {player.source ? (
        <div className="mt-3">
          <SourceBadge source={player.source} small />
        </div>
      ) : null}

      <div
        className={cn(
          'mt-3 inline-flex w-fit items-center gap-1 rounded-lg px-3 py-1 text-sm font-medium transition-colors',
          selected ? 'bg-gold text-bg' : 'bg-surface-2 text-text',
        )}
      >
        {selected ? '已选择' : '选择此棋手'}
      </div>
    </motion.button>
  );
}
