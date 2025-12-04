/**
 * Client-side rating update utilities
 */

export interface RatingUpdatePayload {
  userId: string;
  result: "win" | "loss" | "draw";
  aiDifficulty?: "easy" | "medium" | "hard" | "impossible";
}

export interface RatingUpdateResponse {
  success: boolean;
  oldRating: number;
  newRating: number;
  ratingChange: number;
}

/**
 * Update user rating after a game ends
 */
export async function updateUserRating(
  gameId: string,
  payload: RatingUpdatePayload
): Promise<RatingUpdateResponse> {
  const response = await fetch(`/api/games/${gameId}/finish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to update rating: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Save rating to localStorage
 */
export function saveRatingLocally(rating: number): void {
  localStorage.setItem("userRating", rating.toString());
}

/**
 * Get saved rating from localStorage
 */
export function getSavedRating(): number | null {
  const saved = localStorage.getItem("userRating");
  return saved ? parseInt(saved, 10) : null;
}

/**
 * Determine game result from game status
 */
export function getGameResult(
  gameStatus: string,
  isUserWhite: boolean
): "win" | "loss" | "draw" {
  if (gameStatus === "checkmate") {
    return "win"; // User won
  } else if (gameStatus === "stalemate" || gameStatus === "insufficient-material") {
    return "draw";
  } else if (gameStatus === "lost") {
    return "loss";
  }
  return "draw"; // Default to draw if unclear
}
