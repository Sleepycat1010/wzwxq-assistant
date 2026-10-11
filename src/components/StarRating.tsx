import { cn } from '../lib/cn';

/**
 * 星级评分：点击 1–5 星为阵容打分，再次点击同一颗星可清除。
 * 纯展示态（readonly）用于汇总显示。
 */
export function StarRating({
  value,
  onRate,
  size = 'sm',
  readonly = false,
}: {
  /** 当前评分 0–5（0 = 未评分） */
  value: number;
  onRate?: (value: number) => void;
  size?: 'sm' | 'md';
  readonly?: boolean;
}) {
  const px = size === 'md' ? 'text-lg' : 'text-sm';

  return (
    <div className={cn('inline-flex items-center gap-0.5', px)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const Star = (
          <span
            className={cn(
              'leading-none transition-colors',
              filled ? 'text-gold' : 'text-white/20',
              !readonly && 'cursor-pointer hover:text-gold/70',
            )}
          >
            ★
          </span>
        );
        if (readonly || !onRate) {
          return (
            <span key={n} aria-hidden={!filled}>
              {Star}
            </span>
          );
        }
        return (
          <button
            key={n}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRate(value === n ? 0 : n);
            }}
            aria-label={value === n ? `清除评分 ${value} 星` : `评为 ${n} 星`}
            title={value === n ? '点击清除' : `${n} 星`}
          >
            {Star}
          </button>
        );
      })}
      {value > 0 ? (
        <span className="stat-num ml-1 text-xs text-gold">{value}</span>
      ) : null}
    </div>
  );
}
