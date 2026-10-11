import { motion } from 'framer-motion';
import type { ChessPlayer } from '../types';
import type { ScoredLineup } from '../lib/recommend';
import { LineupCard } from './LineupCard';

/**
 * Step 3：推荐结果。
 */
export function RecommendStep({
  scored,
  bannedCount,
  player,
  onRestart,
}: {
  scored: ScoredLineup[];
  bannedCount: number;
  player: ChessPlayer;
  onRestart: () => void;
}) {
  return (
    <section>
      <div className="mb-5">
        <h2 className="font-display text-xl text-text">第三步 · 可用阵容推荐</h2>
        <p className="mt-1 text-sm text-text-dim">
          已为你排除禁用阵容，并按强度、棋手契合度与克制关系综合排序。
        </p>
      </div>

      {/* 概要条 */}
      <div className="card-base mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="text-sm text-text-dim">
          已禁用 <span className="font-mono text-crimson">{bannedCount}</span> 套 ·
          已选棋手{' '}
          <span className="font-mono text-gold">{player?.name ?? '—'}</span>
        </div>
        <span className="rounded-full bg-jade/15 px-3 py-1 text-sm text-jade">
          共 {scored.length} 套可用
        </span>
      </div>

      {scored.length === 0 ? (
        <div className="card-base p-10 text-center text-text-dim">
          <p className="font-display text-lg text-text">所有阵容都被禁用了</p>
          <p className="mt-2 text-sm">
            请返回第一步取消部分禁用，或点击「重新开始」重新选择。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {scored.map((s, i) => (
            <LineupCard key={s.lineup.id} scored={s} index={i} />
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <motion.button
          className="btn-ghost"
          onClick={onRestart}
          whileTap={{ scale: 0.98 }}
        >
          重新开始
        </motion.button>
      </div>
    </section>
  );
}
