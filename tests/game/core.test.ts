import { describe, it, expect, beforeEach } from "vitest";
import { GameState } from "../../src/game/state";
import { checkWinner } from "../../src/game/rules";
import { Player } from "../../src/game/types";

describe("GameState & Rules Core", () => {
  let state: GameState;

  beforeEach(() => {
    state = new GameState();
  });

  it("board coordinate storage: can set and get pieces at negative and positive coordinates", () => {
    state.makeMove(0, 0, "X");
    state.makeMove(-10, -20, "O");
    state.makeMove(381, -92, "X");

    expect(state.get(0, 0)).toBe("X");
    expect(state.get(-10, -20)).toBe("O");
    expect(state.get(381, -92)).toBe("X");
    expect(state.get(1, 1)).toBeNull(); // Empty cell
  });

  it("make move: successfully records history and updates bounds", () => {
    state.makeMove(0, 0, "X");
    expect(state.history.length).toBe(1);
    expect(state.history[0]).toEqual({ player: "X", row: 0, col: 0, index: 1 });
    expect(state.bounds).toEqual({ minR: 0, maxR: 0, minC: 0, maxC: 0 });

    state.makeMove(5, -5, "O");
    expect(state.history.length).toBe(2);
    expect(state.bounds).toEqual({ minR: 0, maxR: 5, minC: -5, maxC: 0 });
  });

  it("make move: occupied cell rejection", () => {
    const success1 = state.makeMove(0, 0, "X");
    const success2 = state.makeMove(0, 0, "O"); // Reject

    expect(success1).toBe(true);
    expect(success2).toBe(false);
    expect(state.get(0, 0)).toBe("X");
    expect(state.history.length).toBe(1);
  });

  it("win detection: correctly identifies 5 in a row horizontally", () => {
    state.makeMove(0, 0, "X");
    state.makeMove(1, 0, "O");
    state.makeMove(0, 1, "X");
    state.makeMove(1, 1, "O");
    state.makeMove(0, 2, "X");
    state.makeMove(1, 2, "O");
    state.makeMove(0, 3, "X");
    state.makeMove(1, 3, "O");

    // Before 5th move, no winner
    expect(checkWinner(state, 0, 3)).toBeNull();

    // 5th move
    state.makeMove(0, 4, "X");
    const winResult = checkWinner(state, 0, 4);
    
    expect(winResult).not.toBeNull();
    expect(winResult?.winner).toBe("X");
    expect(winResult?.cells).toHaveLength(5);
  });

  it("win detection: diagonal checking with negative coordinates", () => {
    // X at (0,0), (-1,-1), (-2,-2), (-3,-3), (-4,-4)
    state.makeMove(0, 0, "O");
    state.makeMove(-1, -1, "O");
    state.makeMove(-2, -2, "O");
    state.makeMove(-3, -3, "O");
    expect(checkWinner(state, -3, -3)).toBeNull();

    state.makeMove(-4, -4, "O");
    const winResult = checkWinner(state, -4, -4);
    expect(winResult).not.toBeNull();
    expect(winResult?.winner).toBe("O");
  });
});
