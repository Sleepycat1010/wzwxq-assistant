import { motion } from 'framer-motion';
import type { DataStatus } from '../hooks/useGameData';
import type { AuthStatus, AuthUser } from '../hooks/useAuth';

/**
 * 站标：象棋棋子造型（圆形棋子 + 描边 + 底座），金色渐变。
 * 用 SVG 而非方块字，物件感与辨识度更高。
 */
function LogoMark() {
  return (
    <motion.svg
      viewBox="0 0 48 48"
      initial={{ rotate: -8, scale: 0.9, opacity: 0 }}
      animate={{ rotate: 0, scale: 1, opacity: 1 }}
      transition={{ duration: 0.45 }}
      className="h-11 w-11 shrink-0 drop-shadow-[0_0_10px_rgba(245,197,66,0.35)]"
      role="img"
      aria-label="王者万象棋小助手"
    >
      <defs>
        <linearGradient id="logo-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5c542" />
          <stop offset="100%" stopColor="#d6a52d" />
        </linearGradient>
      </defs>
      {/* 底座 */}
      <rect
        x="9"
        y="38"
        width="30"
        height="5"
        rx="2.5"
        fill="url(#logo-gold)"
        opacity="0.65"
      />
      {/* 棋子主体 */}
      <circle cx="24" cy="22" r="16" fill="url(#logo-gold)" />
      {/* 内环 */}
      <circle
        cx="24"
        cy="22"
        r="12"
        fill="none"
        stroke="rgba(11,13,18,0.55)"
        strokeWidth="1.6"
      />
      {/* 「帅」字 */}
      <text
        x="24"
        y="22"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#0b0d12"
        fontSize="15"
        fontWeight="900"
        fontFamily="'Noto Sans SC', sans-serif"
      >
        帅
      </text>
    </motion.svg>
  );
}

/**
 * 站点头部：站名 + 副标题 + 数据来源 / 图鉴 / 版本更新入口 + 登录状态。
 */
export function Header({
  onOpenSources,
  onOpenCodex,
  onOpenChangelog,
  onOpenAuth,
  status,
  hasNewUpdate,
  authStatus,
  user,
}: {
  onOpenSources: () => void;
  onOpenCodex: () => void;
  onOpenChangelog: () => void;
  onOpenAuth: () => void;
  status: DataStatus;
  hasNewUpdate?: boolean;
  authStatus?: AuthStatus;
  user?: AuthUser | null;
}) {
  const signedIn = authStatus === 'signed-in' && !!user;
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <LogoMark />
        <div>
          <h1 className="font-display text-xl font-black leading-none tracking-tight text-text sm:text-2xl">
            王者万象棋<span className="text-gold">小助手</span>
          </h1>
          <p className="mt-1 hidden text-xs text-text-dim sm:block">
            禁用阵容 · 选将 · 智能推荐可用阵容
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <span
          className="hidden items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-xs text-text-dim sm:inline-flex"
          title={
            status === 'ready'
              ? '已加载最新线上数据'
              : '使用内置兜底数据（可离线运行）'
          }
        >
          <span
            className={
              status === 'ready'
                ? 'h-1.5 w-1.5 rounded-full bg-jade'
                : 'h-1.5 w-1.5 rounded-full bg-gold'
            }
          />
          {status === 'ready' ? '数据在线' : '内置数据'}
        </span>

        <button className="btn-ghost relative px-4 py-2" onClick={onOpenChangelog}>
          版本更新
          {hasNewUpdate ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-crimson px-1 text-[9px] font-bold text-white">
              新
            </span>
          ) : null}
        </button>
        <button className="btn-ghost px-4 py-2" onClick={onOpenCodex}>
          图鉴
        </button>
        <button className="btn-ghost px-4 py-2" onClick={onOpenSources}>
          来源
        </button>

        {/* 登录 / 用户 */}
        {signedIn ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-jade/40 bg-jade/10 px-3.5 py-2 text-sm text-jade">
            <span className="h-1.5 w-1.5 rounded-full bg-jade" />
            {user?.name ? user.name.slice(0, 8) : '已登录'}
          </span>
        ) : (
          <button
            className="btn-ghost px-4 py-2 text-gold"
            onClick={onOpenAuth}
            disabled={authStatus === 'loading'}
          >
            {authStatus === 'loading' ? '加载中…' : '登录'}
          </button>
        )}
      </div>
    </header>
  );
}
