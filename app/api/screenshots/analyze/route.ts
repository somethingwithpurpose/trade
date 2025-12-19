import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

// POST re-analyze an existing screenshot
export async function POST(request: NextRequest) {
  try {
    const { screenshotId } = await request.json()
    
    if (!screenshotId) {
      return NextResponse.json(
        { error: "Screenshot ID required" },
        { status: 400 }
      )
    }
    
    // Get screenshot from database
    const screenshotResult = await pool.query(
      `SELECT * FROM screenshots WHERE id = $1`,
      [screenshotId]
    )
    
    if (screenshotResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Screenshot not found" },
        { status: 404 }
      )
    }
    
    const screenshot = screenshotResult.rows[0]
    
    // Fetch the image from URL
    const imageResponse = await fetch(screenshot.url)
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image from URL" },
        { status: 400 }
      )
    }
    
    const blob = await imageResponse.blob()
    const arrayBuffer = await blob.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    
    // Analyze image using the analyze-image API endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    
    const analyzeResponse = await fetch(`${baseUrl}/api/analyze-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        base64,
        mimeType: screenshot.mime_type || "image/png",
        fileSize: screenshot.file_size,
      }),
    })
    
    if (!analyzeResponse.ok) {
      const errorData = await analyzeResponse.json().catch(() => ({}))
      throw new Error(errorData.error || "Failed to analyze image")
    }
    
    const extractedData = await analyzeResponse.json()
    
    // Update screenshot with new analysis
    const updateResult = await pool.query(
      `UPDATE screenshots 
       SET ai_processed = true, 
           ai_extracted_data = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(extractedData), screenshotId]
    )
    
    return NextResponse.json({ 
      success: true, 
      screenshot: updateResult.rows[0],
      extractedData 
    })
  } catch (error: any) {
    console.error("Error re-analyzing screenshot:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

