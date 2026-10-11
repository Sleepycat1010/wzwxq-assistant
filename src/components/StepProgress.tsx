import { motion } from 'framer-motion';
import { Fragment } from 'react';
import { cn } from '../lib/cn';

const STEPS = [
  { id: 1, label: '禁用阵营' },
  { id: 2, label: '选择棋手' },
  { id: 3, label: '查看推荐' },
] as const;

/**
 * 三步进度指示。已完成步骤（id < 当前）可点击回退。
 * 连接线作为节点之间的兄弟元素渲染（而非绝对定位覆盖），避免穿过节点圆点。
 */
export function StepProgress({
  current,
  onStepClick,
}: {
  current: number;
  onStepClick: (step: 1 | 2 | 3) => void;
}) {
  return (
    <nav className="px-1" aria-label="步骤进度">
      <ol className="flex items-center">
        {STEPS.map((s, i) => {
          const done = s.id < current;
          const active = s.id === current;
          const clickable = s.id < current;

          return (
            <Fragment key={s.id}>
              {/* 连接线：位于两节点之间，仅点亮「已走过的区间」 */}
              {i > 0 ? (
                <div className="flex flex-1 items-center px-1 sm:px-2">
                  <motion.span
                    className="h-px w-full rounded-full"
                    initial={false}
                    animate={{
                      backgroundColor: done
                        ? 'rgba(245,197,66,0.55)'
                        : 'rgba(255,255,255,0.10)',
                    }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  />
                </div>
              ) : null}

              <li className="shrink-0">
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onStepClick(s.id)}
                  className={cn(
                    'group flex flex-col items-center gap-2',
                    clickable ? 'cursor-pointer' : 'cursor-default',
                  )}
                >
                  <motion.span
                    animate={{ scale: active ? 1.08 : 1 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 font-mono text-sm font-bold transition-colors',
                      active
                        ? 'border-gold bg-gold text-bg shadow-gold'
                        : done
                          ? 'border-gold/50 bg-gold/15 text-gold'
                          : 'border-white/[0.14] bg-surface text-text-dim',
                    )}
                  >
                    {done ? '✓' : s.id}
                  </motion.span>
                  <span
                    className={cn(
                      'whitespace-nowrap text-xs transition-colors sm:text-sm',
                      active
                        ? 'font-semibold text-text'
                        : done
                          ? 'text-text'
                          : 'text-text-dim',
                    )}
                  >
                    {s.label}
                  </span>
                </button>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
