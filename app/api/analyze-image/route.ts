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
    // Support both FormData (file upload) and JSON (base64 from database)
    const contentType = request.headers.get("content-type") || ""
    let base64: string
    let mimeType: string
    let fileSize: number | null = null
    
    if (contentType.includes("application/json")) {
      const body = await request.json()
      base64 = body.base64
      mimeType = body.mimeType || "image/png"
      fileSize = body.fileSize || null
    } else {
      const formData = await request.formData()
      const file = formData.get("file") as File
      
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }

      const arrayBuffer = await file.arrayBuffer()
      base64 = Buffer.from(arrayBuffer).toString("base64")
      mimeType = file.type || "image/png"
      fileSize = file.size
    }

    // Validate file size (Gemini has limits - 20MB for images)
    if (fileSize && fileSize > 20 * 1024 * 1024) {
      const fileSizeMB = fileSize / (1024 * 1024)
      return NextResponse.json(
        { error: `File too large: ${fileSizeMB.toFixed(2)}MB. Maximum size is 20MB.` },
        { status: 400 }
      )
    }

    // Check for OpenAI API key (support both OPENAI_API_KEY and CHATGPT_API_KEY)
    const openaiKey = process.env.OPENAI_API_KEY || process.env.CHATGPT_API_KEY
    
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
        // Check if it's a quota error
        const isQuotaError = error?.message?.includes("quota") || 
                            error?.message?.includes("Quota exceeded") ||
                            error?.message?.includes("429")
        
        // Fall through to ChatGPT if available (especially for quota errors)
        if (!openaiKey) {
          // Only throw if no ChatGPT fallback available
          if (isQuotaError) {
            throw new Error("Gemini API quota exceeded. Please add OPENAI_API_KEY or CHATGPT_API_KEY as fallback, or check your Gemini billing.")
          }
          throw error
        }
        
        // Log fallback attempt
        if (isQuotaError) {
          console.log("Gemini quota exceeded, attempting ChatGPT fallback...")
        }
      }
    }
    
    // Fallback to ChatGPT Vision API
    if (openaiKey) {
      try {
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiKey}`,
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
          const openaiErrorMsg = errorData.error?.message || "Unknown error"
          
          // Check if OpenAI also has quota issues
          if (openaiErrorMsg.includes("quota") || openaiErrorMsg.includes("Quota exceeded") || openaiResponse.status === 429) {
            if (geminiError) {
              throw new Error(`Both APIs have quota limits exceeded. Please check billing for both Gemini and OpenAI accounts, or wait before retrying.`)
            }
            throw new Error(`OpenAI API quota exceeded: ${openaiErrorMsg}`)
          }
          
          throw new Error(`OpenAI API error: ${openaiErrorMsg}`)
        }
        
        const openaiData = await openaiResponse.json()
        const content = JSON.parse(openaiData.choices[0].message.content)
        
        return NextResponse.json(content)
      } catch (openaiError: any) {
        console.error("OpenAI API error:", openaiError)
        // If both fail, throw combined error with clearer message
        if (geminiError) {
          const geminiMsg = geminiError?.message || "Unknown"
          const openaiMsg = openaiError?.message || "Unknown"
          
          // Check if both are quota errors
          const bothQuota = (geminiMsg.includes("quota") || geminiMsg.includes("Quota exceeded")) &&
                           (openaiMsg.includes("quota") || openaiMsg.includes("Quota exceeded"))
          
          if (bothQuota) {
            throw new Error(`Both Gemini and OpenAI APIs have exceeded their quota limits. Please check billing for both accounts or wait before retrying.`)
          }
          
          throw new Error(`Both APIs failed. Gemini: ${geminiMsg.substring(0, 150)}, OpenAI: ${openaiMsg.substring(0, 150)}`)
        }
        throw openaiError
      }
    }
    
    // If we get here, neither API is configured or Gemini failed without fallback
    if (geminiError) {
      throw geminiError
    }
    
    return NextResponse.json(
      { error: "Neither GEMINI_API_KEY nor OPENAI_API_KEY/CHATGPT_API_KEY is configured" },
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
