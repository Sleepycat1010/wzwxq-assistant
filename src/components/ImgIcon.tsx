import { useState } from 'react';
import { cn } from '../lib/cn';

/**
 * 图标图片：远程 CDN 图片，加载失败时回退为文字首字占位（避免破图）。
 */
export function ImgIcon({
  src,
  alt,
  className,
  fallbackClassName,
}: {
  src?: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [err, setErr] = useState(false);
  const text = alt ? alt.slice(0, 2) : '?';

  if (!src || err) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg bg-white/10 font-display text-text-dim',
          className,
          fallbackClassName,
        )}
        aria-label={alt}
      >
        {text}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setErr(true)}
      className={cn('object-cover', className)}
    />
  );
}
