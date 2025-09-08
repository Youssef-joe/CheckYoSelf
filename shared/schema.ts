import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  rating: integer("rating").default(1200),
});

export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  whitePlayerId: varchar("white_player_id").references(() => users.id),
  blackPlayerId: varchar("black_player_id").references(() => users.id),
  pgn: text("pgn").notNull(),
  result: text("result"), // "1-0", "0-1", "1/2-1/2", "*"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gameAnalysis = pgTable("game_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").references(() => games.id),
  position: text("position").notNull(), // FEN string
  evaluation: integer("evaluation"), // centipawns
  bestMoves: json("best_moves").$type<string[]>(),
  analysis: text("analysis"),
  depth: integer("depth"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGameSchema = createInsertSchema(games).pick({
  whitePlayerId: true,
  blackPlayerId: true,
  pgn: true,
  result: true,
});

export const insertGameAnalysisSchema = createInsertSchema(gameAnalysis).pick({
  gameId: true,
  position: true,
  evaluation: true,
  bestMoves: true,
  analysis: true,
  depth: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;
export type InsertGameAnalysis = z.infer<typeof insertGameAnalysisSchema>;
export type GameAnalysis = typeof gameAnalysis.$inferSelect;
