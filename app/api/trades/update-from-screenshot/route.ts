import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

// POST update trade fields from screenshot AI analysis
export async function POST(request: NextRequest) {
  try {
    const { tradeId, screenshotId, fields } = await request.json()
    
    if (!tradeId) {
      return NextResponse.json(
        { error: "Trade ID required" },
        { status: 400 }
      )
    }
    
    // Get screenshot data if screenshotId provided
    let extractedData: any = fields || {}
    
    if (screenshotId) {
      const screenshotResult = await pool.query(
        `SELECT ai_extracted_data FROM screenshots WHERE id = $1`,
        [screenshotId]
      )
      
      if (screenshotResult.rows.length > 0 && screenshotResult.rows[0].ai_extracted_data) {
        extractedData = { ...extractedData, ...screenshotResult.rows[0].ai_extracted_data }
      }
    }
    
    // Map extracted data to trade fields
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1
    
    if (extractedData.breakType) {
      updates.push(`break_type = $${paramCount++}`)
      values.push(extractedData.breakType)
    }
    if (extractedData.tpType) {
      updates.push(`tp_type = $${paramCount++}`)
      values.push(extractedData.tpType)
    }
    if (extractedData.slType) {
      updates.push(`sl_type = $${paramCount++}`)
      values.push(extractedData.slType)
    }
    if (extractedData.beType) {
      updates.push(`be_type = $${paramCount++}`)
      values.push(extractedData.beType)
    }
    if (extractedData.session) {
      updates.push(`session = $${paramCount++}`)
      values.push(extractedData.session)
    }
    
    // Update notes if provided
    if (extractedData.notes) {
      const currentNotesResult = await pool.query(
        `SELECT notes FROM trades WHERE id = $1`,
        [tradeId]
      )
      const currentNotes = currentNotesResult.rows[0]?.notes || ""
      const newNotes = currentNotes 
        ? `${currentNotes}\n\nAI Analysis: ${extractedData.notes}`
        : `AI Analysis: ${extractedData.notes}`
      updates.push(`notes = $${paramCount++}`)
      values.push(newNotes)
    }
    
    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      )
    }
    
    updates.push(`updated_at = NOW()`)
    values.push(tradeId)
    
    const result = await pool.query(
      `UPDATE trades 
       SET ${updates.join(", ")}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    )
    
    // Link screenshot to trade if screenshotId provided
    if (screenshotId) {
      await pool.query(
        `UPDATE screenshots SET trade_id = $1 WHERE id = $2`,
        [tradeId, screenshotId]
      )
    }
    
    return NextResponse.json({ success: true, trade: result.rows[0] })
  } catch (error: any) {
    console.error("Error updating trade from screenshot:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

