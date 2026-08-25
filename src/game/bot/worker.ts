import { BotBoard } from "./board";
import { findBestMove } from "./search";
import { PositionInput, SearchOptions } from "./interface";

self.onmessage = (e) => {
  const data = e.data;
  
  if (data.type === "search") {
    const { id, position, options } = data as {
      id: number;
      position: PositionInput;
      options: SearchOptions;
    };
    
    const board = new BotBoard(position.size);
    board.load(position.cells, position.sideToMove, position.lastMove);
    
    const result = findBestMove(board, options);
    
    self.postMessage({
      type: "result",
      id,
      result
    });
  }
};
