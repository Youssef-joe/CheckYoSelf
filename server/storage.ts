import { type User, type InsertUser, type Game, type InsertGame, type GameAnalysis, type InsertGameAnalysis } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getGame(id: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined>;
  getUserGames(userId: string): Promise<Game[]>;
  
  getGameAnalysis(gameId: string): Promise<GameAnalysis[]>;
  createGameAnalysis(analysis: InsertGameAnalysis): Promise<GameAnalysis>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private games: Map<string, Game>;
  private gameAnalyses: Map<string, GameAnalysis>;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.gameAnalyses = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, rating: 1200 };
    this.users.set(id, user);
    return user;
  }

  async getGame(id: string): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const id = randomUUID();
    const game: Game = {
      ...insertGame,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.games.set(id, game);
    return game;
  }

  async updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (!game) return undefined;
    
    const updatedGame = { ...game, ...updates, updatedAt: new Date() };
    this.games.set(id, updatedGame);
    return updatedGame;
  }

  async getUserGames(userId: string): Promise<Game[]> {
    return Array.from(this.games.values()).filter(
      (game) => game.whitePlayerId === userId || game.blackPlayerId === userId
    );
  }

  async getGameAnalysis(gameId: string): Promise<GameAnalysis[]> {
    return Array.from(this.gameAnalyses.values()).filter(
      (analysis) => analysis.gameId === gameId
    );
  }

  async createGameAnalysis(insertAnalysis: InsertGameAnalysis): Promise<GameAnalysis> {
    const id = randomUUID();
    const analysis: GameAnalysis = {
      ...insertAnalysis,
      id,
      createdAt: new Date(),
    };
    this.gameAnalyses.set(id, analysis);
    return analysis;
  }
}

export const storage = new MemStorage();
