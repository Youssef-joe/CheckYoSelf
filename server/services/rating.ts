/**
 * ELO rating system for chess
 * Used to calculate rating changes after games
 */

interface RatingChangeParams {
  playerRating: number;
  opponentRating: number;
  playerScore: number; // 1 for win, 0.5 for draw, 0 for loss
  kFactor?: number; // Default K-factor (40 for most players, 16 for 2400+)
}

interface RatingResult {
  newRating: number;
  ratingChange: number;
  expectedScore: number;
}

export function calculateELORating(params: RatingChangeParams): RatingResult {
  const { playerRating, opponentRating, playerScore, kFactor = 40 } = params;

  // Expected score formula
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));

  // Rating change formula
  const ratingChange = Math.round(kFactor * (playerScore - expectedScore));
  const newRating = playerRating + ratingChange;

  return {
    newRating: Math.max(0, newRating), // Ensure rating doesn't go negative
    ratingChange,
    expectedScore,
  };
}

/**
 * Determine K-factor based on player rating
 * FIDE standard:
 * - K=40 for players with rating < 2400
 * - K=20 for players with rating >= 2400
 */
export function getKFactor(rating: number): number {
  return rating >= 2400 ? 20 : 40;
}

/**
 * Get AI rating based on difficulty level
 */
export function getAIRating(difficulty: "easy" | "medium" | "hard" | "impossible" = "medium"): number {
  const ratings: Record<string, number> = {
    easy: 1600,
    medium: 2000,
    hard: 2400,
    impossible: 3200,
  };
  return ratings[difficulty] || 2000;
}
