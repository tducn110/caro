import { memo } from "react"
import { useTranslation } from "react-i18next"
import { UsersRound, Grid3X3, Clock3, History } from "lucide-react"
import type { Move } from "../game/core/types"
import type { GameMode } from "../game/behaviors/match/MatchState"

function formatTime(s: number) {
  return `${Math.floor(s / 60)
    .toString()
    .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`
}

// ── Info Card ────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ color: "var(--ink-muted)", flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 10, color: "var(--ink-muted)" }}>{label}</span>
      <span
        style={{
          marginLeft: "auto",
          fontSize: 11,
          fontWeight: 700,
          fontFamily: mono ? "monospace" : undefined,
          color: "var(--ink)",
        }}
      >
        {value}
      </span>
    </div>
  )
}

export const InfoCard = memo(function InfoCard({
  mode,
  elapsed,
  compact,
}: {
  mode: GameMode
  elapsed: number
  compact?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div
      className="paper-card"
      style={{
        padding: 12,
        display: "flex",
        flexDirection: compact ? "row" : "column",
        gap: compact ? 16 : 8,
      }}
    >
      {!compact && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--ink-muted)",
            paddingBottom: 6,
            borderBottom: "1px solid var(--divider)",
          }}
        >
          {t("game.info")}
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: compact ? "row" : "column",
          gap: compact ? 16 : 8,
          flex: 1,
        }}
      >
        <InfoRow
          icon={<UsersRound size={12} />}
          label={t("game.mode")}
          value={mode === "1v1" ? "1v1" : t("game.modeAi")}
        />
        <InfoRow
          icon={<Grid3X3 size={12} />}
          label={t("game.size")}
          value={t("game.boardSize")}
        />
        <InfoRow
          icon={<Clock3 size={12} />}
          label={t("game.time")}
          value={formatTime(elapsed)}
          mono
        />
      </div>
    </div>
  )
})

// ── History Panel ────────────────────────────────────────────────────────────

export const HistoryPanel = memo(function HistoryPanel({
  history,
  compact,
}: {
  history: Move[]
  compact?: boolean
}) {
  const { t } = useTranslation()
  const recent = [...history].reverse().slice(0, compact ? 4 : 22)

  return (
    <div
      className="paper-card"
      style={{
        padding: 12,
        flex: compact ? undefined : "1 1 0",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--ink-muted)",
          paddingBottom: 6,
          marginBottom: 4,
          borderBottom: "1px solid var(--divider)",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <History size={11} />
        {t("game.moveHistory")}
      </div>
      <div style={{ overflowY: "auto", maxHeight: compact ? 60 : 220 }}>
        {recent.length === 0 ? (
          <div
            style={{
              fontSize: 10,
              padding: "4px 0",
              color: "var(--ink-faint)",
            }}
          >
            {t("game.noMoves")}
          </div>
        ) : (
          recent.map((m) => (
            <div
              key={m.index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "2px 0",
                fontSize: 11,
                color: "var(--ink-muted)",
              }}
            >
              <span
                style={{
                  width: 20,
                  textAlign: "right",
                  fontSize: 10,
                  color: "var(--ink-faint)",
                }}
              >
                {m.index}.
              </span>
              <span
                style={{
                  fontWeight: 700,
                  width: 12,
                  color: m.player === "X" ? "var(--x-color)" : "var(--o-color)",
                }}
              >
                {m.player}
              </span>
              <span style={{ fontFamily: "monospace", fontSize: 10 }}>
                ({m.cell.col + 1},{m.cell.row + 1})
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
})
