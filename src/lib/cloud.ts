import { createWorkBuddyCloud } from '@tencent-ai/workbuddy-cloud-sdk';

/**
 * 云服务公开配置。
 * 三个值均来自 workbuddy_cloud_service 返回的 publicConfig，是唯一可安全出现在前端代码里的凭据。
 * - endpoint：当前应用发布域的数据面地址（必填）
 * - publishableKey：标识应用，本身不含权限（服务端强制校验 Origin）
 * - oauthRelayBaseUrl：OAuth Relay 地址（网页端微信登录需要）
 */
const publicConfig = {
  endpoint: 'https://wzwxq-assistant.app.workbuddy.host',
  oauthRelayBaseUrl: 'https://www.workbuddy.cn/v2/as/genie-baas/oauth',
  publishableKey: 'wbpk_S3TwZZpCGQPg9DH7GzHipL_VGZB9DlScCeRitx5TuoEcOJKsLXaxJzc',
};

/** 评分表行类型 */
export type LineupRatingRow = {
  id: number;
  owner_id: string;
  lineup_id: string;
  rating: number;
  created_at: string;
};

/**
 * 数据库 schema 类型：让 from('lineup_ratings') 正确推断行/插入类型。
 * Insert 中不含 owner_id（由 DEFAULT auth.uid() 服务端填充，前端不发送）。
 */
type CloudDatabase = {
  public: {
    Tables: {
      lineup_ratings: {
        Row: LineupRatingRow;
        Insert: Omit<LineupRatingRow, 'id' | 'owner_id' | 'created_at'>;
        Update: Partial<Omit<LineupRatingRow, 'id' | 'owner_id' | 'created_at'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/** 全局唯一的云客户端（Auth / Database / Storage / LLM 共用） */
export const cloud = createWorkBuddyCloud<CloudDatabase>({
  endpoint: publicConfig.endpoint,
  oauthRelayBaseUrl: publicConfig.oauthRelayBaseUrl,
  publishableKey: publicConfig.publishableKey,
});

/** 云端评分表名 */
export const RATINGS_TABLE = 'lineup_ratings';
