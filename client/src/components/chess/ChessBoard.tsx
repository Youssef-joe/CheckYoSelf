import React, { useMemo } from "react";
import { Square, Color, PieceSymbol, Move } from "chess.js";
import { ChessPiece } from "./ChessPiece";
import { cn } from "@/lib/utils";

interface ChessBoardProps {
  positions: Array<{ square: Square; piece: PieceSymbol; color: Color }>;
  selectedSquare: Square | null;
  legalMoves: Move[];
  onSquareClick: (square: Square) => void;
  className?: string;
}

export function ChessBoard({
  positions,
  selectedSquare,
  legalMoves,
  onSquareClick,
  className,
}: ChessBoardProps) {
  const positionMap = useMemo(() => {
    const map = new Map();
    positions.forEach(pos => map.set(pos.square, pos));
    return map;
  }, [positions]);

  const legalMoveSquares = useMemo(() => {
    if (!selectedSquare) return new Set();
    return new Set(legalMoves
      .filter(move => move.from === selectedSquare)
      .map(move => move.to)
    );
  }, [selectedSquare, legalMoves]);

  const renderSquare = (square: Square, isLight: boolean) => {
    const position = positionMap.get(square);
    const isSelected = selectedSquare === square;
    const isLegalMove = legalMoveSquares.has(square);
    const isHighlighted = isSelected || (selectedSquare && legalMoveSquares.has(square));

    return (
      <div
        key={square}
        className={cn(
          "chess-square w-16 h-16 flex items-center justify-center relative cursor-pointer",
          "transition-all duration-200 hover:brightness-110 hover:scale-105",
          isLight ? "chess-square-light" : "chess-square-dark",
          isHighlighted && "ring-2 ring-amber-400 ring-inset shadow-lg",
          isLegalMove && "chess-square-legal-move"
        )}
        onClick={() => onSquareClick(square)}
        data-testid={`square-${square}`}
      >
        {position && (
          <ChessPiece
            piece={position.piece}
            color={position.color}
            square={square}
            isSelected={isSelected}
            isDragging={false}
            onMouseDown={onSquareClick}
            onMouseUp={onSquareClick}
          />
        )}
        {isLegalMove && !position && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-primary/70 rounded-full" />
          </div>
        )}
      </div>
    );
  };

  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

  return (
    <div className={cn("board-container", className)}>
      <div className="chess-board rounded-lg overflow-hidden shadow-2xl">
        <div className="grid grid-cols-8 gap-0">
          {ranks.map(rank => 
            files.map(file => {
              const square = `${file}${rank}` as Square;
              const isLight = (files.indexOf(file) + rank) % 2 !== 0;
              return renderSquare(square, isLight);
            })
          )}
        </div>
      </div>
      
      {/* Board coordinates */}
      <div className="flex justify-between mt-3 px-1 text-sm text-muted-foreground font-mono font-semibold">
        {files.map(file => (
          <span key={file} className="w-16 text-center">{file}</span>
        ))}
      </div>
    </div>
  );
}
