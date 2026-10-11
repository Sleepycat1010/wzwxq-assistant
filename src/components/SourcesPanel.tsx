import { AnimatePresence, motion } from 'framer-motion';
import type { ChessPlayer, Lineup, Source } from '../types';

type Entry = { ref: string; source: Source };

/**
 * 数据来源汇总弹层：按平台分组展示所有阵容与棋手的出处，
 * 并说明「多来源动态更新」机制与贡献方式。
 */
export function SourcesPanel({
  open,
  onClose,
  lineups,
  players,
}: {
  open: boolean;
  onClose: () => void;
  lineups: Lineup[];
  players: ChessPlayer[];
}) {
  // 收集所有出处并按平台分组
  const groups: Record<string, Entry[]> = {};
  const ordered: string[] = [];

  const add = (platform: string, entry: Entry) => {
    if (!groups[platform]) {
      groups[platform] = [];
      ordered.push(platform);
    }
    groups[platform].push(entry);
  };

  lineups.forEach((l) => {
    l.sources.forEach((s) => add(s.platform, { ref: `阵容 · ${l.name}`, source: s }));
  });
  players.forEach((p) => {
    if (p.source) {
      add(p.source.platform, { ref: `棋手 · ${p.name}`, source: p.source });
    }
  });

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
          {/* 背景遮罩 */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          {/* 弹层内容 */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="card-base relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-white/5 p-5">
              <h3 className="font-display text-xl text-gold">数据来源与贡献</h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-1 text-text-dim transition-colors hover:bg-surface-2 hover:text-text"
                aria-label="关闭"
              >
                关闭
              </button>
            </div>

            <div className="overflow-y-auto p-5">
              <p className="mb-4 text-sm leading-relaxed text-text-dim">
                本站点所有阵容与棋手攻略均来自多平台公开内容，每条推荐都标注了出处。
                数据以 JSON 形式存放于 <code className="font-mono text-gold/80">public/data/</code>，
                <span className="text-gold"> 运行时动态加载</span>——
                修改 JSON 后<span className="text-gold">无需重新构建</span>即可生效。
              </p>

              <div className="mb-5 rounded-xl border border-gold/20 bg-gold/5 p-4 text-sm text-text-dim">
                <div className="mb-1 font-semibold text-gold">如何新增 / 更新来源？</div>
                编辑 <code className="font-mono text-gold/80">public/data/lineups.json</code> 或{' '}
                <code className="font-mono text-gold/80">chessPlayers.json</code> 中对应条目的{' '}
                <code className="font-mono text-gold/80">sources</code> 字段（平台、作者、链接、日期、说明），
                提交 PR 即可。欢迎补充 王者营地 / 玩一玩 / 王者攻略库(ima) / Bilibili 等来源。
              </div>

              <div className="space-y-5">
                {ordered.map((platform) => (
                  <div key={platform}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-gold" />
                      <h4 className="font-display text-base text-text">
                        {platform}
                      </h4>
                      <span className="font-mono text-xs text-text-dim">
                        {groups[platform].length} 条
                      </span>
                    </div>
                    <ul className="space-y-2 pl-4">
                      {groups[platform].map((e, i) => (
                        <li
                          key={i}
                          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
                        >
                          <span className="text-text-dim">{e.ref}</span>
                          <a
                            href={e.source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gold underline-offset-2 hover:underline"
                          >
                            {e.source.author ?? '查看原文'}
                          </a>
                          {e.source.date ? (
                            <span className="font-mono text-xs text-text-dim/70">
                              {e.source.date}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
