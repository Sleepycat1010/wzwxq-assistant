import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ChessPlayer } from '../types';
import { ChessPlayerCard } from './ChessPlayerCard';
import { LordDetailModal } from './LordDetailModal';

/**
 * Step 2：选择棋手（单选）。
 */
export function ChessPlayerStep({
  players,
  selectedId,
  onSelect,
  onPrev,
  onNext,
}: {
  players: ChessPlayer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const selected = players.find((p) => p.id === selectedId) ?? null;
  const [detailLord, setDetailLord] = useState<ChessPlayer | null>(null);

  return (
    <section>
      <div className="mb-5">
        <h2 className="font-display text-xl text-text">第二步 · 选择你的棋手</h2>
        <p className="mt-1 text-sm text-text-dim">
          单选本局棋手（已收录全部 20 位官方棋手），系统会据此推荐更契合的阵容。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((p) => (
          <ChessPlayerCard
            key={p.id}
            player={p}
            selected={p.id === selectedId}
            onSelect={onSelect}
            onShowDetail={() => setDetailLord(p)}
          />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button className="btn-ghost" onClick={onPrev}>
          ← 上一步
        </button>
        <motion.button
          className="btn-gold"
          onClick={onNext}
          disabled={!selected}
          whileTap={{ scale: 0.98 }}
        >
          生成推荐 →
        </motion.button>
      </div>

      <LordDetailModal
        lord={detailLord ?? undefined}
        open={!!detailLord}
        onClose={() => setDetailLord(null)}
      />
    </section>
  );
}
