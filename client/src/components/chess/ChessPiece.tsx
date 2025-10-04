import React from "react";
import { PieceSymbol, Color, Square } from "chess.js";
import { cn } from "@/lib/utils";

interface ChessPieceProps {
  piece: PieceSymbol;
  color: Color;
  square: Square;
  isSelected: boolean;
  isDragging: boolean;
  onMouseDown: (square: Square) => void;
  onMouseUp: (square: Square) => void;
}

const pieceUnicode: Record<Color, Record<PieceSymbol, string>> = {
  w: {
    k: "♔",
    q: "♕", 
    r: "♖",
    b: "♗",
    n: "♘",
    p: "♙",
  },
  b: {
    k: "♚",
    q: "♛",
    r: "♜",
    b: "♝",
    n: "♞",
    p: "♟",
  },
};

export function ChessPiece({
  piece,
  color,
  square,
  isSelected,
  isDragging,
  onMouseDown,
  onMouseUp,
}: ChessPieceProps) {
  const symbol = pieceUnicode[color][piece];

  return (
    <span
      className={cn(
        "chess-piece text-5xl select-none cursor-grab transition-all duration-300",
        "hover:scale-110 active:cursor-grabbing font-bold",
        isSelected && "scale-110 z-10",
        isDragging && "scale-120 z-50 pointer-events-none opacity-80",
        color === 'b' && "text-gray-900",
        color === 'w' && "text-gray-50"
      )}
      style={{
        textShadow: color === 'w' 
          ? "2px 2px 4px rgba(0,0,0,0.9), -1px -1px 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.8)" 
          : "2px 2px 4px rgba(255,255,255,0.6), -1px -1px 3px rgba(255,255,255,0.6), 0 0 6px rgba(255,255,255,0.5)",
        filter: color === 'b' ? "drop-shadow(1px 1px 2px rgba(255,255,255,0.4))" : "drop-shadow(1px 1px 2px rgba(0,0,0,0.8))"
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown(square);
      }}
      onMouseUp={() => onMouseUp(square)}
      data-testid={`piece-${color}${piece}-${square}`}
    >
      {symbol}
    </span>
  );
}
