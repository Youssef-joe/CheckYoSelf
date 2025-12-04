import OpenAI from "openai";

function getOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: OPENROUTER_API_KEY not found in environment variables.");
  }
  return new OpenAI({
    apiKey: apiKey || "",
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:8000",
      "X-Title": "Chess AI",
    },
  });
}

export interface ChessMove {
  from: string;
  to: string;
  promotion?: string;
  san: string;
}

export interface PositionEvaluation {
  score: number; // in centipawns
  bestMoves: ChessMove[];
  analysis: string;
  depth: number;
}

export async function getAIMove(fen: string, moveHistory: string[]): Promise<ChessMove> {
  try {
    const prompt = `You are an expert chess engine. Given the current position in FEN notation and move history, suggest the best move.

Current position (FEN): ${fen}
Move history: ${moveHistory.join(' ')}

Respond with JSON in this exact format:
{
  "from": "e2",
  "to": "e4", 
  "promotion": null,
  "san": "e4"
}

Consider:
- Piece safety and development
- Control of center
- King safety
- Tactical opportunities
- Positional advantages`;

    const openrouter = getOpenRouter();
    const response = await openrouter.chat.completions.create({
      model: "deepseek/deepseek-v3.2",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 500,
    });

    let text = response.choices[0]?.message?.content || "{}";
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      text = jsonMatch[1];
    }
    // Try to extract JSON object if there's extra text
    const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      text = jsonObjectMatch[0];
    }
    const moveData = JSON.parse(text);
    return {
      from: moveData.from,
      to: moveData.to,
      promotion: moveData.promotion || undefined,
      san: moveData.san,
    };
  } catch (error) {
    console.error("Error getting AI move:", error instanceof Error ? error.message : error);
    console.error("Full error:", error);
    // Fallback to a simple opening move
    return { from: "e2", to: "e4", san: "e4" };
  }
}

export async function analyzePosition(fen: string, moveHistory: string[]): Promise<PositionEvaluation> {
  try {
    const prompt = `You are an expert chess engine. Analyze the given position and provide detailed evaluation.

Current position (FEN): ${fen}
Move history: ${moveHistory.join(' ')}

Provide a comprehensive analysis including:
- Position evaluation in centipawns (positive for white advantage)
- Top 3 best moves with brief explanations
- Overall strategic assessment
- Key tactical and positional factors

Respond with JSON in this exact format:
{
  "score": 25,
  "bestMoves": [
    {"from": "g1", "to": "f3", "san": "Nf3"},
    {"from": "e2", "to": "e4", "san": "e4"},
    {"from": "d2", "to": "d4", "san": "d4"}
  ],
  "analysis": "White has a slight advantage due to better piece development and central control. The knight on f3 supports the center and prepares for castling.",
  "depth": 20
}`;

    const openrouter = getOpenRouter();
    const response = await openrouter.chat.completions.create({
      model: "deepseek/deepseek-v3.2",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1000,
    });

    let text = response.choices[0]?.message?.content || "{}";
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      text = jsonMatch[1];
    }
    // Try to extract JSON object if there's extra text
    const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      text = jsonObjectMatch[0];
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Error analyzing position:", error instanceof Error ? error.message : error);
    console.error("Full error:", error);
    return {
      score: 0,
      bestMoves: [
        { from: "e2", to: "e4", san: "e4" },
        { from: "d2", to: "d4", san: "d4" },
        { from: "g1", to: "f3", san: "Nf3" },
      ],
      analysis: "Position appears balanced. Focus on piece development and center control.",
      depth: 15,
    };
  }
}
