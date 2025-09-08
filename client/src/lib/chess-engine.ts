import { Chess, Square, Move, PieceSymbol, Color } from 'chess.js';

export interface ChessPosition {
  square: Square;
  piece: PieceSymbol;
  color: Color;
}

export interface GameState {
  game: Chess;
  positions: ChessPosition[];
  selectedSquare: Square | null;
  legalMoves: Move[];
  moveHistory: string[];
  currentPlayer: Color;
  gameStatus: 'active' | 'checkmate' | 'stalemate' | 'draw';
  evaluation: number;
}

export class ChessEngine {
  private game: Chess;

  constructor(fen?: string) {
    this.game = new Chess(fen);
  }

  getGameState(): GameState {
    const positions: ChessPosition[] = [];
    
    // Get all pieces on the board
    for (let rank = 8; rank >= 1; rank--) {
      for (let file = 0; file < 8; file++) {
        const square = `${String.fromCharCode(97 + file)}${rank}` as Square;
        const piece = this.game.get(square);
        
        if (piece) {
          positions.push({
            square,
            piece: piece.type,
            color: piece.color,
          });
        }
      }
    }

    let gameStatus: 'active' | 'checkmate' | 'stalemate' | 'draw' = 'active';
    if (this.game.isCheckmate()) gameStatus = 'checkmate';
    else if (this.game.isStalemate()) gameStatus = 'stalemate';
    else if (this.game.isDraw()) gameStatus = 'draw';

    return {
      game: this.game,
      positions,
      selectedSquare: null,
      legalMoves: this.game.moves({ verbose: true }),
      moveHistory: this.game.history(),
      currentPlayer: this.game.turn(),
      gameStatus,
      evaluation: this.evaluatePosition(),
    };
  }

  makeMove(from: Square, to: Square, promotion?: string): Move | null {
    try {
      const move = this.game.move({ from, to, promotion });
      return move;
    } catch (error) {
      return null;
    }
  }

  getLegalMoves(square?: Square): Move[] {
    if (square) {
      return this.game.moves({ square, verbose: true });
    }
    return this.game.moves({ verbose: true });
  }

  isValidMove(from: Square, to: Square): boolean {
    const moves = this.getLegalMoves(from);
    return moves.some(move => move.from === from && move.to === to);
  }

  undo(): Move | null {
    return this.game.undo();
  }

  reset(): void {
    this.game.reset();
  }

  getFen(): string {
    return this.game.fen();
  }

  getPgn(): string {
    return this.game.pgn();
  }

  loadPgn(pgn: string): boolean {
    try {
      this.game.loadPgn(pgn);
      return true;
    } catch (error) {
      return false;
    }
  }

  loadFen(fen: string): boolean {
    try {
      this.game.load(fen);
      return true;
    } catch (error) {
      return false;
    }
  }

  private evaluatePosition(): number {
    // Simple material evaluation
    const pieces = {
      p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
    };

    let evaluation = 0;
    const board = this.game.board();

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (piece) {
          const value = pieces[piece.type as keyof typeof pieces];
          evaluation += piece.color === 'w' ? value : -value;
        }
      }
    }

    return evaluation * 100; // Convert to centipawns
  }

  // Minimax algorithm for local AI
  getBestMove(depth: number = 4): Move | null {
    const moves = this.game.moves({ verbose: true });
    if (moves.length === 0) return null;

    let bestMove = moves[0];
    let bestValue = -Infinity;

    for (const move of moves) {
      this.game.move(move);
      const value = this.minimax(depth - 1, false, -Infinity, Infinity);
      this.game.undo();

      if (value > bestValue) {
        bestValue = value;
        bestMove = move;
      }
    }

    return bestMove;
  }

  private minimax(depth: number, isMaximizing: boolean, alpha: number, beta: number): number {
    if (depth === 0 || this.game.isGameOver()) {
      return this.evaluatePosition();
    }

    const moves = this.game.moves({ verbose: true });

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        this.game.move(move);
        const eval_ = this.minimax(depth - 1, false, alpha, beta);
        this.game.undo();
        maxEval = Math.max(maxEval, eval_);
        alpha = Math.max(alpha, eval_);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        this.game.move(move);
        const eval_ = this.minimax(depth - 1, true, alpha, beta);
        this.game.undo();
        minEval = Math.min(minEval, eval_);
        beta = Math.min(beta, eval_);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }
}
