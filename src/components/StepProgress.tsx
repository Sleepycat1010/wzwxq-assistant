import { motion } from 'framer-motion';
import { cn } from '../lib/cn';

const STEPS = [
  { id: 1, label: '禁用阵营' },
  { id: 2, label: '选择棋手' },
  { id: 3, label: '查看推荐' },
] as const;

/**
 * 三步进度指示。已完成步骤（id < 当前）可点击回退。
 */
export function StepProgress({
  current,
  onStepClick,
}: {
  current: number;
  onStepClick: (step: 1 | 2 | 3) => void;
}) {
  return (
    <div className="relative px-1">
      {/* 轨道与进度（节点中心对齐） */}
      <div className="absolute left-0 right-0 top-5 mx-6 h-px bg-white/10" />
      <motion.div
        className="absolute left-0 top-5 mx-6 h-px bg-gradient-to-r from-gold-2 to-gold"
        initial={false}
        animate={{
          width: `calc(${((current - 1) / (STEPS.length - 1)) * 100}% - ${(current - 1) === 0 ? 0 : 3}rem)`,
        }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />

      <div className="relative flex justify-between">
        {STEPS.map((s) => {
          const done = s.id < current;
          const active = s.id === current;
          const clickable = s.id < current;
          return (
            <button
              key={s.id}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(s.id)}
              className={cn(
                'group flex flex-col items-center gap-2',
                clickable ? 'cursor-pointer' : 'cursor-default',
              )}
            >
              <motion.span
                animate={{
                  scale: active ? 1.08 : 1,
                  borderColor: active
                    ? 'rgba(245,197,66,1)'
                    : done
                      ? 'rgba(245,197,66,0.5)'
                      : 'rgba(255,255,255,0.14)',
                }}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 font-mono text-sm font-bold transition-colors',
                  active
                    ? 'bg-gold text-bg shadow-gold'
                    : done
                      ? 'bg-gold/15 text-gold'
                      : 'bg-surface text-text-dim',
                )}
              >
                {s.id}
              </motion.span>
              <span
                className={cn(
                  'text-xs transition-colors sm:text-sm',
                  active ? 'font-semibold text-text' : done ? 'text-text' : 'text-text-dim',
                )}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
