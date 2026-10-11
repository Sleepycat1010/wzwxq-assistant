import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './components/Header';
import { StepProgress } from './components/StepProgress';
import { BanStep } from './components/BanStep';
import { ChessPlayerStep } from './components/ChessPlayerStep';
import { RecommendStep } from './components/RecommendStep';
import { SourcesPanel } from './components/SourcesPanel';
import { CodexPanel } from './components/CodexPanel';
import { Footer } from './components/Footer';
import { useGameData } from './hooks/useGameData';
import { useFavorites } from './hooks/useFavorites';
import { recommendLineups } from './lib/recommend';

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
  const favorites = useFavorites();
  const [favOnly, setFavOnly] = useState(false);

  const player = data.chessPlayers.find((p) => p.id === playerId) ?? null;
  const scored = recommendLineups(data.lineups, bannedIds, player);

  const toggleBan = (id: string) =>
    setBannedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

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

  const factions = (data.database?.factions ?? []).map((f) => ({
    name: f.name,
    heroCount: f.heroCount,
  }));

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6">
      <Header
        onOpenSources={() => setSourcesOpen(true)}
        onOpenCodex={() => setCodexOpen(true)}
        status={status}
      />

      <main className="flex-1 py-8">
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
                  onToggleBan={toggleBan}
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
      />
    </div>
  );
}
