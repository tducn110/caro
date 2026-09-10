import { describe, it, expect, beforeEach } from "vitest";
import { GameState } from "../../src/game/core/GameState";
import { FreestyleGomokuWinRule } from "../../src/game/core/WinRules";
import { playMove } from "../../src/game/behaviors/move/PlayMove";

describe("GameState & Rules Core", () => {
  let state: GameState;
  const winRule = new FreestyleGomokuWinRule();

  beforeEach(() => {
    state = new GameState();
  });

  it("board coordinate storage: accepts cells within the fixed 15 by 15 board", () => {
    playMove(state, winRule, { player: "X", cell: { row: 0, col: 0 } });
    playMove(state, winRule, { player: "O", cell: { row: 14, col: 14 } });

    expect(state.get({ row: 0, col: 0 })).toBe("X");
    expect(state.get({ row: 14, col: 14 })).toBe("O");
    expect(state.get({ row: 1, col: 1 })).toBeNull(); // Empty cell
  });

  it("rejects cells outside the fixed 15 by 15 board", () => {
    expect(playMove(state, winRule, { player: "X", cell: { row: -1, col: 0 } })).toEqual({ type: "rejected", reason: "out-of-bounds" });
    expect(playMove(state, winRule, { player: "X", cell: { row: 0, col: 15 } })).toEqual({ type: "rejected", reason: "out-of-bounds" });
    expect(state.moveCount).toBe(0);
  });

  it("make move: successfully records history and updates bounds", () => {
    playMove(state, winRule, { player: "X", cell: { row: 0, col: 0 } });
    expect(state.getHistory().length).toBe(1);
    expect(state.getHistory()[0]).toEqual({ player: "X", cell: { row: 0, col: 0 }, index: 1 });
    expect(state.occupiedBounds).toEqual({ minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 });

    playMove(state, winRule, { player: "O", cell: { row: 5, col: 5 } });
    expect(state.getHistory().length).toBe(2);
    expect(state.occupiedBounds).toEqual({ minRow: 0, maxRow: 5, minCol: 0, maxCol: 5 });
  });

  it("make move: occupied cell rejection", () => {
    const result1 = playMove(state, winRule, { player: "X", cell: { row: 0, col: 0 } });
    const result2 = playMove(state, winRule, { player: "O", cell: { row: 0, col: 0 } }); // Reject

    expect(result1.type).toBe("accepted");
    expect(result2.type).toBe("rejected");
    expect(state.get({ row: 0, col: 0 })).toBe("X");
    expect(state.getHistory().length).toBe(1);
  });

  it("win detection: correctly identifies 5 in a row horizontally", () => {
    playMove(state, winRule, { player: "X", cell: { row: 0, col: 0 } });
    playMove(state, winRule, { player: "O", cell: { row: 1, col: 0 } });
    playMove(state, winRule, { player: "X", cell: { row: 0, col: 1 } });
    playMove(state, winRule, { player: "O", cell: { row: 1, col: 1 } });
    playMove(state, winRule, { player: "X", cell: { row: 0, col: 2 } });
    playMove(state, winRule, { player: "O", cell: { row: 1, col: 2 } });
    const m4 = playMove(state, winRule, { player: "X", cell: { row: 0, col: 3 } });
    playMove(state, winRule, { player: "O", cell: { row: 1, col: 3 } });

    // Before 5th move, no winner
    if (m4.type === "accepted") {
      expect(m4.win).toBeNull();
    }

    // 5th move
    const m5 = playMove(state, winRule, { player: "X", cell: { row: 0, col: 4 } });
    expect(m5.type).toBe("accepted");
    if (m5.type === "accepted") {
      expect(m5.win).not.toBeNull();
      expect(m5.win?.winner).toBe("X");
      expect(m5.win?.cells).toHaveLength(5);
    }
  });

  it("win detection: diagonal checking near the board edge", () => {
    // O at (10,10), (11,11), (12,12), (13,13), (14,14)
    playMove(state, winRule, { player: "O", cell: { row: 10, col: 10 } });
    playMove(state, winRule, { player: "O", cell: { row: 11, col: 11 } });
    playMove(state, winRule, { player: "O", cell: { row: 12, col: 12 } });
    const m4 = playMove(state, winRule, { player: "O", cell: { row: 13, col: 13 } });
    if (m4.type === "accepted") {
      expect(m4.win).toBeNull();
    }

    const m5 = playMove(state, winRule, { player: "O", cell: { row: 14, col: 14 } });
    expect(m5.type).toBe("accepted");
    if (m5.type === "accepted") {
      expect(m5.win).not.toBeNull();
      expect(m5.win?.winner).toBe("O");
    }
  });
});
