import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    const schemaPath = path.join(process.cwd(), "database", "schema.sql")
    const schema = fs.readFileSync(schemaPath, "utf-8")
    
    // Split by semicolons and execute each statement
    const statements = schema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"))
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.query(statement)
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Database initialized successfully" 
    })
  } catch (error: any) {
    console.error("Database initialization error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    )
  }
}

