import { memo } from "react"

// ── Piece SVGs ───────────────────────────────────────────────────────────────

export function XPiece() {
  return (
    <svg viewBox="0 0 100 100" style={{ width: "62%", height: "62%" }} aria-hidden>
      <line x1="18" y1="18" x2="82" y2="82" stroke="#a84b2a" strokeWidth="15" strokeLinecap="round" />
      <line x1="82" y1="18" x2="18" y2="82" stroke="#a84b2a" strokeWidth="15" strokeLinecap="round" />
    </svg>
  )
}

export function OPiece() {
  return (
    <svg viewBox="0 0 100 100" style={{ width: "62%", height: "62%" }} aria-hidden>
      <circle cx="50" cy="50" r="30" fill="none" stroke="#315a72" strokeWidth="13" strokeLinecap="round" />
    </svg>
  )
}

