import { useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { StepProgress } from './components/StepProgress';
import { BanStep } from './components/BanStep';
import { ChessPlayerStep } from './components/ChessPlayerStep';
import { RecommendStep } from './components/RecommendStep';
import { SourcesPanel } from './components/SourcesPanel';
import { CodexPanel } from './components/CodexPanel';
import { ChangelogPage } from './components/ChangelogPage';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { useGameData } from './hooks/useGameData';
import { useFavorites } from './hooks/useFavorites';
import { useRatings } from './hooks/useRatings';
import { useAuth } from './hooks/useAuth';
import { recommendLineups } from './lib/recommend';

/**
 * 第一步「一键禁用」可操作的真实阵营（羁绊）。
 * 大河流域 / 逐鹿 / 三分之地 / 河洛 / 日落海 —— 这 5 个是本局可选禁用的经营阵营；
 * 「无阵营」本身不是可经营的羁绊，不参与一键禁用（仍可手动逐套禁用单卡）。
 */
const BANABLE_FACTIONS = [
  '大河流域',
  '逐鹿',
  '三分之地',
  '河洛',
  '日落海',
] as const;

/**
 * 应用根组件：管理三步向导状态并串联各步骤。
 */
export default function App() {
  const { data, status } = useGameData();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [bannedIds, setBannedIds] = useState<string[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [codexOpen, setCodexOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const auth = useAuth();
  const favorites = useFavorites(auth.signedIn);
  const ratings = useRatings(auth.signedIn);
  const [favOnly, setFavOnly] = useState(false);

  const player = data.chessPlayers.find((p) => p.id === playerId) ?? null;
  const scored = recommendLineups(data.lineups, bannedIds, player);

  const counts = data.database?.meta.counts;
  const stats = {
    heroes: counts?.heroes ?? 0,
    equipments: counts?.equipments ?? 0,
    effectCards: counts?.effectCards ?? 0,
    talents: counts?.talents ?? 0,
    lords: data.chessPlayers.length,
  };

  // 近期（30 天内）有非基线更新 → 顶栏显示「新」角标
  const hasNewUpdate = (() => {
    const list = (data.changelog ?? [])
      .filter((e) => !e.baseline)
      .sort((a, b) => b.date.localeCompare(a.date));
    const latest = list[0];
    if (!latest) return false;
    const days =
      (Date.now() - new Date(latest.date).getTime()) / (1000 * 60 * 60 * 24);
    return days <= 30;
  })();

  // 阵营一键禁用 / 启用：若该阵营全部已禁用则解除，否则全部禁用
  const toggleFaction = (faction: string) => {
    const inFaction = data.lineups
      .filter((l) => l.faction === faction)
      .map((l) => l.id);
    if (inFaction.length === 0) return;
    const allBanned = inFaction.every((id) => bannedIds.includes(id));
    setBannedIds((prev) => {
      if (allBanned) {
        return prev.filter((id) => !inFaction.includes(id));
      }
      return Array.from(new Set([...prev, ...inFaction]));
    });
  };

  const restart = () => {
    setStep(1);
    setBannedIds([]);
    setPlayerId(null);
    setFavOnly(false);
  };

  const factions = (data.database?.factions ?? [])
    .filter((f) => (BANABLE_FACTIONS as readonly string[]).includes(f.name))
    .map((f) => ({
      name: f.name,
      heroCount: f.heroCount,
    }));

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6">
        <Header
          onOpenSources={() => setSourcesOpen(true)}
          onOpenCodex={() => setCodexOpen(true)}
          onOpenChangelog={() => setChangelogOpen(true)}
          onOpenAuth={() => setAuthOpen(true)}
          status={status}
          hasNewUpdate={hasNewUpdate}
          authStatus={auth.status}
          user={auth.user}
        />

        <main className="flex-1 py-8">
          <Hero
            stats={stats}
            changelog={data.changelog}
            onOpenChangelog={() => setChangelogOpen(true)}
          />

          <StepProgress current={step} onStepClick={setStep} />

        <div className="mt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {step === 1 && (
                <BanStep
                  lineups={data.lineups}
                  factions={factions}
                  bannedIds={bannedIds}
                  onToggleFaction={toggleFaction}
                  onNext={() => setStep(2)}
                />
              )}

              {step === 2 && (
                <ChessPlayerStep
                  players={data.chessPlayers}
                  selectedId={playerId}
                  onSelect={setPlayerId}
                  onPrev={() => setStep(1)}
                  onNext={() => player && setStep(3)}
                />
              )}

              {step === 3 && player && (
                <RecommendStep
                  scored={scored}
                  bannedCount={bannedIds.length}
                  player={player}
                  onRestart={restart}
                  favoriteIds={favorites.ids}
                  onToggleFavorite={favorites.toggle}
                  favOnly={favOnly}
                  onToggleFavOnly={() => setFavOnly((v) => !v)}
                  database={data.database}
                  ratings={ratings.ratings}
                  onRate={ratings.rate}
                  ratingsSyncing={ratings.syncing}
                  ratingsCloudError={ratings.cloudError}
                  favoritesSyncing={favorites.syncing}
                  favoritesCloudError={favorites.cloudError}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Footer />

      <SourcesPanel
        open={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        lineups={data.lineups}
        players={data.chessPlayers}
      />

      <CodexPanel
        open={codexOpen}
        onClose={() => setCodexOpen(false)}
        database={data.database}
        chessPlayers={data.chessPlayers}
      />

      <ChangelogPage
        open={changelogOpen}
        onClose={() => setChangelogOpen(false)}
        changelog={data.changelog}
      />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSignedIn={() => setAuthOpen(false)}
      />
      </div>
    </MotionConfig>
  );
}
