import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import type { ChatMessage } from "@/lib/types"

// GET all chat messages
export async function GET() {
  try {
    const result = await pool.query(
      `SELECT * FROM chat_messages ORDER BY timestamp ASC`
    )
    
    const messages = result.rows.map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      citations: row.citations,
      timestamp: new Date(row.timestamp),
    }))
    
    return NextResponse.json(messages)
  } catch (error: any) {
    console.error("Error fetching chat messages:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST create chat message
export async function POST(request: NextRequest) {
  try {
    const message: ChatMessage = await request.json()
    
    const result = await pool.query(
      `INSERT INTO chat_messages (id, role, content, citations, timestamp)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        message.id,
        message.role,
        message.content,
        message.citations ? JSON.stringify(message.citations) : null,
        message.timestamp,
      ]
    )
    
    return NextResponse.json({ success: true, message: result.rows[0] })
  } catch (error: any) {
    console.error("Error creating chat message:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

