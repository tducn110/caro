import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  ArrowLeft,
  Bot,
  Globe,
  LogOut,
  RotateCcw,
  SquarePlus,
  UsersRound,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import type { GameMode } from "./game/behaviors/match/MatchState"
import { GameController } from "./app/GameController"
import { CaroGameCanvas } from "./pixi/CaroGameCanvas"
import { MobilePlayerBar } from "./components/Player"
import { WinBanner } from "./components/WinBanner"
import { InfoCard } from "./components/Info"

// ── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const { t, i18n } = useTranslation()
  const controllerRef = useRef<GameController | null>(null)
  if (!controllerRef.current) controllerRef.current = new GameController()
  const controller = controllerRef.current
  const snapshot = useSyncExternalStore(
    controller.subscribe.bind(controller),
    () => controller.snapshot(),
    () => controller.snapshot(),
  )
  useEffect(() => () => controller.destroy(), [controller])

  const history = snapshot.history
  const currentPlayer = snapshot.currentPlayer
  const mode = snapshot.match.mode
  const winner = snapshot.match.winner
  const aiThinking = snapshot.aiThinking
  const difficulty = snapshot.match.difficulty
  const gameStarted = history.length > 0
  const isDraw = false

  const lastMove = history.length > 0 ? history[history.length - 1].cell : null

  const winCellSet = useMemo(() => {
    if (!winner) return new Set<string>()
    return new Set(winner.cells.map(({ row, col }) => `${row},${col}`))
  }, [winner])

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      controller.playCell({ row, col })
    },
    [controller],
  )

  const handleReplay = useCallback(() => controller.replay(), [controller])

  const handleNewGame = useCallback((newMode?: GameMode) => {
    if (newMode) controller.setMode(newMode)
    else controller.newGame()
  }, [controller])

  const isGameOver = !!winner
  const currentLanguage = i18n.resolvedLanguage?.startsWith("en") ? "en" : "vi"
  const nextLanguage = currentLanguage === "vi" ? "en" : "vi"

  const [displayElapsed, setDisplayElapsed] = useState(0)
  useEffect(() => {
    if (!gameStarted || isGameOver) return
    const id = setInterval(() => setDisplayElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [gameStarted, isGameOver])
  useEffect(() => {
    if (!gameStarted) setDisplayElapsed(0)
  }, [gameStarted])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
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
          padding: "16px 16px 8px",
          position: "relative",
          zIndex: 1,
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

        <button
          className="paper-btn"
          style={{ padding: "6px 10px", fontSize: 12 }}
          aria-label={t("settings.language")}
          onClick={() => void i18n.changeLanguage(nextLanguage)}
        >
          <Globe size={14} />
          <span>{nextLanguage.toUpperCase()}</span>
        </button>
      </header>

      {/* ── Mode Tabs ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "0 16px",
          borderBottom: "1px solid var(--divider)",
          position: "relative",
          zIndex: 1,
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
          <div
            style={{ marginLeft: 16, display: "flex", alignItems: "center" }}
          >
            <select
              value={difficulty}
              onChange={(e) => {
                controller.setDifficulty(e.target.value as "easy" | "normal" | "hard" | "expert")
              }}
              style={{
                padding: "4px 8px",
                borderRadius: 4,
                border: "1px solid var(--divider)",
                background: "var(--paper)",
                color: "var(--ink)",
                fontSize: 13,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="easy">{t("game.difficultyEasy")}</option>
              <option value="normal">{t("game.difficultyNormal")}</option>
              <option value="hard">{t("game.difficultyHard")}</option>
              <option value="expert">{t("game.difficultyExpert")}</option>
            </select>
          </div>
        )}
      </div>

      {/* ── Mobile player bar ── */}
      <div
        style={{
          display: "block",
          marginTop: 12,
          position: "relative",
          zIndex: 1,
        }}
      >
        <MobilePlayerBar
          mode={mode}
          currentPlayer={currentPlayer}
          isGameOver={isGameOver}
        />
      </div>

      {/* ── Main content ── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "12px 12px 8px",
          position: "relative",
          zIndex: 1,
        }}
        className="main-layout"
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            width: "100%",
            minHeight: 350,
          }}
          className="mobile-board"
        >
          <CaroGameCanvas
            board={snapshot.board}
            lastMove={lastMove}
            winCellSet={winCellSet}
            onCellClick={handleCellClick}
          />
        </div>
        <div
          className="mobile-info"
          style={{ display: "flex", gap: 8, flexDirection: "column" }}
        >
          <InfoCard mode={mode} elapsed={displayElapsed} compact />
        </div>
      </main>

      {/* ── Win Banner ── */}
      <div style={{ padding: "0 12px 8px", position: "relative", zIndex: 1 }}>
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
          padding: "4px 16px 16px",
          position: "relative",
          zIndex: 1,
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
    </div>
  )
}
