import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "AIzaSyCw2LVqZ1p5xNXwGHENjqCRiwezD26-2Nk" });

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

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            from: { type: "string" },
            to: { type: "string" },
            promotion: { type: "string" },
            san: { type: "string" },
          },
          required: ["from", "to", "san"],
        },
      },
      contents: prompt,
    });

    const moveData = JSON.parse(response.text || "{}");
    return {
      from: moveData.from,
      to: moveData.to,
      promotion: moveData.promotion || undefined,
      san: moveData.san,
    };
  } catch (error) {
    console.error("Error getting AI move:", error);
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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            score: { type: "number" },
            bestMoves: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  from: { type: "string" },
                  to: { type: "string" },
                  san: { type: "string" },
                },
                required: ["from", "to", "san"],
              },
            },
            analysis: { type: "string" },
            depth: { type: "number" },
          },
          required: ["score", "bestMoves", "analysis", "depth"],
        },
      },
      contents: prompt,
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error analyzing position:", error);
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
