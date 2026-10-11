import { useCallback, useEffect, useRef, useState } from 'react';
import { cloud, RATINGS_TABLE, type LineupRatingRow } from '../lib/cloud';

const STORAGE_KEY = 'wzwxq-ratings';

export type Ratings = Record<string, number>;

function readLocal(): Ratings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const clean: Ratings = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        const n = Number(v);
        if (Number.isInteger(n) && n >= 1 && n <= 5) clean[k] = n;
      }
      return clean;
    }
    return {};
  } catch {
    return {};
  }
}

function writeLocal(ratings: Ratings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
  } catch {
    /* 隐私模式 / 无 localStorage 时静默降级 */
  }
}

/**
 * 评分 Hook：登录后与云端同步（跨设备），未登录时使用本地存储。
 *
 * - 本地始终作为缓存先渲染，避免登录前出现空白评分。
 * - 登录成功后自动从云端拉取本人评分；打星时乐观更新本地并写入云端。
 * - 打星传 0 表示清除该阵容评分。
 */
export function useRatings(signedIn: boolean) {
  const [ratings, setRatings] = useState<Ratings>(() => readLocal());
  const [syncing, setSyncing] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const syncedOnce = useRef(false);

  // 登录后从云端拉取本人评分
  useEffect(() => {
    if (!signedIn) {
      syncedOnce.current = false;
      return;
    }
    // 仅在同一登录态下拉取一次，避免每次评分都全量重拉
    if (syncedOnce.current) return;
    syncedOnce.current = true;

    let cancelled = false;
    void (async () => {
      setSyncing(true);
      setCloudError(null);
      try {
        const { data, error } = await cloud.database
          .from(RATINGS_TABLE)
          .select('lineup_id, rating');
        if (cancelled) return;
        if (error) {
          setCloudError('评分同步失败，已保留本地评分');
          return;
        }
        const remote: Ratings = {};
        for (const row of (data ?? []) as LineupRatingRow[]) {
          const n = Number(row.rating);
          if (row.lineup_id && Number.isInteger(n) && n >= 1 && n <= 5) {
            remote[row.lineup_id] = n;
          }
        }
        // 云端为准（有云端数据时覆盖本地，保证跨设备一致）
        setRatings(Object.keys(remote).length > 0 ? remote : readLocal());
      } catch {
        if (!cancelled) setCloudError('评分同步失败，已保留本地评分');
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  /** 设置评分（1–5）；传 0 表示清除 */
  const rate = useCallback(
    (id: string, value: number) => {
      const valid = Number.isInteger(value) && value >= 1 && value <= 5;
      // 乐观更新本地
      setRatings((prev) => {
        const next = { ...prev };
        if (valid) next[id] = value;
        else delete next[id];
        writeLocal(next);
        return next;
      });

      if (!signedIn) return;

      void (async () => {
        try {
          if (valid) {
            const payload: { lineup_id: string; rating: number }[] = [
              { lineup_id: id, rating: value },
            ];
            const { error } = await cloud.database
              .from(RATINGS_TABLE)
              .upsert(payload, { onConflict: 'owner_id,lineup_id' });
            if (error) setCloudError('评分未能同步到云端');
          } else {
            const { error } = await cloud.database
              .from(RATINGS_TABLE)
              .delete()
              .eq('lineup_id', id);
            if (error) setCloudError('评分未能同步到云端');
          }
        } catch {
          setCloudError('评分未能同步到云端');
        }
      })();
    },
    [signedIn],
  );

  const get = useCallback((id: string) => ratings[id] ?? 0, [ratings]);

  return {
    ratings,
    rate,
    get,
    count: Object.keys(ratings).length,
    syncing,
    cloudError,
    signedIn,
  };
}
