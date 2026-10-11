import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CardBase, ChessPlayer, Database, Hero } from '../types';
import { cn } from '../lib/cn';
import { ImgIcon } from './ImgIcon';
import { HeroDetailModal } from './HeroDetailModal';
import { LordDetailModal } from './LordDetailModal';

const TABS = ['阵营', '英雄', '效果牌', '天赋', '装备', '棋手'] as const;
type Tab = (typeof TABS)[number];

function qualityLabel(q?: number): string {
  if (!q) return '';
  return `${q}品`;
}

function CardItem({ card }: { card: CardBase }) {
  return (
    <div className="card-base flex flex-col overflow-hidden p-3 transition-colors hover:border-gold/40">
      <div className="flex items-center gap-3">
        <ImgIcon
          src={card.thumb || card.image}
          alt={card.name}
          className="h-12 w-12 shrink-0 rounded-lg border border-white/10"
          fallbackClassName="text-sm"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-display text-base font-bold text-text">
              {card.name}
            </span>
            {qualityLabel(card.quality) ? (
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-text-dim">
                {qualityLabel(card.quality)}
              </span>
            ) : null}
          </div>
          {card.relationName ? (
            <div className="text-[11px] text-gold/80">{card.relationName}</div>
          ) : null}
        </div>
      </div>
      {card.desc ? (
        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-text-dim">
          {card.desc}
        </p>
      ) : null}
    </div>
  );
}

function HeroItem({ hero, onClick }: { hero: Hero; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card-base flex flex-col overflow-hidden p-3 text-left transition-colors hover:border-gold/40"
    >
      <div className="flex items-center gap-3">
        <ImgIcon
          src={hero.thumb || hero.image}
          alt={hero.name}
          className="h-12 w-12 shrink-0 rounded-lg border border-white/10"
          fallbackClassName="text-sm"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-display text-base font-bold text-text">
              {hero.name}
            </span>
            {typeof hero.cost === 'number' ? (
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-text-dim">
                费{hero.cost}
              </span>
            ) : null}
          </div>
          {hero.relationName ? (
            <div className="text-[11px] text-gold/80">{hero.relationName}</div>
          ) : null}
        </div>
      </div>
      {hero.desc ? (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-text-dim">
          {hero.desc}
        </p>
      ) : null}
    </button>
  );
}

function LordItem({ lord, onClick }: { lord: ChessPlayer; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card-base flex flex-col overflow-hidden p-3 text-left transition-colors hover:border-gold/40"
    >
      <div className="flex items-center gap-3">
        <ImgIcon
          src={lord.avatar || lord.icon}
          alt={lord.name}
          className="h-12 w-12 shrink-0 rounded-lg border border-white/10"
          fallbackClassName="text-sm"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-display text-base font-bold text-text">
              {lord.name}
            </span>
          </div>
          <span
            className={cn(
              'mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium',
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
      {lord.skill ? (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-text-dim">
          {lord.skill}
        </p>
      ) : null}
    </button>
  );
}

/**
 * 图鉴弹层：浏览基础数据库（阵营 / 英雄 / 效果牌 / 天赋 / 装备 / 棋手）。
 * 数据来自 public/data/database.json（官方 CDN 抓取，定时刷新）。
 */
export function CodexPanel({
  open,
  onClose,
  database,
  chessPlayers,
}: {
  open: boolean;
  onClose: () => void;
  database?: Database;
  chessPlayers: ChessPlayer[];
}) {
  const [tab, setTab] = useState<Tab>('阵营');
  const [q, setQ] = useState('');
  const [selHero, setSelHero] = useState<Hero | undefined>();
  const [selLord, setSelLord] = useState<ChessPlayer | undefined>();

  const counts = database?.meta.counts;

  const items = useMemo(() => {
    if (!database) return [] as CardBase[];
    const list: CardBase[] =
      tab === '英雄'
        ? database.heroes
        : tab === '效果牌'
          ? database.effectCards
          : tab === '天赋'
            ? database.talents
            : tab === '装备'
              ? database.equipments
              : [];
    const kw = q.trim();
    if (!kw) return list;
    return list.filter(
      (c) =>
        c.name.includes(kw) ||
        (c.desc ?? '').includes(kw) ||
        (c.relationName ?? '').includes(kw),
    );
  }, [database, tab, q]);

  const factions = database?.factions ?? [];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
            className="card-base relative z-10 flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 p-5">
              <h3 className="font-display text-xl font-bold text-gold">基础数据库 · 图鉴</h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-1 text-text-dim transition-colors hover:bg-surface-2 hover:text-text"
                aria-label="关闭"
              >
                关闭
              </button>
            </div>

            {/* 标签 + 搜索 */}
            <div className="flex flex-wrap items-center gap-2 border-b border-white/5 px-5 py-3">
              {TABS.map((t) => {
                const c =
                  t === '阵营'
                    ? factions.length
                    : t === '英雄'
                      ? counts?.heroes
                      : t === '效果牌'
                        ? counts?.effectCards
                        : t === '天赋'
                          ? counts?.talents
                          : t === '装备'
                            ? counts?.equipments
                            : chessPlayers.length;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTab(t);
                      setQ('');
                    }}
                    className={cn(
                      'rounded-full border px-3 py-1 text-sm transition-colors',
                      tab === t
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-white/10 text-text-dim hover:border-gold/30',
                    )}
                  >
                    {t}
                    {typeof c === 'number' ? (
                      <span className="ml-1 opacity-70">{c}</span>
                    ) : null}
                  </button>
                );
              })}
              {tab !== '阵营' && tab !== '棋手' ? (
                <input
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="搜索名称 / 描述"
                  className="ml-auto w-40 rounded-lg border border-white/10 bg-surface-2 px-3 py-1.5 text-sm text-text placeholder:text-text-dim/60 focus:border-gold/50 focus:outline-none"
                />
              ) : null}
            </div>

            <div className="overflow-y-auto p-5">
              {!database && tab !== '棋手' ? (
                <div className="card-base p-10 text-center text-text-dim">
                  <p className="font-display text-lg font-bold text-text">
                    图鉴数据加载中…
                  </p>
                  <p className="mt-2 text-sm">
                    若长时间无内容，可能为基础数据库未就绪（将使用内置兜底）。
                  </p>
                </div>
              ) : tab === '阵营' ? (
                <div className="space-y-3">
                  {factions.map((f) => (
                    <div key={f.name} className="card-base p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="font-display text-lg font-bold text-gold">
                          {f.name}
                        </span>
                        <span className="font-mono text-xs text-text-dim">
                          {f.heroCount} 名英雄
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {f.heroes.map((h) => (
                          <span
                            key={h}
                            className="rounded-lg border border-white/10 bg-surface-2/60 px-2.5 py-1 text-sm text-text-dim"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : tab === '英雄' ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((c) => (
                    <HeroItem
                      key={c.id}
                      hero={c as Hero}
                      onClick={() => setSelHero(c as Hero)}
                    />
                  ))}
                  {items.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-text-dim">
                      没有匹配的内容
                    </div>
                  ) : null}
                </div>
              ) : tab === '棋手' ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {chessPlayers.map((p) => (
                    <LordItem
                      key={p.id}
                      lord={p}
                      onClick={() => setSelLord(p)}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((c) => (
                    <CardItem key={c.id} card={c} />
                  ))}
                  {items.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-text-dim">
                      没有匹配的内容
                    </div>
                  ) : null}
                </div>
              )}

              <div className="mt-5 rounded-xl border border-white/5 bg-surface/60 p-4 text-xs leading-relaxed text-text-dim">
                <div className="mb-1 font-semibibold text-gold">数据说明</div>
                本图鉴数据由腾讯王者万象棋官方 CDN 接口抓取并归一化，涵盖全部英雄、效果牌、天赋、装备、棋手，
                以及 6 大阵营羁绊及其英雄构成。所有内容版权归腾讯及原作者所有。
                {database ? (
                  <div className="mt-1 font-mono text-text-dim/70">
                    抓取时间：{database.meta.fetchedAt}
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}

      <HeroDetailModal
        hero={selHero}
        open={!!selHero}
        onClose={() => setSelHero(undefined)}
      />
      <LordDetailModal
        lord={selLord}
        open={!!selLord}
        onClose={() => setSelLord(undefined)}
      />
    </AnimatePresence>
  );
}
