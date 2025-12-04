import React, { useState, useEffect } from "react";
import { ChessBoard } from "@/components/chess/ChessBoard";
import { GameSidebar } from "@/components/chess/GameSidebar";
import { AnalysisModal } from "@/components/chess/AnalysisModal";
import { useChess } from "@/hooks/use-chess";
import { useToast } from "@/hooks/use-toast";
import { requestAIMove, analyzePosition, type PositionAnalysis } from "@/lib/chess-ai";
import { updateUserRating, saveRatingLocally, getGameResult } from "@/lib/rating-utils";
import { useMutation, useQuery } from "@tanstack/react-query";

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
  const [userRating, setUserRating] = useState(1850);
  const [aiRating, setAIRating] = useState(3200);
  const [gameId, setGameId] = useState<string | null>(null);
  const [previousGameStatus, setPreviousGameStatus] = useState("active");
  const { toast } = useToast();

  // Load user rating from localStorage
  useEffect(() => {
    const savedRating = localStorage.getItem("userRating");
    if (savedRating) {
      setUserRating(parseInt(savedRating, 10));
    }
  }, []);

  // Handle game end - update rating
  useEffect(() => {
    console.log("Game status changed:", { previousGameStatus, currentStatus: gameState.gameStatus, gameId });
    if (
      previousGameStatus === "active" &&
      gameState.gameStatus !== "active" &&
      gameId
    ) {
      console.log("Triggering game end handler");
      handleGameEnd();
    }
    setPreviousGameStatus(gameState.gameStatus);
  }, [gameState.gameStatus]);

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
      console.log("Analysis data received:", analysisData);
      setAnalysis(analysisData);
      setIsAnalysisOpen(true);
    },
    onError: (error) => {
      console.error("Analysis error:", error);
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

  const handleNewGame = async () => {
    resetGame();
    setPreviousGameStatus("active");
    
    // Create new game in database and wait for it to complete
    try {
      const gameData = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whitePlayerId: "user",
          blackPlayerId: "ai",
          pgn: "",
          result: "*",
        }),
      }).then(res => res.json());
      
      setGameId(gameData.id);
      console.log("New game created with ID:", gameData.id);
    } catch (error) {
      console.error("Failed to create game:", error);
    }
  };

  const handleGameEnd = async () => {
    try {
      console.log("handleGameEnd called, gameStatus:", gameState.gameStatus);
      
      // Determine the game result
      const result = getGameResult(gameState.gameStatus, true); // true = user is white
      console.log("Game result:", result);

      if (!gameId) {
        console.warn("No gameId available");
        return;
      }

      console.log("Updating rating for gameId:", gameId, "result:", result);

      // Update rating via API
      const ratingUpdate = await updateUserRating(gameId, {
        userId: "default-user", // In a real app, get from auth context
        result,
        aiDifficulty: "medium",
      });

      console.log("Rating update response:", ratingUpdate);

      // Update local state and localStorage
      setUserRating(ratingUpdate.newRating);
      saveRatingLocally(ratingUpdate.newRating);

      // Show rating change toast
      const ratingChangeSign = ratingUpdate.ratingChange > 0 ? "+" : "";
      toast({
        title: "Game Finished",
        description: `Rating: ${ratingUpdate.oldRating} ${ratingChangeSign}${ratingUpdate.ratingChange} → ${ratingUpdate.newRating}`,
      });
    } catch (error) {
      console.error("Error updating rating:", error);
      // Don't show error to user - rating update is optional
    }
  };

  const createGameMutation = useMutation({
    mutationFn: async (pgn: string) => {
      const response = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whitePlayerId: "user",
          blackPlayerId: "ai",
          pgn,
          result: "*",
        }),
      });
      return response.json();
    },
    onSuccess: (game) => {
      setGameId(game.id);
    },
  });

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
        onNewGame={handleNewGame}
        onSaveGame={handleSaveGame}
        onLoadGame={handleLoadGame}
        userRating={userRating}
        aiRating={aiRating}
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
