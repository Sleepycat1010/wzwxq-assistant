/**
 * 页脚：说明数据来源与动态更新机制。
 */
export function Footer() {
  return (
    <footer className="mt-10 border-t border-white/5 pt-6 text-center text-xs text-text-dim">
      <p>
        数据来源：王者营地 · 玩一玩 · 王者攻略库(ima) · Bilibili 等公开攻略，
        编辑 <code className="font-mono text-gold/80">public/data/*.json</code> 即可动态更新，无需重新构建。
      </p>
      <p className="mt-2 text-text-dim/60">
        本站点为玩家自建辅助工具，攻略内容版权归原作者所有 · 棋手与图鉴数据来自官方接口
      </p>
    </footer>
  );
}
