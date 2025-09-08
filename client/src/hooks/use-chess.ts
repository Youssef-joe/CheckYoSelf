import { useState, useCallback, useEffect } from "react";
import { Chess, Square, Move, Color } from "chess.js";
import { ChessEngine, GameState } from "@/lib/chess-engine";
import { useToast } from "@/hooks/use-toast";

export function useChess(initialFen?: string) {
  const [engine] = useState(() => new ChessEngine(initialFen));
  const [gameState, setGameState] = useState<GameState>(engine.getGameState());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const { toast } = useToast();

  const updateGameState = useCallback(() => {
    const newState = engine.getGameState();
    setGameState(newState);
  }, [engine]);

  const selectSquare = useCallback((square: Square) => {
    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    // If we have a selected square, try to make a move
    if (selectedSquare) {
      const move = engine.makeMove(selectedSquare, square);
      if (move) {
        setSelectedSquare(null);
        updateGameState();
        toast({
          title: "Move made",
          description: `${move.san}`,
        });
      } else {
        // Invalid move, select the new square instead
        const legalMoves = engine.getLegalMoves(square);
        if (legalMoves.length > 0) {
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      // Select square if it has legal moves
      const legalMoves = engine.getLegalMoves(square);
      if (legalMoves.length > 0) {
        setSelectedSquare(square);
      }
    }
  }, [selectedSquare, engine, updateGameState, toast]);

  const makeMove = useCallback((from: Square, to: Square, promotion?: string): boolean => {
    const move = engine.makeMove(from, to, promotion);
    if (move) {
      updateGameState();
      return true;
    }
    return false;
  }, [engine, updateGameState]);

  const undoMove = useCallback(() => {
    const move = engine.undo();
    if (move) {
      setSelectedSquare(null);
      updateGameState();
      toast({
        title: "Move undone",
        description: `Undid ${move.san}`,
      });
    }
  }, [engine, updateGameState, toast]);

  const resetGame = useCallback(() => {
    engine.reset();
    setSelectedSquare(null);
    updateGameState();
    toast({
      title: "New game",
      description: "Started a new game",
    });
  }, [engine, updateGameState, toast]);

  const loadPgn = useCallback((pgn: string) => {
    const success = engine.loadPgn(pgn);
    if (success) {
      setSelectedSquare(null);
      updateGameState();
      toast({
        title: "Game loaded",
        description: "PGN loaded successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Invalid PGN format",
        variant: "destructive",
      });
    }
    return success;
  }, [engine, updateGameState, toast]);

  const getLegalMoves = useCallback((square?: Square): Move[] => {
    return engine.getLegalMoves(square);
  }, [engine]);

  const getLocalAIMove = useCallback(async (): Promise<Move | null> => {
    if (isThinking) return null;
    
    setIsThinking(true);
    try {
      // Simulate thinking time
      await new Promise(resolve => setTimeout(resolve, 1000));
      const move = engine.getBestMove(4);
      return move;
    } finally {
      setIsThinking(false);
    }
  }, [engine, isThinking]);

  return {
    gameState,
    selectedSquare,
    isThinking,
    selectSquare,
    makeMove,
    undoMove,
    resetGame,
    loadPgn,
    getLegalMoves,
    getLocalAIMove,
    getFen: () => engine.getFen(),
    getPgn: () => engine.getPgn(),
  };
}
