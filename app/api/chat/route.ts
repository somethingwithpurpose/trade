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

    const { message, trades, images } = await request.json()

    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    // Build comprehensive context from all trades
    const tradeContext = trades.map((trade: any) => {
      return {
        id: trade.id,
        date: trade.date,
        instrument: trade.instrument,
        direction: trade.direction,
        session: trade.session,
        size: trade.size,
        entryPrice: trade.entryPrice,
        stopLossPrice: trade.stopLossPrice,
        takeProfitPrice: trade.takeProfitPrice,
        resultR: trade.resultR,
        resultTicks: trade.resultTicks,
        resultDollar: trade.resultDollar,
        duration: trade.duration,
        breakType: trade.breakType,
        tpType: trade.tpType,
        slType: trade.slType,
        beType: trade.beType,
        intent: trade.intent,
        confidence: trade.confidence,
        emotionalState: trade.emotionalState,
        notes: trade.notes,
        screenshots: trade.screenshots?.length || 0,
      }
    })

    // Calculate key metrics
    const totalTrades = trades.length
    const wins = trades.filter((t: any) => t.resultR > 0).length
    const losses = trades.filter((t: any) => t.resultR < 0).length
    const totalR = trades.reduce((sum: number, t: any) => sum + t.resultR, 0)
    const avgR = totalTrades > 0 ? totalR / totalTrades : 0
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0
    
    const avgWin = wins > 0 
      ? trades.filter((t: any) => t.resultR > 0).reduce((sum: number, t: any) => sum + t.resultR, 0) / wins 
      : 0
    const avgLoss = losses > 0
      ? Math.abs(trades.filter((t: any) => t.resultR < 0).reduce((sum: number, t: any) => sum + t.resultR, 0) / losses)
      : 0

    const plannedTrades = trades.filter((t: any) => t.intent === "Planned")
    const impulseTrades = trades.filter((t: any) => t.intent !== "Impulse")
    const plannedWinRate = plannedTrades.length > 0
      ? (plannedTrades.filter((t: any) => t.resultR > 0).length / plannedTrades.length) * 100
      : 0
    const impulseWinRate = impulseTrades.length > 0
      ? (impulseTrades.filter((t: any) => t.resultR > 0).length / impulseTrades.length) * 100
      : 0

    // Session performance
    const sessionStats: Record<string, { trades: number; totalR: number; wins: number }> = {}
    trades.forEach((trade: any) => {
      if (!sessionStats[trade.session]) {
        sessionStats[trade.session] = { trades: 0, totalR: 0, wins: 0 }
      }
      sessionStats[trade.session].trades++
      sessionStats[trade.session].totalR += trade.resultR
      if (trade.resultR > 0) sessionStats[trade.session].wins++
    })

    // Strategy performance
    const breakTypeStats: Record<string, { trades: number; totalR: number; wins: number }> = {}
    const tpTypeStats: Record<string, { trades: number; totalR: number; wins: number }> = {}
    const beTypeStats: Record<string, { trades: number; totalR: number; wins: number }> = {}

    trades.forEach((trade: any) => {
      if (trade.breakType) {
        if (!breakTypeStats[trade.breakType]) {
          breakTypeStats[trade.breakType] = { trades: 0, totalR: 0, wins: 0 }
        }
        breakTypeStats[trade.breakType].trades++
        breakTypeStats[trade.breakType].totalR += trade.resultR
        if (trade.resultR > 0) breakTypeStats[trade.breakType].wins++
      }
      if (trade.tpType) {
        if (!tpTypeStats[trade.tpType]) {
          tpTypeStats[trade.tpType] = { trades: 0, totalR: 0, wins: 0 }
        }
        tpTypeStats[trade.tpType].trades++
        tpTypeStats[trade.tpType].totalR += trade.resultR
        if (trade.resultR > 0) tpTypeStats[trade.tpType].wins++
      }
      if (trade.beType) {
        if (!beTypeStats[trade.beType]) {
          beTypeStats[trade.beType] = { trades: 0, totalR: 0, wins: 0 }
        }
        beTypeStats[trade.beType].trades++
        beTypeStats[trade.beType].totalR += trade.resultR
        if (trade.resultR > 0) beTypeStats[trade.beType].wins++
      }
    })

    const systemPrompt = `You are an expert trading analyst helping a trader understand their performance patterns, errors, and edge. 

You have access to their complete trading journal with ${totalTrades} trades.

KEY METRICS:
- Total R: ${totalR.toFixed(2)}R
- Win Rate: ${winRate.toFixed(1)}%
- Avg Win: ${avgWin.toFixed(2)}R
- Avg Loss: ${avgLoss.toFixed(2)}R
- Risk/Reward: 1:${avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : "∞"}
- Planned Trades: ${plannedTrades.length} (${plannedWinRate.toFixed(1)}% win rate)
- Impulse Trades: ${impulseTrades.length} (${impulseWinRate.toFixed(1)}% win rate)

SESSION PERFORMANCE:
${Object.entries(sessionStats).map(([session, stats]) => 
  `- ${session}: ${stats.trades} trades, ${stats.totalR > 0 ? "+" : ""}${stats.totalR.toFixed(2)}R, ${((stats.wins / stats.trades) * 100).toFixed(0)}% win rate`
).join("\n")}

STRATEGY PERFORMANCE:
Break Types: ${Object.entries(breakTypeStats).map(([type, stats]) => 
  `${type} (${stats.trades} trades, ${stats.totalR > 0 ? "+" : ""}${stats.totalR.toFixed(2)}R)`
).join(", ") || "No data"}

TP Types: ${Object.entries(tpTypeStats).map(([type, stats]) => 
  `${type} (${stats.trades} trades, ${stats.totalR > 0 ? "+" : ""}${stats.totalR.toFixed(2)}R)`
).join(", ") || "No data"}

BE Types: ${Object.entries(beTypeStats).map(([type, stats]) => 
  `${type} (${stats.trades} trades, ${stats.totalR > 0 ? "+" : ""}${stats.totalR.toFixed(2)}R)`
).join(", ") || "No data"}

Your role is to:
1. Identify patterns in their trading (what works, what doesn't)
2. Surface behavioral errors (impulse trades, revenge trading, etc.)
3. Highlight their edge (where they consistently profit)
4. Provide evidence-based insights with specific trade examples
5. Build a "DNA" of their trading style - strengths, weaknesses, and patterns

Always cite specific data (trade counts, R values, win rates) and flag low-confidence conclusions when sample sizes are small (< 10 trades).

Be direct, evidence-based, and focused on actionable insights.`

    const parts: any[] = [systemPrompt, `\n\nUser Question: ${message}`]

    // Add image analysis if images provided
    if (images && images.length > 0) {
      for (const image of images) {
        if (image.base64) {
          parts.push({
            inlineData: {
              data: image.base64,
              mimeType: image.mimeType || "image/png",
            },
          })
        }
      }
    }

    const result = await model.generateContent(parts)
    const response = result.response
    const text = response.text()

    // Extract citations from response
    const tradeIds: string[] = []
    const mentionedTrades = trades.filter((trade: any) => 
      text.toLowerCase().includes(trade.instrument.toLowerCase()) ||
      text.toLowerCase().includes(trade.session.toLowerCase())
    )
    tradeIds.push(...mentionedTrades.map((t: any) => t.id))

    const sampleSize = mentionedTrades.length || totalTrades
    const confidenceLevel = sampleSize >= 20 ? "high" : sampleSize >= 10 ? "medium" : "low"

    return NextResponse.json({
      content: text,
      citations: {
        tradeIds: tradeIds.slice(0, 10), // Limit to 10 citations
        sampleSize,
        confidenceLevel,
      },
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    )
  }
}

