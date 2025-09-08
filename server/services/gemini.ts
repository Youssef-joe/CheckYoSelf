import { GoogleGenAI } from "@google/genai";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "" });

export interface ChessAnalysisResult {
  evaluation: number;
  bestMoves: Array<{
    from: string;
    to: string;
    san: string;
    evaluation?: number;
  }>;
  analysis: string;
  depth: number;
}

export interface ChessMoveResult {
  from: string;
  to: string;
  promotion?: string;
  san: string;
  reasoning?: string;
}

export async function analyzeChessPosition(fen: string, moveHistory: string[]): Promise<ChessAnalysisResult> {
  try {
    const systemPrompt = `You are a world-class chess engine and analyst. 
Analyze the given position and provide detailed evaluation including:
- Position evaluation in centipawns (positive for white advantage, negative for black)
- Top 3-5 best moves with brief explanations
- Overall strategic and tactical assessment
- Key factors affecting the position

Be precise and analytical in your assessment.`;

    const userPrompt = `Analyze this chess position:

Current position (FEN): ${fen}
Move history: ${moveHistory.join(' ')}

Provide comprehensive analysis with evaluation score, best moves, and strategic assessment.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            evaluation: { type: "number" },
            bestMoves: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  from: { type: "string" },
                  to: { type: "string" },
                  san: { type: "string" },
                  evaluation: { type: "number" }
                },
                required: ["from", "to", "san"]
              }
            },
            analysis: { type: "string" },
            depth: { type: "number" }
          },
          required: ["evaluation", "bestMoves", "analysis", "depth"]
        }
      },
      contents: userPrompt,
    });

    const result = JSON.parse(response.text || "{}");
    
    return {
      evaluation: result.evaluation || 0,
      bestMoves: result.bestMoves || [],
      analysis: result.analysis || "Analysis not available",
      depth: result.depth || 20
    };
  } catch (error) {
    console.error("Error analyzing chess position:", error);
    throw new Error(`Failed to analyze position: ${error}`);
  }
}

export async function generateChessMove(fen: string, moveHistory: string[], difficulty: 'beginner' | 'intermediate' | 'advanced' | 'master' = 'advanced'): Promise<ChessMoveResult> {
  try {
    const systemPrompt = `You are an expert chess engine playing at ${difficulty} level.
Given the current position, suggest the best move considering:
- Tactical opportunities and threats
- Positional advantages
- King safety
- Piece development and activity
- Pawn structure
- Endgame considerations

Provide the move in algebraic notation and explain your reasoning briefly.`;

    const userPrompt = `Current position (FEN): ${fen}
Move history: ${moveHistory.join(' ')}

What is the best move in this position?`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            from: { type: "string" },
            to: { type: "string" },
            promotion: { type: "string" },
            san: { type: "string" },
            reasoning: { type: "string" }
          },
          required: ["from", "to", "san"]
        }
      },
      contents: userPrompt,
    });

    const moveData = JSON.parse(response.text || "{}");
    
    return {
      from: moveData.from,
      to: moveData.to,
      promotion: moveData.promotion,
      san: moveData.san,
      reasoning: moveData.reasoning
    };
  } catch (error) {
    console.error("Error generating chess move:", error);
    throw new Error(`Failed to generate move: ${error}`);
  }
}

export async function explainChessMove(fen: string, move: string, moveHistory: string[]): Promise<string> {
  try {
    const prompt = `As a chess expert, explain the strategic and tactical significance of the move "${move}" in this position:

Current position (FEN): ${fen}
Move history: ${moveHistory.join(' ')}
Move to explain: ${move}

Provide a clear, educational explanation of why this move is good or bad, what it accomplishes, and any key variations or consequences.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Move explanation not available";
  } catch (error) {
    console.error("Error explaining chess move:", error);
    throw new Error(`Failed to explain move: ${error}`);
  }
}
