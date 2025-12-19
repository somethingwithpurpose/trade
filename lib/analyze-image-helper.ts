// Helper to analyze images directly (for server-side use)
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

const GEMINI_MODEL = "gemini-2.0-flash-exp"

const prompt = `Analyze this trading chart screenshot and extract the following information in JSON format:
{
  "breakType": "Range Break" | "Liquidity Sweep" | "Trend Continuation" | "Failed Break" | "Reversal Break" | null,
  "tpType": "Fixed TP" | "Runner" | "Partial + Runner" | "Scalp TP" | "HTF Target" | null,
  "slType": "Fixed SL" | "ATR SL" | "Structure SL" | "Mental SL" | null,
  "beType": "No BE" | "Standard BE" | "Smart BE" | "Trailing BE" | null,
  "session": "Asia" | "London" | "NY AM" | "NY PM" | null,
  "marketStructure": "Bullish" | "Bearish" | "Ranging" | "Choppy" | null,
  "entryStyle": "Limit" | "Market" | "Stop" | null,
  "htfLtfAlignment": "Aligned" | "Neutral" | "Contrary" | null,
  "notes": "Any additional observations about the trade setup"
}

Focus on identifying:
- Break type: What kind of price action break is visible
- TP/SL/BE logic: How the trade was managed
- Market structure: Overall trend and structure
- Session context: Time of day patterns
- Entry style: How the trade was entered

Return ONLY valid JSON, no markdown formatting.`

export async function analyzeImageDirect(base64: string, mimeType: string): Promise<Response> {
  try {
    if (!genAI) {
      throw new Error("GEMINI_API_KEY not configured")
    }
    
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64,
          mimeType,
        },
      },
    ])
    
    const response = result.response
    const text = response.text()
    
    let jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return new Response(JSON.stringify({
        breakType: null,
        tpType: null,
        slType: null,
        beType: null,
        session: null,
        marketStructure: null,
        entryStyle: null,
        htfLtfAlignment: null,
        notes: text,
      }), { status: 200, headers: { "Content-Type": "application/json" } })
    }
    
    const extracted = JSON.parse(jsonMatch[0])
    return new Response(JSON.stringify(extracted), { status: 200, headers: { "Content-Type": "application/json" } })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    })
  }
}

