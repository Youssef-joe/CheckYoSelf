import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  RotateCcw, 
  Plus, 
  Download, 
  Upload, 
  Loader2,
  User,
  Bot
} from "lucide-react";
import { Color } from "chess.js";
import { formatEvaluation, getEvaluationPercentage } from "@/lib/chess-ai";

interface GameSidebarProps {
  currentPlayer: Color;
  moveHistory: string[];
  evaluation: number;
  isThinking: boolean;
  gameStatus: string;
  onRequestAIMove: () => void;
  onAnalyzePosition: () => void;
  onUndoMove: () => void;
  onNewGame: () => void;
  onSaveGame: () => void;
  onLoadGame: () => void;
  userRating?: number;
  aiRating?: number;
}

export function GameSidebar({
  currentPlayer,
  moveHistory,
  evaluation,
  isThinking,
  gameStatus,
  onRequestAIMove,
  onAnalyzePosition,
  onUndoMove,
  onNewGame,
  onSaveGame,
  onLoadGame,
  userRating = 1850,
  aiRating = 3200,
}: GameSidebarProps) {
  const evaluationPercentage = getEvaluationPercentage(evaluation);
  
  // Format move history for display
  const formattedMoves = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1;
    const whiteMove = moveHistory[i];
    const blackMove = moveHistory[i + 1];
    
    formattedMoves.push({
      number: moveNumber,
      white: whiteMove,
      black: blackMove,
    });
  }

  return (
    <div className="w-80 bg-card border-l border-border flex flex-col">
      {/* Game Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold font-serif">Elite Chess Engine</h1>
        <p className="text-sm text-muted-foreground">AI-Powered Analysis</p>
      </div>

      {/* Player Info */}
      <div className="p-4 border-b border-border">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-destructive" />
              <span className="font-medium">Stockfish AI</span>
              {currentPlayer === 'b' && (
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </div>
            <span className="text-sm text-muted-foreground">{aiRating}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-primary" />
              <span className="font-medium">You</span>
              {currentPlayer === 'w' && (
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </div>
            <span className="text-sm text-muted-foreground">{userRating}</span>
          </div>
        </div>
      </div>

      {/* Evaluation Bar */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-20 bg-muted rounded overflow-hidden relative">
            <div 
              className="absolute bottom-0 left-0 w-full bg-primary transition-all duration-500"
              style={{ height: `${Math.max(5, Math.min(95, evaluationPercentage))}%` }}
            />
            <div className="absolute top-1/2 left-0 w-full h-px bg-border" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium font-mono">
              {formatEvaluation(evaluation)}
            </div>
            <div className="text-xs text-muted-foreground">Evaluation</div>
            <div className="text-xs text-muted-foreground mt-1">
              Status: {gameStatus}
            </div>
          </div>
        </div>
      </div>

      {/* AI Controls */}
      <div className="p-4 border-b border-border space-y-3">
        <Button 
          className="w-full" 
          onClick={onRequestAIMove}
          disabled={isThinking || gameStatus !== 'active'}
          data-testid="button-request-ai-move"
        >
          {isThinking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Thinking...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Request AI Move
            </>
          )}
        </Button>
        
        <Button 
          variant="secondary" 
          className="w-full"
          onClick={onAnalyzePosition}
          disabled={isThinking}
          data-testid="button-analyze-position"
        >
          <Brain className="w-4 h-4 mr-2" />
          Analyze Position
        </Button>
        
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onUndoMove}
            disabled={moveHistory.length === 0}
            data-testid="button-undo-move"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Undo
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onNewGame}
            data-testid="button-new-game"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Game
          </Button>
        </div>
      </div>

      {/* Move History */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-sm">Move History</h3>
        </div>
        <ScrollArea className="flex-1 p-4" data-testid="move-history">
          {formattedMoves.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No moves yet
            </div>
          ) : (
            <div className="space-y-1">
              {formattedMoves.map((move, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 text-sm py-1">
                  <div className="col-span-2 text-muted-foreground">
                    {move.number}.
                  </div>
                  <div className="col-span-5 text-foreground font-mono">
                    {move.white}
                  </div>
                  <div className="col-span-5 text-foreground font-mono">
                    {move.black || "..."}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Game Options */}
      <div className="p-4 border-t border-border">
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onSaveGame}
            data-testid="button-save-game"
          >
            <Download className="w-4 h-4 mr-1" />
            Save PGN
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onLoadGame}
            data-testid="button-load-game"
          >
            <Upload className="w-4 h-4 mr-1" />
            Load PGN
          </Button>
        </div>
      </div>
    </div>
  );
}
