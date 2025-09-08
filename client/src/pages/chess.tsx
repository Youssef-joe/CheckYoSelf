import React, { useState } from "react";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { GameSidebar } from "@/components/chess/GameSidebar";
import { AnalysisModal } from "@/components/chess/AnalysisModal";
import { useChess } from "@/hooks/use-chess";
import { useToast } from "@/hooks/use-toast";
import { requestAIMove, analyzePosition, type PositionAnalysis } from "@/lib/chess-ai";
import { useMutation } from "@tanstack/react-query";

export default function ChessPage() {
  const {
    gameState,
    selectedSquare,
    isThinking,
    selectSquare,
    makeMove,
    undoMove,
    resetGame,
    loadPgn,
    getFen,
    getPgn,
    getLocalAIMove,
  } = useChess();

  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [analysis, setAnalysis] = useState<PositionAnalysis | undefined>();
  const { toast } = useToast();

  // AI Move Request
  const aiMoveMutation = useMutation({
    mutationFn: async () => {
      const fen = getFen();
      const moveHistory = gameState.moveHistory;
      return await requestAIMove(fen, moveHistory);
    },
    onSuccess: (aiMove) => {
      const success = makeMove(aiMove.from as any, aiMove.to as any, aiMove.promotion);
      if (success) {
        toast({
          title: "AI Move",
          description: `AI played ${aiMove.san}`,
        });
      }
    },
    onError: async () => {
      // Fallback to local AI
      const localMove = await getLocalAIMove();
      if (localMove) {
        const success = makeMove(localMove.from, localMove.to, localMove.promotion);
        if (success) {
          toast({
            title: "Local AI Move",
            description: `Local AI played ${localMove.san}`,
          });
        }
      }
    },
  });

  // Position Analysis
  const analysisMutation = useMutation({
    mutationFn: async () => {
      const fen = getFen();
      const moveHistory = gameState.moveHistory;
      return await analyzePosition(fen, moveHistory);
    },
    onSuccess: (analysisData) => {
      setAnalysis(analysisData);
      setIsAnalysisOpen(true);
    },
    onError: () => {
      toast({
        title: "Analysis Error", 
        description: "Failed to analyze position. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRequestAIMove = () => {
    if (gameState.gameStatus !== 'active') {
      toast({
        title: "Game Over",
        description: "Cannot request AI move - game is finished",
        variant: "destructive",
      });
      return;
    }
    aiMoveMutation.mutate();
  };

  const handleAnalyzePosition = () => {
    analysisMutation.mutate();
  };

  const handleSaveGame = () => {
    const pgn = getPgn();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chess-game-${new Date().toISOString().split('T')[0]}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Game Saved",
      description: "PGN file has been downloaded",
    });
  };

  const handleLoadGame = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pgn';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const pgn = e.target?.result as string;
          loadPgn(pgn);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Main Chess Board Area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <ChessBoard
          positions={gameState.positions}
          selectedSquare={selectedSquare}
          legalMoves={gameState.legalMoves}
          onSquareClick={selectSquare}
          data-testid="chess-board"
        />
      </div>

      {/* Right Sidebar */}
      <GameSidebar
        currentPlayer={gameState.currentPlayer}
        moveHistory={gameState.moveHistory}
        evaluation={gameState.evaluation}
        isThinking={isThinking || aiMoveMutation.isPending}
        gameStatus={gameState.gameStatus}
        onRequestAIMove={handleRequestAIMove}
        onAnalyzePosition={handleAnalyzePosition}
        onUndoMove={undoMove}
        onNewGame={resetGame}
        onSaveGame={handleSaveGame}
        onLoadGame={handleLoadGame}
      />

      {/* AI Analysis Modal */}
      <AnalysisModal
        isOpen={isAnalysisOpen}
        onClose={() => setIsAnalysisOpen(false)}
        analysis={analysis}
        isLoading={analysisMutation.isPending}
      />
    </div>
  );
}
