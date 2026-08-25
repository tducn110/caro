import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, Bot, LogOut, RotateCcw, SquarePlus, UsersRound } from "lucide-react"
import { GameState } from "./game/state"
import { checkWinner } from "./game/rules"
import { GameMode, WinResult, Player } from "./game/types"
import { GomokuEngine } from "./game/bot"
import { CaroGameCanvas } from "./pixi/CaroGameCanvas"
import { MobilePlayerBar } from "./components/Player"
import { WinBanner } from "./components/WinBanner"
import { InfoCard } from "./components/Info"

// ── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const gameStateRef = useRef(new GameState())
  const [renderTick, setRenderTick] = useState(0)
  
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X")
  const [mode, setMode] = useState<GameMode>("1v1")
  const [winner, setWinner] = useState<WinResult | null>(null)
  const [aiThinking, setAiThinking] = useState(false)
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard" | "expert">("normal");
  
  const botEngineRef = useRef<GomokuEngine | null>(null);

  useEffect(() => {
    botEngineRef.current = new GomokuEngine(25); // 25x25 local AI board
    return () => {
      botEngineRef.current?.destroy();
    }
  }, []);

  const gameState = gameStateRef.current;
  const history = gameState.history;
  const gameStarted = history.length > 0;
  
  const isDraw = false; 

  const lastMove = history.length > 0 ? [history[history.length - 1].row, history[history.length - 1].col] as [number, number] : null;

  const winCellSet = useMemo(() => {
    if (!winner) return new Set<string>()
    return new Set(winner.cells.map(([r, c]) => `${r},${c}`))
  }, [winner])

  const forceRender = () => setRenderTick(t => t + 1);

  const placeMove = useCallback((row: number, col: number, isAI = false) => {
    if (winner || (aiThinking && !isAI)) return;
    const player: Player = isAI ? "O" : currentPlayer;
    
    if (gameStateRef.current.makeMove(row, col, player)) {
      const result = checkWinner(gameStateRef.current, row, col)
      if (result) {
        setWinner(result)
        setAiThinking(false)
      } else {
        const nextPlayer = player === "X" ? "O" : "X";
        setCurrentPlayer(nextPlayer)
        
        if (mode === "ai" && nextPlayer === "O") {
          setAiThinking(true);
        } else {
          setAiThinking(false);
        }
      }
      forceRender()
    }
  }, [currentPlayer, winner, aiThinking, mode])

  useEffect(() => {
    if (mode === "ai" && currentPlayer === "O" && aiThinking && !winner) {
      // AI turn
      const engine = botEngineRef.current;
      if (engine) {
        const turnCount = gameStateRef.current.history.length;
        engine.findBestMove(gameStateRef.current, { timeMs: 500, maxDepth: 64, difficulty }).then((move) => {
          if (move && gameStateRef.current.history.length === turnCount) {
            placeMove(move.row, move.col, true);
          }
        });
      }
    }
  }, [mode, currentPlayer, aiThinking, winner, difficulty, placeMove]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (winner || aiThinking) return
      if (mode === "ai" && currentPlayer === "O") return
      placeMove(row, col)
    },
    [winner, aiThinking, mode, currentPlayer, placeMove],
  )

  const handleReplay = useCallback(() => {
    gameStateRef.current.reset()
    setCurrentPlayer("X")
    setWinner(null)
    setAiThinking(false)
    forceRender()
  }, [])

  const handleNewGame = useCallback(
    (newMode?: GameMode) => {
      handleReplay()
      if (newMode) setMode(newMode)
    },
    [handleReplay],
  )

  const isGameOver = !!winner
  const p1label = mode === "ai" ? "Bạn" : "Người chơi 1"
  const p2label = mode === "ai" ? "Máy" : "Người chơi 2"

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
      style={{ display: "flex", flexDirection: "column", minHeight: "100%", maxWidth: 1400, margin: "0 auto", position: "relative", overflow: "hidden" }}
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
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 8px", position: "relative", zIndex: 1 }}>
        <button className="paper-btn" style={{ padding: "6px 12px", fontSize: 12 }} aria-label="Quay lại">
          <ArrowLeft size={14} />
          <span style={{ display: "none" }} className="sm-inline">Quay lại</span>
        </button>

        <div style={{ textAlign: "center" }}>
          <h1 className="font-display" style={{ fontWeight: 700, fontSize: "clamp(18px, 4vw, 26px)", lineHeight: 1, letterSpacing: "0.04em", color: "var(--ink)", margin: 0 }}>
            Cờ Caro
          </h1>
        </div>

        <div style={{ width: 80 }} />
      </header>

      {/* ── Mode Tabs ── */}
      <div style={{ display: "flex", justifyContent: "center", padding: "0 16px", borderBottom: "1px solid var(--divider)", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {(["1v1", "ai"] as GameMode[]).map((m) => (
            <button
              key={m}
              className={`mode-tab ${mode === m ? "active" : "inactive"}`}
              onClick={() => handleNewGame(m)}
              aria-pressed={mode === m}
            >
              {m === "1v1" ? <UsersRound size={14} /> : <Bot size={14} />}
              <span>{m === "1v1" ? "1v1" : "Đấu máy"}</span>
            </button>
          ))}
        </div>
        {mode === "ai" && (
          <div style={{ marginLeft: 16, display: "flex", alignItems: "center" }}>
            <select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value as any);
                handleNewGame();
              }}
              style={{
                padding: "4px 8px",
                borderRadius: 4,
                border: "1px solid var(--divider)",
                background: "var(--paper)",
                color: "var(--ink)",
                fontSize: 13,
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="easy">Dễ (Easy)</option>
              <option value="normal">Trung bình (Normal)</option>
              <option value="hard">Khó (Hard)</option>
              <option value="expert">Chuyên gia (Expert)</option>
            </select>
          </div>
        )}
      </div>

      {/* ── Mobile player bar ── */}
      <div style={{ display: "block", marginTop: 12, position: "relative", zIndex: 1 }}>
        <MobilePlayerBar mode={mode} currentPlayer={currentPlayer} isGameOver={isGameOver} />
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
        <div style={{ flex: 1, display: "flex", justifyContent: "center", width: "100%", minHeight: 350 }} className="mobile-board">
          <CaroGameCanvas
            gameState={gameState}
            lastMove={lastMove}
            winCellSet={winCellSet}
            onCellClick={handleCellClick}
          />
        </div>
        <div className="mobile-info" style={{ display: "flex", gap: 8, flexDirection: "column" }}>
          <InfoCard mode={mode} elapsed={displayElapsed} compact />
        </div>
      </main>

      {/* ── Win Banner ── */}
      <div style={{ padding: "0 12px 8px", position: "relative", zIndex: 1 }}>
        <WinBanner winner={winner} mode={mode} isDraw={isDraw} onReplay={handleReplay} onNewGame={handleNewGame} />
      </div>

      {/* ── Footer actions ── */}
      <footer style={{ display: "flex", justifyContent: "center", gap: 8, padding: "4px 16px 16px", position: "relative", zIndex: 1 }}>
        {!isGameOver && (
          <>
            <button className="paper-btn" onClick={handleReplay} aria-label="Chơi lại">
              <RotateCcw size={13} />
              <span>Chơi lại</span>
            </button>
            <button className="paper-btn primary" onClick={() => handleNewGame()} aria-label="Ván mới">
              <SquarePlus size={13} />
              <span>Ván mới</span>
            </button>
          </>
        )}
        <button className="paper-btn danger" aria-label="Thoát">
          <LogOut size={13} />
          <span>Thoát</span>
        </button>
      </footer>
    </div>
  )
}
