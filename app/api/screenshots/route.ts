import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

// POST upload screenshot
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const tradeId = formData.get("tradeId") as string
    const file = formData.get("file") as File
    const url = formData.get("url") as string
    const filename = formData.get("filename") as string
    const type = formData.get("type") as string || "chart"
    const aiExtractedData = formData.get("aiExtractedData")
    
    if (!tradeId || !url || !filename) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
    
    const result = await pool.query(
      `INSERT INTO screenshots (
        trade_id, url, filename, file_size, mime_type, type, ai_processed, ai_extracted_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        tradeId,
        url,
        filename,
        file.size || null,
        file.type || null,
        type,
        !!aiExtractedData,
        aiExtractedData ? JSON.parse(aiExtractedData as string) : null,
      ]
    )
    
    return NextResponse.json({ success: true, screenshot: result.rows[0] })
  } catch (error: any) {
    console.error("Error uploading screenshot:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// GET screenshots for a trade
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tradeId = searchParams.get("tradeId")
    
    if (!tradeId) {
      return NextResponse.json(
        { error: "Trade ID required" },
        { status: 400 }
      )
    }
    
    const result = await pool.query(
      `SELECT * FROM screenshots WHERE trade_id = $1 ORDER BY uploaded_at DESC`,
      [tradeId]
    )
    
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error("Error fetching screenshots:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

