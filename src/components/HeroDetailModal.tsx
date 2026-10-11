import { AnimatePresence, motion } from 'framer-motion';
import type { Hero } from '../types';
import { ImgIcon } from './ImgIcon';

/**
 * 英雄详情弹窗：头像 + 阵营 + 费用 + 技能/效果 + 觉醒进化 + 关联卡。
 */
export function HeroDetailModal({
  hero,
  open,
  onClose,
}: {
  hero?: Hero;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && hero ? (
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
                src={hero.thumb || hero.image}
                alt={hero.name}
                className="h-16 w-16 rounded-xl border border-white/10"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-2xl font-bold text-text">{hero.name}</h3>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  {hero.relationName ? (
                    <span className="rounded-md bg-gold/15 px-2 py-0.5 text-gold">
                      {hero.relationName}
                    </span>
                  ) : null}
                  {typeof hero.cost === 'number' ? (
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-text-dim">
                      费用 {hero.cost}
                    </span>
                  ) : null}
                  {hero.quality ? (
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-text-dim">
                      {hero.quality} 品
                    </span>
                  ) : null}
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
                <div className="section-label mb-1.5">技能 / 效果</div>
                <p className="whitespace-pre-line text-sm leading-relaxed text-text-dim">
                  {hero.desc || '（官方暂未提供技能描述）'}
                </p>
                {hero.effectTypeDesc ? (
                  <p className="mt-2 text-xs text-text-dim/80">
                    效果类型：{hero.effectTypeDesc}
                  </p>
                ) : null}
              </section>

              {hero.evolution ? (
                <section className="rounded-xl border border-gold/20 bg-gold/5 p-3">
                  <div className="section-label mb-2 text-gold">
                    觉醒 / 进化形态
                  </div>
                  <div className="flex items-center gap-3">
                    <ImgIcon
                      src={hero.evolution.image}
                      alt={hero.evolution.name}
                      className="h-12 w-12 shrink-0 rounded-lg border border-white/10"
                    />
                    <div className="min-w-0">
                      <div className="font-display text-base font-bold text-text">
                        {hero.evolution.name}
                      </div>
                      <p className="whitespace-pre-line text-xs leading-relaxed text-text-dim">
                        {hero.evolution.desc}
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}

              {hero.relatedCards && hero.relatedCards.length > 0 ? (
                <section>
                  <div className="section-label mb-1.5">关联卡</div>
                  <div className="flex flex-wrap gap-2">
                    {hero.relatedCards.map((c) => (
                      <span
                        key={c}
                        className="rounded-lg border border-white/10 bg-surface-2 px-2.5 py-1 text-sm text-text-dim"
                      >
                        {c}
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
