import { memo } from "react"
import { useTranslation } from "react-i18next"
import { XPiece, OPiece } from "./Piece"
import { Bot, UsersRound } from "lucide-react"
import type { Player } from "../game/core/types"
import type { GameMode } from "../game/behaviors/match/MatchState"

// ── Player Card ──────────────────────────────────────────────────────────────

export const PlayerCard = memo(function PlayerCard({
  label,
  piece,
  isActive,
  isAI,
  aiThinking,
}: {
  label: string
  piece: Player
  isActive: boolean
  isAI?: boolean
  aiThinking?: boolean
}) {
  const { t } = useTranslation()
  const borderColor = isActive
    ? piece === "X"
      ? "var(--x-color)"
      : "var(--o-color)"
    : "rgba(80,62,42,0.18)"
  const shadowActive = isActive
    ? piece === "X"
      ? "0 0 0 2px rgba(168,75,42,0.14), var(--shadow-card)"
      : "0 0 0 2px rgba(49,90,114,0.14), var(--shadow-card)"
    : "var(--shadow-paper)"

  return (
    <div
      className="paper-card p-4 flex flex-col gap-2"
      style={{
        border: `1px solid ${borderColor}`,
        boxShadow: shadowActive,
        transition: "border-color 150ms, box-shadow 150ms",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--ink-muted)",
          }}
        >
          {label}
        </span>
        {isActive && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "2px 8px",
              borderRadius: 999,
              background:
                piece === "X" ? "rgba(168,75,42,0.12)" : "rgba(49,90,114,0.12)",
              color: piece === "X" ? "var(--x-color)" : "var(--o-color)",
            }}
          >
            {aiThinking ? (
              <span style={{ display: "flex", gap: 2 }}>
                <span className="thinking-dot">•</span>
                <span className="thinking-dot">•</span>
                <span className="thinking-dot">•</span>
              </span>
            ) : (
              t("game.turn")
            )}
          </span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            background:
              piece === "X" ? "rgba(168,75,42,0.10)" : "rgba(49,90,114,0.10)",
          }}
        >
          {isAI ? (
            <Bot size={17} style={{ color: "var(--o-color)" }} />
          ) : (
            <UsersRound
              size={17}
              style={{
                color: piece === "X" ? "var(--x-color)" : "var(--o-color)",
              }}
            />
          )}
        </div>
        <div>
          <div
            className="font-display"
            style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: piece === "X" ? "var(--x-color)" : "var(--o-color)",
            }}
          >
            {piece === "X" ? `× ${t("game.pieceX")}` : `○ ${t("game.pieceO")}`}
          </div>
        </div>
      </div>
    </div>
  )
})

// ── Compact Mobile Player Bar ────────────────────────────────────────────────

export const MobilePlayerBar = memo(function MobilePlayerBar({
  mode,
  currentPlayer,
  isGameOver,
  elapsed,
}: {
  mode: GameMode
  currentPlayer: Player
  isGameOver: boolean
  elapsed?: number
}) {
  const { t } = useTranslation()
  const p1label = mode === "ai" ? t("game.you") : t("game.player", { number: 1 })
  const p2label = mode === "ai" ? t("game.machine") : t("game.player", { number: 2 })
  const activeX = !isGameOver && currentPlayer === "X"
  const activeO = !isGameOver && currentPlayer === "O"

  return (
    <div
      className="paper-card mx-3 flex items-center gap-1"
      style={{ padding: "6px 10px", borderRadius: "var(--radius-sm)" }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "5px 8px",
          borderRadius: 6,
          background: activeX ? "rgba(168,75,42,0.10)" : "transparent",
          borderLeft: activeX
            ? "3px solid var(--x-color)"
            : "3px solid transparent",
          transition: "background 120ms",
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <XPiece />
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{ fontSize: 10, fontWeight: 700, color: "var(--x-color)" }}
          >
            X
          </div>
          <div
            style={{
              fontSize: 9,
              color: "var(--ink-muted)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {p1label}
          </div>
        </div>
        {activeX && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.05em",
              padding: "1px 5px",
              borderRadius: 4,
              background: "rgba(168,75,42,0.12)",
              color: "var(--x-color)",
            }}
          >
            ↩
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          flexShrink: 0,
          padding: "0 6px",
        }}
      >
        <span
          className="font-display"
          style={{
            fontSize: 11,
            color: "var(--ink-muted)",
            fontWeight: 700,
          }}
        >
          VS
        </span>
        {elapsed !== undefined && (
          <span
            style={{
              fontSize: 10,
              fontFamily: "monospace",
              color: "var(--ink-muted)",
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            {`${Math.floor(elapsed / 60).toString().padStart(2, "0")}:${(elapsed % 60).toString().padStart(2, "0")}`}
          </span>
        )}
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          flexDirection: "row-reverse",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 6,
          background: activeO ? "rgba(49,90,114,0.10)" : "transparent",
          borderRight: activeO
            ? "3px solid var(--o-color)"
            : "3px solid transparent",
          transition: "background 120ms",
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <OPiece />
        </div>
        <div style={{ minWidth: 0, textAlign: "right" }}>
          <div
            style={{ fontSize: 10, fontWeight: 700, color: "var(--o-color)" }}
          >
            O
          </div>
          <div
            style={{
              fontSize: 9,
              color: "var(--ink-muted)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {p2label}
          </div>
        </div>
        {activeO && (
          <span
            style={{
              marginRight: "auto",
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.05em",
              padding: "1px 5px",
              borderRadius: 4,
              background: "rgba(49,90,114,0.12)",
              color: "var(--o-color)",
            }}
          >
            ↩
          </span>
        )}
      </div>
    </div>
  )
})
