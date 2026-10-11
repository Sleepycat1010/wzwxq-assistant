import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'wzwxq-favorites';

/**
 * 本地收藏 Hook：将用户收藏的阵容 id 持久化到 localStorage。
 * 纯前端、无后端依赖，刷新/重开仍保留。
 */
export function useFavorites() {
  const [ids, setIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* 隐私模式 / 无 localStorage 时静默降级 */
    }
  }, [ids]);

  const toggle = useCallback((id: string) => {
    setIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, toggle, has, count: ids.length };
}
