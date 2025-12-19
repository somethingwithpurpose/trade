import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import type { Trade } from "@/lib/types"

// GET all trades
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")
    
    let query = `
      SELECT 
        t.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', s.id,
              'url', s.url,
              'filename', s.filename,
              'type', s.type,
              'aiProcessed', s.ai_processed,
              'aiExtractedData', s.ai_extracted_data
            )
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) as screenshots
      FROM trades t
      LEFT JOIN screenshots s ON s.trade_id = t.id
    `
    
    const params: any[] = []
    if (date) {
      query += ` WHERE t.date = $1`
      params.push(date)
    }
    
    query += ` GROUP BY t.id ORDER BY t.date DESC, t.time DESC`
    
    const result = await pool.query(query, params)
    
    const trades = result.rows.map((row) => ({
      id: row.id,
      instrument: row.instrument,
      date: new Date(row.date),
      time: row.time,
      session: row.session,
      direction: row.direction,
      size: row.size,
      entryPrice: parseFloat(row.entry_price),
      stopLossPrice: row.stop_loss_price ? parseFloat(row.stop_loss_price) : undefined,
      takeProfitPrice: row.take_profit_price ? parseFloat(row.take_profit_price) : undefined,
      resultR: parseFloat(row.result_r),
      resultTicks: row.result_ticks,
      resultDollars: row.result_dollars ? parseFloat(row.result_dollars) : undefined,
      duration: row.duration,
      intent: row.intent,
      confidenceAtEntry: row.confidence_at_entry,
      emotionalStates: row.emotional_states || [],
      tpType: row.tp_type,
      slType: row.sl_type,
      beType: row.be_type,
      breakType: row.break_type,
      notes: row.notes,
      tags: row.tags || [],
      screenshots: row.screenshots || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }))
    
    return NextResponse.json(trades)
  } catch (error: any) {
    console.error("Error fetching trades:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST create new trade
export async function POST(request: NextRequest) {
  try {
    const trade: Trade = await request.json()
    
    const result = await pool.query(
      `INSERT INTO trades (
        id, instrument, date, time, session, direction, size,
        entry_price, stop_loss_price, take_profit_price,
        result_r, result_ticks, result_dollars, duration,
        intent, confidence_at_entry, emotional_states,
        tp_type, sl_type, be_type, break_type, notes, tags
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      ) RETURNING *`,
      [
        trade.id,
        trade.instrument,
        trade.date,
        trade.time,
        trade.session,
        trade.direction,
        trade.size,
        trade.entryPrice,
        trade.stopLossPrice || null,
        trade.takeProfitPrice || null,
        trade.resultR,
        trade.resultTicks || null,
        trade.resultDollars || null,
        trade.duration || null,
        trade.intent,
        trade.confidenceAtEntry || null,
        trade.emotionalStates || [],
        trade.tpType || null,
        trade.slType || null,
        trade.beType || null,
        trade.breakType || null,
        trade.notes || null,
        trade.tags || [],
      ]
    )
    
    return NextResponse.json({ success: true, trade: result.rows[0] })
  } catch (error: any) {
    console.error("Error creating trade:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// PUT update trade
export async function PUT(request: NextRequest) {
  try {
    const trade: Trade = await request.json()
    
    await pool.query(
      `UPDATE trades SET
        instrument = $2, date = $3, time = $4, session = $5, direction = $6,
        size = $7, entry_price = $8, stop_loss_price = $9, take_profit_price = $10,
        result_r = $11, result_ticks = $12, result_dollars = $13, duration = $14,
        intent = $15, confidence_at_entry = $16, emotional_states = $17,
        tp_type = $18, sl_type = $19, be_type = $20, break_type = $21,
        notes = $22, tags = $23, updated_at = NOW()
      WHERE id = $1`,
      [
        trade.id,
        trade.instrument,
        trade.date,
        trade.time,
        trade.session,
        trade.direction,
        trade.size,
        trade.entryPrice,
        trade.stopLossPrice || null,
        trade.takeProfitPrice || null,
        trade.resultR,
        trade.resultTicks || null,
        trade.resultDollars || null,
        trade.duration || null,
        trade.intent,
        trade.confidenceAtEntry || null,
        trade.emotionalStates || [],
        trade.tpType || null,
        trade.slType || null,
        trade.beType || null,
        trade.breakType || null,
        trade.notes || null,
        trade.tags || [],
      ]
    )
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error updating trade:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// DELETE trade
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json(
        { error: "Trade ID required" },
        { status: 400 }
      )
    }
    
    await pool.query("DELETE FROM trades WHERE id = $1", [id])
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting trade:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

