import { motion } from 'framer-motion';

const TEASER = [
  { n: '1', label: '禁用阵营', desc: '勾选本局不玩的羁绊' },
  { n: '2', label: '选择棋手', desc: '锁定你的本局棋手' },
  { n: '3', label: '查看推荐', desc: '即时筛出可用阵容' },
] as const;

/**
 * 站点主视觉：价值主张 + 三步流程预告。
 * 左对齐构图、定向金线点缀，刻意避开「居中标题压暗色网格」的 AI 套路。
 */
export function Hero() {
  return (
    <section className="relative mb-10">
      {/* 定向金线，强化非对称张力 */}
      <motion.div
        aria-hidden
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mb-6 h-px w-24 origin-left bg-gradient-to-r from-gold to-transparent"
      />

      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="eyebrow"
      >
        王者万象棋 · 阵容决策助手
      </motion.span>

      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="mt-3 max-w-3xl font-display text-4xl leading-[1.08] tracking-tight text-text sm:text-5xl"
      >
        禁用即避，
        <span className="text-gold">选将即成阵</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12 }}
        className="mt-4 max-w-2xl text-base leading-relaxed text-text-dim sm:text-lg"
      >
        三步锁定本局可用阵容：先禁掉不玩的阵营，再选你的棋手，系统即时筛出最契合的搭配与多源攻略出处。
      </motion.p>

      {/* 三步流程预告 */}
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TEASER.map((t, i) => (
          <motion.div
            key={t.n}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
            className="card-base flex items-center gap-3 p-4"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/15 font-mono text-sm font-bold text-gold">
              {t.n}
            </span>
            <div className="min-w-0">
              <div className="font-display text-base text-text">{t.label}</div>
              <div className="truncate text-xs text-text-dim">{t.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
