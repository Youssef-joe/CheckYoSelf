import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameSchema, insertGameAnalysisSchema } from "@shared/schema";
import { getAIMove, analyzePosition } from "./services/chess-ai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Chess AI endpoints
  app.post("/api/ai-move", async (req, res) => {
    try {
      const { fen, moveHistory } = req.body;
      
      if (!fen) {
        return res.status(400).json({ error: "FEN position required" });
      }

      const aiMove = await getAIMove(fen, moveHistory || []);
      res.json(aiMove);
    } catch (error) {
      console.error("Error getting AI move:", error);
      res.status(500).json({ error: "Failed to get AI move" });
    }
  });

  app.post("/api/analyze-position", async (req, res) => {
    try {
      const { fen, moveHistory } = req.body;
      
      if (!fen) {
        return res.status(400).json({ error: "FEN position required" });
      }

      const analysis = await analyzePosition(fen, moveHistory || []);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing position:", error);
      res.status(500).json({ error: "Failed to analyze position" });
    }
  });

  // Game management endpoints
  app.post("/api/games", async (req, res) => {
    try {
      const gameData = insertGameSchema.parse(req.body);
      const game = await storage.createGame(gameData);
      res.json(game);
    } catch (error) {
      res.status(400).json({ error: "Invalid game data" });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const game = await storage.getGame(req.params.id);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ error: "Failed to get game" });
    }
  });

  app.put("/api/games/:id", async (req, res) => {
    try {
      const updates = req.body;
      const game = await storage.updateGame(req.params.id, updates);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ error: "Failed to update game" });
    }
  });

  app.post("/api/games/:id/analysis", async (req, res) => {
    try {
      const analysisData = insertGameAnalysisSchema.parse({
        ...req.body,
        gameId: req.params.id,
      });
      const analysis = await storage.createGameAnalysis(analysisData);
      res.json(analysis);
    } catch (error) {
      res.status(400).json({ error: "Invalid analysis data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
