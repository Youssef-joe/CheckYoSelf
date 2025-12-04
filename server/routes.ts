import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameSchema, insertGameAnalysisSchema } from "@shared/schema";
import { getAIMove, analyzePosition } from "./services/chess-ai";
import { calculateELORating, getKFactor, getAIRating } from "./services/rating";

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

  // Rating update endpoint
  app.post("/api/games/:id/finish", async (req, res) => {
    try {
      const { userId, result, aiDifficulty = "medium" } = req.body;
      
      if (!userId || !result) {
        return res.status(400).json({ error: "userId and result required" });
      }

      // Get game and user data
      const game = await storage.getGame(req.params.id);
      const user = await storage.getUser(userId);

      if (!game || !user) {
        return res.status(404).json({ error: "Game or user not found" });
      }

      // Determine player score
      let playerScore = 0.5; // Default to draw
      if (result === "win") playerScore = 1;
      else if (result === "loss") playerScore = 0;

      // Get AI rating
      const aiRating = getAIRating(aiDifficulty);

      // Calculate new rating
      const kFactor = getKFactor(user.rating);
      const ratingResult = calculateELORating({
        playerRating: user.rating,
        opponentRating: aiRating,
        playerScore,
        kFactor,
      });

      // Update user rating
      const updatedUser = await storage.updateUser(userId, {
        rating: ratingResult.newRating,
      });

      res.json({
        success: true,
        oldRating: user.rating,
        newRating: ratingResult.newRating,
        ratingChange: ratingResult.ratingChange,
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error finishing game:", error);
      res.status(500).json({ error: "Failed to finish game" });
    }
  });

  // Get user rating endpoint
  app.get("/api/users/:id/rating", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ rating: user.rating });
    } catch (error) {
      res.status(500).json({ error: "Failed to get rating" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
