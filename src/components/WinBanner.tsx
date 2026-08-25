import { memo } from "react"
import { RotateCcw, SquarePlus } from "lucide-react"
import { type WinResult, type GameMode } from "../game/types"

// ── Win Banner ───────────────────────────────────────────────────────────────

export function WinBanner({
  winner,
  mode,
  isDraw,
  onReplay,
  onNewGame,
}: {
  winner: WinResult | null
  mode: GameMode
  isDraw: boolean
  onReplay: () => void
  onNewGame: () => void
}) {
  if (!winner && !isDraw) return null

  let title = "Hòa!"
  let sub = "Bàn cờ đã kín"
  let color = "var(--ink-muted)"

  if (winner) {
    if (mode === "ai") {
      title = winner.winner === "X" ? "Bạn thắng!" : "Máy thắng!"
    } else {
      title = winner.winner === "X" ? "Người chơi 1 thắng!" : "Người chơi 2 thắng!"
    }
    sub = "5 quân liên tiếp"
    color = winner.winner === "X" ? "var(--x-color)" : "var(--o-color)"
  }

  return (
    <div
      className="win-banner paper-card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "12px 20px",
        maxWidth: 480,
        margin: "0 auto",
        borderTop: `3px solid ${color}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="font-display" style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.2, color }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="paper-btn" onClick={onReplay} aria-label="Chơi lại">
          <RotateCcw size={13} />
          <span>Chơi lại</span>
        </button>
        <button className="paper-btn primary" onClick={onNewGame} aria-label="Ván mới">
          <SquarePlus size={13} />
          <span>Ván mới</span>
        </button>
      </div>
    </div>
  )
}

