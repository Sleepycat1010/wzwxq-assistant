import type { Source } from '../types';
import { cn } from '../lib/cn';

/**
 * 出处徽章：点击跳转来源链接。
 * 展示平台 + 作者 + 日期，hover 时加深金边。
 */
export function SourceBadge({
  source,
  small = false,
}: {
  source: Source;
  small?: boolean;
}) {
  const title =
    source.note ?? [source.platform, source.author].filter(Boolean).join(' · ');

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className={cn(
        'group inline-flex max-w-full items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-text transition-colors hover:border-gold hover:bg-gold/20',
        small ? 'text-[11px]' : 'text-xs',
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
      <span className="truncate font-medium text-gold">{source.platform}</span>
      {source.author ? (
        <span className="truncate text-text-dim">· {source.author}</span>
      ) : null}
      {source.date ? (
        <span className="shrink-0 font-mono text-text-dim/80">{source.date}</span>
      ) : null}
    </a>
  );
}
