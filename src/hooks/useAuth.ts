import { useCallback, useEffect, useState } from 'react';
import { cloud } from '../lib/cloud';

/** 登录用户的基本信息（不含任何敏感凭据） */
export type AuthUser = {
  id: string;
  /** 展示用昵称，可能为空 */
  name?: string | null;
};

export type AuthStatus = 'loading' | 'signed-in' | 'signed-out';

/**
 * 会话 Hook：管理当前登录状态。
 * 未登录时应用仍可使用（评分退化为本地存储），登录后自动同步到云端。
 */
export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data, error } = await cloud.auth.getSession();
        if (cancelled) return;
        if (error || !data) {
          setUser(null);
          setStatus('signed-out');
          return;
        }
        const u = data.user as { id?: string; name?: string | null } | undefined;
        setUser(u?.id ? { id: u.id, name: u.name ?? null } : null);
        setStatus(u?.id ? 'signed-in' : 'signed-out');
      } catch {
        if (!cancelled) {
          setUser(null);
          setStatus('signed-out');
        }
      }
    }

    void load();

    const unsubscribe = cloud.auth.onAuthStateChange((_event, session) => {
      const u = session?.user as
        | { id?: string; name?: string | null }
        | undefined;
      if (u?.id) {
        setUser({ id: u.id, name: u.name ?? null });
        setStatus('signed-in');
      } else {
        setUser(null);
        setStatus('signed-out');
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await cloud.auth.signOut();
    } finally {
      setUser(null);
      setStatus('signed-out');
    }
  }, []);

  return { status, user, signedIn: status === 'signed-in', signOut };
}
