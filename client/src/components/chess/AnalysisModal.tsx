import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Brain } from "lucide-react";
import { formatEvaluation } from "@/lib/chess-ai";

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis?: {
    score: number;
    bestMoves: Array<{ from: string; to: string; san: string }>;
    analysis: string;
    depth: number;
  };
  isLoading: boolean;
}

export function AnalysisModal({
  isOpen,
  onClose,
  analysis,
  isLoading,
}: AnalysisModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg" data-testid="analysis-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Position Analysis
          </DialogTitle>
          <DialogDescription>
            AI-powered deep analysis of the current position
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2">Analyzing position...</span>
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Evaluation</span>
                <span className="text-lg font-bold font-mono">
                  {formatEvaluation(analysis.score)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Depth: {analysis.depth}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Best Moves</h4>
              <div className="space-y-1">
                {analysis.bestMoves && analysis.bestMoves.slice(0, 3).map((move, index) => (
                  <div key={index} className="flex justify-between text-sm bg-muted/30 px-3 py-2 rounded">
                    <span className="font-mono font-medium">{move.san}</span>
                    <span className="text-muted-foreground">
                      {move.from} → {move.to}
                    </span>
                  </div>
                ))}
                {!analysis.bestMoves && (
                  <p className="text-sm text-muted-foreground">No moves available</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Analysis</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {analysis.analysis}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No analysis available
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} data-testid="button-close-analysis">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
