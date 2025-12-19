import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

export async function POST(request: NextRequest) {
  try {
    if (!genAI || !process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured. Please add it to your .env.local file." },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const mimeType = file.type

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

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
    
    // Try to extract JSON from response
    let jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      // If no JSON found, return structured response
      return NextResponse.json({
        breakType: null,
        tpType: null,
        slType: null,
        beType: null,
        session: null,
        marketStructure: null,
        entryStyle: null,
        htfLtfAlignment: null,
        notes: text,
      })
    }

    const extracted = JSON.parse(jsonMatch[0])
    
    return NextResponse.json(extracted)
  } catch (error) {
    console.error("Error analyzing image:", error)
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    )
  }
}

