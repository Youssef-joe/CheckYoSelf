import { apiRequest } from "./queryClient";
import { Move } from "chess.js";

export interface AIMove {
  from: string;
  to: string;
  promotion?: string;
  san: string;
}

export interface PositionAnalysis {
  score: number;
  bestMoves: AIMove[];
  analysis: string;
  depth: number;
}

export async function requestAIMove(fen: string, moveHistory: string[]): Promise<AIMove> {
  try {
    const response = await apiRequest("POST", "/api/ai-move", {
      fen,
      moveHistory,
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error requesting AI move:", error);
    throw new Error("Failed to get AI move suggestion");
  }
}

export async function analyzePosition(fen: string, moveHistory: string[]): Promise<PositionAnalysis> {
  try {
    const response = await apiRequest("POST", "/api/analyze-position", {
      fen,
      moveHistory,
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error analyzing position:", error);
    throw new Error("Failed to analyze position");
  }
}

export function formatEvaluation(score: number): string {
  if (Math.abs(score) > 1000) {
    return score > 0 ? "+M" : "-M";
  }
  return (score / 100).toFixed(1);
}

export function getEvaluationPercentage(score: number): number {
  // Convert centipawn score to percentage for visual representation
  // Sigmoid function to map evaluation to 0-100%
  const normalized = score / 500; // Normalize around 5 pawn advantage
  const percentage = (1 / (1 + Math.exp(-normalized))) * 100;
  return Math.max(5, Math.min(95, percentage)); // Clamp between 5-95%
}
