import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  ArrowLeft,
  Bot,
  Globe,
  LogOut,
  RotateCcw,
  SquarePlus,
  Trophy,
  UsersRound,
} from "lucide-react"
import { LeaderboardModal } from "./components/LeaderboardModal"
import { useTranslation } from "react-i18next"
import type { GameMode } from "./game/behaviors/match/MatchState"
import { GameController } from "./app/GameController"
import { CaroGameCanvas } from "./pixi/CaroGameCanvas"
import { MobilePlayerBar } from "./components/Player"
import { WinBanner } from "./components/WinBanner"
import { InfoCard } from "./components/Info"
import type { BotDifficulty } from "./game/ai/contracts"
import { useWinkIntegration } from "./integrations/wink/useWinkIntegration"
import { preloadCriticalResources, preloadNonCriticalResources } from "./utils/game-loader";
import { completeGameLoading, onGameLoadingDismiss, setGameLoadingProgress } from "./utils/loading-controller";


// ── Main App ─────────────────────────────────────────────────────────────────

const AI_DIFFICULTIES: readonly BotDifficulty[] = ["easy", "normal", "hard", "expert"]

export default function App() {
  const { t, i18n } = useTranslation()
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const wink = useWinkIntegration()

  // Unified PapaStudio loading screen lifecycle barrier
  useEffect(() => {
    setGameLoadingProgress(25);
    const criticalPromise = preloadCriticalResources((pct) => {
      setGameLoadingProgress(Math.min(95, pct));
    });
    const winkPromise = wink.readyPromise ?? Promise.resolve(null);
    void Promise.allSettled([criticalPromise, winkPromise]).then(() => {
      completeGameLoading();
    });
    const unbind = onGameLoadingDismiss(() => {
      preloadNonCriticalResources();
    });
    return unbind;
  }, [wink.readyPromise]);

  const roundStartedRef = useRef(false)
  const controllerRef = useRef<GameController | null>(null)
  if (!controllerRef.current) controllerRef.current = new GameController()
  const controller = controllerRef.current
  const snapshot = useSyncExternalStore(
    controller.subscribe.bind(controller),
    () => controller.snapshot(),
    () => controller.snapshot(),
  )
  useEffect(() => () => controller.destroy(), [controller])

  // Propagate host pause to controller
  useEffect(() => {
    controller.setPaused(wink.hostPaused)
  }, [controller, wink.hostPaused])

  const history = snapshot.history
  const currentPlayer = snapshot.currentPlayer
  const mode = snapshot.match.mode
  const winner = snapshot.match.winner
  const aiThinking = snapshot.aiThinking
  const difficulty = snapshot.match.difficulty
  const gameStarted = history.length > 0
  const isDraw = snapshot.match.isDraw

  const isGameOver = !!winner
  const lastMove = history.length > 0 ? history[history.length - 1].cell : null

  // Start round on first stone placed
  useEffect(() => {
    if (gameStarted && !roundStartedRef.current && !isGameOver && !isDraw) {
      wink.gameplayStart()
      roundStartedRef.current = true
    }
  }, [gameStarted, isGameOver, isDraw, wink])

  // Stop round and submit score on game over or draw
  useEffect(() => {
    if ((isGameOver || isDraw) && roundStartedRef.current) {
      wink.gameplayStop()
      roundStartedRef.current = false
      const score = winner?.winner === "X" ? 1000 : (isDraw ? 200 : 50)
      wink.submitFinalScore({ score })
    }
  }, [isGameOver, isDraw, winner, wink])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roundStartedRef.current) {
        wink.gameplayStop()
        roundStartedRef.current = false
      }
    }
  }, [wink])

  const winCellSet = useMemo(() => {
    if (!winner) return new Set<string>()
    return new Set(winner.cells.map(({ row, col }) => `${row},${col}`))
  }, [winner])

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (wink.hostPaused) return
      controller.playCell({ row, col })
    },
    [controller, wink.hostPaused],
  )

  const handleReplay = useCallback(() => {
    if (roundStartedRef.current) {
      wink.gameplayStop()
      roundStartedRef.current = false
    }
    controller.replay()
  }, [controller, wink])

  const handleNewGame = useCallback((newMode?: GameMode) => {
    if (roundStartedRef.current) {
      wink.gameplayStop()
      roundStartedRef.current = false
    }
    if (newMode) controller.setMode(newMode)
    else controller.newGame()
  }, [controller, wink])

  const currentLanguage = i18n.resolvedLanguage?.startsWith("en") ? "en" : "vi"
  const nextLanguage = currentLanguage === "vi" ? "en" : "vi"

  const [displayElapsed, setDisplayElapsed] = useState(0)
  useEffect(() => {
    if (!gameStarted || isGameOver || wink.hostPaused) return
    const id = setInterval(() => setDisplayElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [gameStarted, isGameOver, wink.hostPaused])
  useEffect(() => {
    if (!gameStarted) setDisplayElapsed(0)
  }, [gameStarted])

  return (
    <div
      className="caro-app-shell"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        maxHeight: "100dvh",
        maxWidth: 1400,
        margin: "0 auto",
        position: "relative",
        overflow: "hidden",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Coffee ring decorations – purely decorative, pointer-events: none */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -35,
          right: 60,
          width: 110,
          height: 110,
          borderRadius: "50%",
          border: "2px solid rgba(160,120,65,0.13)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -20,
          right: 85,
          width: 70,
          height: 70,
          borderRadius: "50%",
          border: "1.5px solid rgba(160,120,65,0.09)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 40,
          left: 16,
          width: 65,
          height: 65,
          borderRadius: "50%",
          border: "1.5px solid rgba(160,120,65,0.10)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ── Header ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px 4px",
          position: "relative",
          zIndex: 1,
          flexShrink: 0,
        }}
      >
        <button
          className="paper-btn"
          style={{ padding: "6px 12px", fontSize: 12 }}
          aria-label={t("common.back")}
        >
          <ArrowLeft size={14} />
          <span style={{ display: "none" }} className="sm-inline">
            {t("common.back")}
          </span>
        </button>

        <div style={{ textAlign: "center" }}>
          <h1
            className="font-display"
            style={{
              fontWeight: 700,
              fontSize: "clamp(18px, 4vw, 26px)",
              lineHeight: 1,
              letterSpacing: "0.04em",
              color: "var(--ink)",
              margin: 0,
            }}
          >
            {t("game.title")}
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            className="paper-btn"
            style={{ padding: "6px 10px", fontSize: 12 }}
            aria-label={t("leaderboard.title", "Bảng xếp hạng")}
            onClick={() => setShowLeaderboard(true)}
          >
            <Trophy size={14} color="var(--x-color)" />
          </button>

          <button
            className="paper-btn"
            style={{ padding: "6px 10px", fontSize: 12 }}
            aria-label={t("settings.language")}
            onClick={() => void i18n.changeLanguage(nextLanguage)}
          >
            <Globe size={14} />
            <span>{nextLanguage.toUpperCase()}</span>
          </button>
        </div>
      </header>

      {/* ── Mode Tabs ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          padding: "2px 16px 4px",
          borderBottom: "1px solid var(--divider)",
          position: "relative",
          zIndex: 1,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: 4 }}>
          {(["1v1", "ai"] as GameMode[]).map((m) => (
            <button
              key={m}
              className={`mode-tab ${mode === m ? "active" : "inactive"}`}
              onClick={() => handleNewGame(m)}
              aria-pressed={mode === m}
            >
              {m === "1v1" ? <UsersRound size={14} /> : <Bot size={14} />}
              <span>{m === "1v1" ? "1v1" : t("game.modeAi")}</span>
            </button>
          ))}
        </div>
        {mode === "ai" && (
          <div className="difficulty-picker" role="group" aria-label={t("game.difficulty")}>
            {AI_DIFFICULTIES.map((level) => (
              <button
                key={level}
                type="button"
                className={`difficulty-button ${difficulty === level ? "selected" : ""}`}
                aria-pressed={difficulty === level}
                onClick={() => controller.setDifficulty(level)}
              >
                {t(`game.difficulty${level.charAt(0).toUpperCase()}${level.slice(1)}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Mobile player bar ── */}
      <div
        style={{
          display: "block",
          marginTop: 4,
          marginBottom: 2,
          position: "relative",
          zIndex: 1,
          flexShrink: 0,
        }}
      >
        <MobilePlayerBar
          mode={mode}
          currentPlayer={currentPlayer}
          isGameOver={isGameOver}
          elapsed={displayElapsed}
        />
      </div>

      {/* ── Main content ── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          padding: "4px 8px",
          position: "relative",
          zIndex: 1,
          overflow: "hidden",
        }}
        className="main-layout"
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
            minHeight: 0,
          }}
          className="mobile-board"
        >
          <CaroGameCanvas
            board={snapshot.board}
            lastMove={lastMove}
            winCellSet={winCellSet}
            onCellClick={handleCellClick}
            paused={wink.hostPaused}
          />
        </div>
        <div
          className="mobile-info"
          style={{ display: "none" }}
        >
          <InfoCard mode={mode} elapsed={displayElapsed} compact />
        </div>
      </main>

      {/* ── Win Banner ── */}
      <div style={{ padding: "0 12px 4px", position: "relative", zIndex: 1, flexShrink: 0 }}>
        <WinBanner
          winner={winner}
          mode={mode}
          isDraw={isDraw}
          onReplay={handleReplay}
          onNewGame={handleNewGame}
        />
      </div>

      {/* ── Footer actions ── */}
      <footer
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          padding: "4px 16px 10px",
          position: "relative",
          zIndex: 1,
          flexShrink: 0,
        }}
      >
        {!isGameOver && (
          <>
            <button
              className="paper-btn"
              onClick={handleReplay}
              aria-label={t("common.retry")}
            >
              <RotateCcw size={13} />
              <span>{t("common.retry")}</span>
            </button>
            <button
              className="paper-btn primary"
              onClick={() => handleNewGame()}
              aria-label={t("common.play")}
            >
              <SquarePlus size={13} />
              <span>{t("common.play")}</span>
            </button>
          </>
        )}
        <button className="paper-btn danger" aria-label={t("common.close")}>
          <LogOut size={13} />
          <span>{t("common.close")}</span>
        </button>
      </footer>

      {showLeaderboard && (
        <LeaderboardModal wink={wink} onClose={() => setShowLeaderboard(false)} />
      )}
    </div>
  )
}