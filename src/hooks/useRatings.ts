import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'wzwxq-ratings';

export type Ratings = Record<string, number>;

/**
 * 本地评分 Hook：将玩家对各阵容的自评分（1–5 星）持久化到 localStorage。
 * 官方评分并非每套阵容都有（多数为 0=无数据），故提供玩家自评作为排序依据。
 * 纯前端、无后端，刷新/重开仍保留。
 */
export function useRatings() {
  const [ratings, setRatings] = useState<Ratings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : {};
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        // 仅保留 1–5 的整数分值
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
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
    } catch {
      /* 隐私模式 / 无 localStorage 时静默降级 */
    }
  }, [ratings]);

  /** 设置评分（1–5）；传 0 表示清除该阵容的评分 */
  const rate = useCallback((id: string, value: number) => {
    setRatings((prev) => {
      const next = { ...prev };
      if (value >= 1 && value <= 5) {
        next[id] = value;
      } else {
        delete next[id];
      }
      return next;
    });
  }, []);

  const get = useCallback((id: string) => ratings[id] ?? 0, [ratings]);

  const count = Object.keys(ratings).length;

  return { ratings, rate, get, count };
}
