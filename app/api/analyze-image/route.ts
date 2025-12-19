import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

// Use Gemini 2.0 Flash or fallback to ChatGPT Vision
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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const mimeType = file.type || "image/png"

    // Validate file size (Gemini has limits - 20MB for images)
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > 20) {
      return NextResponse.json(
        { error: `File too large: ${fileSizeMB.toFixed(2)}MB. Maximum size is 20MB.` },
        { status: 400 }
      )
    }

    // Try Gemini 2.0 first, fallback to ChatGPT if available
    let geminiError: any = null
    
    if (genAI && process.env.GEMINI_API_KEY) {
      try {
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
        
        // Try to extract JSON from response
        let jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
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
        
        const extractedData = JSON.parse(jsonMatch[0])
        return NextResponse.json(extractedData)
      } catch (error: any) {
        console.error("Gemini API error:", error)
        geminiError = error
        // Fall through to ChatGPT if available
      }
    }
    
    // Fallback to ChatGPT Vision API
    if (process.env.OPENAI_API_KEY) {
      try {
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: prompt,
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${mimeType};base64,${base64}`,
                    },
                  },
                ],
              },
            ],
            response_format: { type: "json_object" },
          }),
        })
        
        if (!openaiResponse.ok) {
          const errorData = await openaiResponse.json().catch(() => ({}))
          throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`)
        }
        
        const openaiData = await openaiResponse.json()
        const content = JSON.parse(openaiData.choices[0].message.content)
        
        return NextResponse.json(content)
      } catch (openaiError: any) {
        console.error("OpenAI API error:", openaiError)
        // If both fail, throw combined error
        if (geminiError) {
          throw new Error(`Both APIs failed. Gemini: ${geminiError?.message || "Unknown"}, OpenAI: ${openaiError?.message || "Unknown"}`)
        }
        throw openaiError
      }
    }
    
    // If we get here, neither API is configured or Gemini failed without fallback
    if (geminiError) {
      throw geminiError
    }
    
    return NextResponse.json(
      { error: "Neither GEMINI_API_KEY nor OPENAI_API_KEY is configured" },
      { status: 500 }
    )
  } catch (error: any) {
    console.error("Error analyzing image:", error)
    const errorMessage = error?.message || "Failed to analyze image"
    const errorDetails = error?.stack || error?.toString() || "Unknown error"
    
    // Log full error details for debugging
    console.error("Full error details:", errorDetails)
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    )
  }
}
