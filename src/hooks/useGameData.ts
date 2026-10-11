import { useEffect, useState } from 'react';
import type { Database, GameData, ChangelogEntry } from '../types';
import { FALLBACK_LINEUPS, FALLBACK_PLAYERS } from '../data/fallback';

/** 数据加载状态 */
export type DataStatus = 'loading' | 'ready' | 'fallback';

const FALLBACK: GameData = {
  lineups: FALLBACK_LINEUPS,
  chessPlayers: FALLBACK_PLAYERS,
};

/**
 * 运行时加载游戏数据。
 *
 * 优先 fetch 站点 `public/data/*.json`（Vite 会以 BASE_URL 为前缀，兼容 GitHub Pages 项目页），
 * 若加载失败（离线 / 静态托管限制 / file:// 打开）则回退到内联兜底数据，
 * 保证页面「动态可更新」与「离线可用」双保险。
 */
export function useGameData(): { data: GameData; status: DataStatus } {
  const [data, setData] = useState<GameData>(FALLBACK);
  const [status, setStatus] = useState<DataStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      const base = import.meta.env.BASE_URL || './';
      try {
        const [lineupsRes, playersRes, dbRes, changelogRes] = await Promise.all([
          fetch(`${base}data/lineups.json`),
          fetch(`${base}data/chessPlayers.json`),
          fetch(`${base}data/database.json`),
          fetch(`${base}data/changelog.json`),
        ]);

        if (!lineupsRes.ok || !playersRes.ok) {
          throw new Error('数据请求返回非 200 状态');
        }

        const lineups = (await lineupsRes.json()) as GameData['lineups'];
        const chessPlayers = (await playersRes.json()) as GameData['chessPlayers'];
        let database: Database | undefined;
        if (dbRes.ok) {
          try {
            database = (await dbRes.json()) as Database;
          } catch {
            database = undefined;
          }
        }
        let changelog: ChangelogEntry[] | undefined;
        if (changelogRes.ok) {
          try {
            const arr = (await changelogRes.json()) as ChangelogEntry[];
            changelog = Array.isArray(arr) ? arr : undefined;
          } catch {
            changelog = undefined;
          }
        }

        if (!Array.isArray(lineups) || !Array.isArray(chessPlayers)) {
          throw new Error('数据结构异常');
        }

        if (!cancelled) {
          setData({ lineups, chessPlayers, database, changelog });
          setStatus('ready');
        }
      } catch {
        if (!cancelled) {
          // fetch 失败：使用内联兜底数据，不打断用户体验
          setData(FALLBACK);
          setStatus('fallback');
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, status };
}
