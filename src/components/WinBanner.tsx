import { memo } from "react"
import { useTranslation } from "react-i18next"
import { RotateCcw, SquarePlus } from "lucide-react"
import type { WinResult } from "../game/core/types"
import type { GameMode } from "../game/behaviors/match/MatchState"

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
  const { t } = useTranslation()
  if (!winner && !isDraw) return null

  let title = t("game.draw")
  let sub = t("game.boardFull")
  let color = "var(--ink-muted)"

  if (winner) {
    if (mode === "ai") {
      title = winner.winner === "X" ? t("game.youWin") : t("game.machineWin")
    } else {
      title =
        winner.winner === "X"
          ? t("game.playerWin", { number: 1 })
          : t("game.playerWin", { number: 2 })
    }
    sub = t("game.fiveInRow")
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
        <div
          className="font-display"
          style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.2, color }}
        >
          {title}
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 2 }}>
          {sub}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="paper-btn" onClick={onReplay} aria-label={t("common.retry")}>
          <RotateCcw size={13} />
          <span>{t("common.retry")}</span>
        </button>
        <button
          className="paper-btn primary"
          onClick={onNewGame}
          aria-label={t("common.play")}
        >
          <SquarePlus size={13} />
          <span>{t("common.play")}</span>
        </button>
      </div>
    </div>
  )
}
