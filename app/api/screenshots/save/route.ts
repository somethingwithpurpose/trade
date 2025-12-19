import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

// POST save screenshot without trade (for bulk uploads)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const url = formData.get("url") as string
    const filename = formData.get("filename") as string
    const type = formData.get("type") as string || "chart"
    const aiExtractedData = formData.get("aiExtractedData")
    const tradeId = formData.get("tradeId") as string | null // Optional
    
    if (!url || !filename) {
      return NextResponse.json(
        { error: "URL and filename are required" },
        { status: 400 }
      )
    }
    
    const result = await pool.query(
      `INSERT INTO screenshots (
        trade_id, url, filename, file_size, mime_type, type, ai_processed, ai_extracted_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        tradeId || null,
        url,
        filename,
        formData.get("fileSize") ? parseInt(formData.get("fileSize") as string) : null,
        formData.get("mimeType") as string || null,
        type,
        !!aiExtractedData,
        aiExtractedData ? JSON.parse(aiExtractedData as string) : null,
      ]
    )
    
    return NextResponse.json({ success: true, screenshot: result.rows[0] })
  } catch (error: any) {
    console.error("Error saving screenshot:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PUT update screenshot AI data
export async function PUT(request: NextRequest) {
  try {
    const { screenshotId, aiExtractedData, tradeId } = await request.json()
    
    if (!screenshotId) {
      return NextResponse.json(
        { error: "Screenshot ID required" },
        { status: 400 }
      )
    }
    
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1
    
    if (aiExtractedData !== undefined) {
      updates.push(`ai_processed = $${paramCount++}`)
      updates.push(`ai_extracted_data = $${paramCount++}`)
      values.push(true, JSON.stringify(aiExtractedData))
    }
    
    if (tradeId !== undefined) {
      updates.push(`trade_id = $${paramCount++}`)
      values.push(tradeId)
    }
    
    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 }
      )
    }
    
    updates.push(`updated_at = NOW()`)
    values.push(screenshotId)
    
    const result = await pool.query(
      `UPDATE screenshots 
       SET ${updates.join(", ")}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    )
    
    return NextResponse.json({ success: true, screenshot: result.rows[0] })
  } catch (error: any) {
    console.error("Error updating screenshot:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// GET all screenshots (for bulk management)
export async function GET() {
  try {
    const result = await pool.query(
      `SELECT * FROM screenshots ORDER BY uploaded_at DESC`
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

