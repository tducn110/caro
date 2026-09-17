import { useEffect, useState } from "react"
import { Trophy, X, Loader2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { WinkIntegration } from "../integrations/wink/types"

interface Props {
  wink: WinkIntegration
  onClose: () => void
}

export function LeaderboardModal({ wink, onClose }: Props) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    wink.refreshLeaderboard()
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [wink])

  const entries = wink.leaderboard
  const playerName = wink.displayName || t("player.you", "Bạn")
  const personalBestScore = wink.personalBest?.score ?? 0
  const personalBestRank = wink.personalBest?.rank ? `#${wink.personalBest.rank}` : "—"

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(48, 42, 35, 0.45)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "var(--paper-light)",
          borderRadius: 16,
          padding: "20px 18px",
          width: "100%",
          maxWidth: 340,
          maxHeight: "85vh",
          boxShadow: "var(--shadow-card)",
          border: "1.5px solid var(--paper-deep)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--divider)",
            paddingBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Trophy size={18} color="var(--x-color)" />
            <h2
              className="font-display"
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: "var(--ink)",
              }}
            >
              {t("leaderboard.title", "BẢNG XẾP HẠNG")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close", "Đóng")}
            className="paper-btn"
            style={{
              padding: 4,
              minWidth: "auto",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            minHeight: 180,
            maxHeight: 280,
          }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                gap: 8,
                color: "var(--ink-muted)",
              }}
            >
              <Loader2 className="animate-spin" size={22} color="var(--x-color)" />
              <span style={{ fontSize: 13 }}>{t("common.loading", "Đang tải...")}</span>
            </div>
          ) : entries.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
                color: "var(--ink-muted)",
                fontSize: 13,
              }}
            >
              {t("leaderboard.empty", "Chưa có điểm số nào")}
            </div>
          ) : (
            entries.map((entry, idx) => {
              const rank = entry.rank ?? idx + 1
              const isTop3 = rank <= 3
              return (
                <div
                  key={entry.id || `${rank}-${idx}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: "var(--radius)",
                    background: isTop3 ? "var(--paper)" : "rgba(255, 255, 255, 0.4)",
                    border: "1px solid var(--divider)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        width: 22,
                        textAlign: "center",
                        color: rank === 1 ? "#c27803" : rank === 2 ? "#6b7280" : rank === 3 ? "#b45309" : "var(--ink-muted)",
                      }}
                    >
                      {rank}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--ink)",
                      }}
                    >
                      {entry.displayName || t("player.anonymous", "Người chơi")}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--x-color)",
                    }}
                  >
                    {entry.score.toLocaleString("vi-VN")}
                  </span>
                </div>
              )
            })
          )}
        </div>

        {/* Current player summary */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            background: "var(--paper-deep)",
            borderRadius: "var(--radius)",
            border: "1px solid var(--paper-darker)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                background: "var(--x-color)",
                color: "#fff",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              {personalBestRank}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
              {playerName}
            </span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
            {personalBestScore.toLocaleString("vi-VN")}
          </span>
        </div>

        {/* Close button */}
        <button
          className="paper-btn"
          onClick={onClose}
          style={{
            width: "100%",
            justifyContent: "center",
            padding: "10px 0",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {t("common.close", "Đóng")}
        </button>
      </div>
    </div>
  )
}
