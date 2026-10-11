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
        <h2 className="font-display text-2xl font-black tracking-tight text-text">
          第二步 · 选择棋手
        </h2>
        <p className="mt-1.5 text-sm text-text-dim">
          单选本局棋手（已收录全部 {players.length} 位官方棋手），系统据此推荐更契合的阵容。
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

      {/* 吸底操作栏：滚动时「生成推荐」始终可见。
          容器 pointer-events-none，仅两个按钮接收点击，避免遮挡卡片。 */}
      <div className="pointer-events-none sticky bottom-4 z-30 mt-6 flex items-center justify-between gap-3 rounded-full border border-white/10 bg-surface/85 p-1.5 pl-4 shadow-lift backdrop-blur-md">
        <button
          className="btn-ghost pointer-events-auto rounded-full px-5"
          onClick={onPrev}
        >
          ← 上一步
        </button>
        <motion.button
          className="btn-gold pointer-events-auto rounded-full px-6"
          onClick={onNext}
          disabled={!selected}
          whileTap={{ scale: 0.98 }}
        >
          生成推荐 →
        </motion.button>
      </div>
      <div className="h-4" aria-hidden />

      <LordDetailModal
        lord={detailLord ?? undefined}
        open={!!detailLord}
        onClose={() => setDetailLord(null)}
      />
    </section>
  );
}
