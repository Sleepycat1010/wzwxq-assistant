import { AnimatePresence, motion } from 'framer-motion';
import type { ChessPlayer } from '../types';
import { ImgIcon } from './ImgIcon';
import { cn } from '../lib/cn';

/**
 * 棋手详情弹窗：头像 + 类型 + 技能组（含图标与关联卡）+ 关联卡。
 */
export function LordDetailModal({
  lord,
  open,
  onClose,
}: {
  lord?: ChessPlayer;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && lord ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="card-base relative z-10 max-h-[88vh] w-full max-w-lg overflow-y-auto"
          >
            <div className="sticky top-0 flex items-start gap-4 border-b border-white/5 bg-surface/95 p-5 backdrop-blur">
              <ImgIcon
                src={lord.avatar || lord.icon}
                alt={lord.name}
                className="h-16 w-16 rounded-xl border border-white/10"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-2xl text-text">{lord.name}</h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={cn(
                      'rounded-md px-2 py-0.5 font-medium',
                      lord.type === '经济运营型'
                        ? 'bg-gold/15 text-gold'
                        : lord.type === '战斗增益型'
                          ? 'bg-crimson/15 text-crimson'
                          : 'bg-white/10 text-text-dim',
                    )}
                  >
                    {lord.type}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-1 text-text-dim transition-colors hover:bg-surface-2 hover:text-text"
                aria-label="关闭"
              >
                关闭
              </button>
            </div>

            <div className="space-y-4 p-5">
              <section>
                <div className="section-label mb-1.5">技能组</div>
                {lord.talents && lord.talents.length > 0 ? (
                  <div className="space-y-3">
                    {lord.talents.map((t, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-white/5 bg-surface-2/50 p-3"
                      >
                        <div className="flex items-center gap-2">
                          <ImgIcon
                            src={t.icon}
                            alt={t.name}
                            className="h-8 w-8 shrink-0 rounded-md border border-white/10"
                          />
                          <span className="font-display text-base text-text">
                            {t.name}
                          </span>
                          {t.level ? (
                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-text-dim">
                              Lv.{t.level}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-dim">
                          {t.desc || '（官方暂未提供技能描述）'}
                        </p>
                        {t.cards && t.cards.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {t.cards.map((c, ci) => (
                              <span
                                key={ci}
                                className="rounded-lg border border-jade/20 bg-jade/5 px-2 py-0.5 text-xs text-jade"
                              >
                                {c.name}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-dim">
                    {lord.skill || '（官方暂未提供技能描述）'}
                  </p>
                )}
              </section>

              {lord.relatedCards && lord.relatedCards.length > 0 ? (
                <section>
                  <div className="section-label mb-1.5">关联卡</div>
                  <div className="flex flex-wrap gap-2">
                    {lord.relatedCards.map((c) => (
                      <span
                        key={c.name}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-surface-2 px-2.5 py-1 text-sm text-text-dim"
                      >
                        <ImgIcon
                          src={c.thumb}
                          alt={c.name}
                          className="h-5 w-5 rounded"
                          fallbackClassName="text-[8px]"
                        />
                        {c.name}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
