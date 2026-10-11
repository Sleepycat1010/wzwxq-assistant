import { useCallback, useEffect, useRef, useState } from 'react';
import { cloud, FAVORITES_TABLE, type LineupFavoriteRow } from '../lib/cloud';

const STORAGE_KEY = 'wzwxq-favorites';

function readLocal(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* 隐私模式 / 无 localStorage 时静默降级 */
  }
}

/**
 * 收藏 Hook：登录后与云端同步（跨设备），未登录时使用本地存储。
 *
 * - 本地始终先渲染，避免登录前列表闪烁。
 * - 登录成功后自动拉取本人收藏覆盖本地，保证换设备一致。
 * - 收藏/取消时乐观更新本地，并写入云端。
 */
export function useFavorites(signedIn: boolean) {
  const [ids, setIds] = useState<string[]>(() => readLocal());
  const [syncing, setSyncing] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const syncedOnce = useRef(false);

  // 登录后从云端拉取本人收藏
  useEffect(() => {
    if (!signedIn) {
      syncedOnce.current = false;
      return;
    }
    if (syncedOnce.current) return;
    syncedOnce.current = true;

    let cancelled = false;
    void (async () => {
      setSyncing(true);
      setCloudError(null);
      try {
        const { data, error } = await cloud.database
          .from(FAVORITES_TABLE)
          .select('lineup_id');
        if (cancelled) return;
        if (error) {
          setCloudError('收藏同步失败，已保留本地收藏');
          return;
        }
        const remote = ((data ?? []) as LineupFavoriteRow[])
          .map((r) => r.lineup_id)
          .filter(Boolean);
        // 云端为准（云端有数据时覆盖本地）
        const next = remote.length > 0 ? remote : readLocal();
        setIds(next);
        writeLocal(next);
      } catch {
        if (!cancelled) setCloudError('收藏同步失败，已保留本地收藏');
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  /** 切换收藏状态 */
  const toggle = useCallback(
    (id: string) => {
      let willAdd = false;
      setIds((prev) => {
        willAdd = !prev.includes(id);
        const next = willAdd ? [...prev, id] : prev.filter((x) => x !== id);
        writeLocal(next);
        return next;
      });

      if (!signedIn) return;

      void (async () => {
        try {
          if (willAdd) {
            const { error } = await cloud.database
              .from(FAVORITES_TABLE)
              .upsert([{ lineup_id: id }], { onConflict: 'owner_id,lineup_id' });
            if (error) setCloudError('收藏未能同步到云端');
          } else {
            const { error } = await cloud.database
              .from(FAVORITES_TABLE)
              .delete()
              .eq('lineup_id', id);
            if (error) setCloudError('收藏未能同步到云端');
          }
        } catch {
          setCloudError('收藏未能同步到云端');
        }
      })();
    },
    [signedIn],
  );

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, toggle, has, count: ids.length, syncing, cloudError };
}
