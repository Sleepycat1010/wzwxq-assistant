/**
 * 轻量 className 合并工具（无需引入额外依赖）。
 * 过滤掉 falsy 值并用空格连接，便于条件化拼接 Tailwind 类名。
 */
export type ClassValue = string | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}
