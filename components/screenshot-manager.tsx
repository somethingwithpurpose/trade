"use client"

import * as React from "react"
import {
  IconPhoto,
  IconSparkles,
  IconLoader2,
  IconRefresh,
  IconCheck,
  IconX,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Screenshot {
  id: string
  url: string
  filename: string
  trade_id?: string
  ai_processed: boolean
  ai_extracted_data?: any
  uploaded_at: string
}

export function ScreenshotManager() {
  const [screenshots, setScreenshots] = React.useState<Screenshot[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [analyzingId, setAnalyzingId] = React.useState<string | null>(null)

  const loadScreenshots = React.useCallback(async () => {
    try {
      const response = await fetch("/api/screenshots/save")
      if (response.ok) {
        const data = await response.json()
        setScreenshots(data)
      }
    } catch (error) {
      console.error("Failed to load screenshots:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadScreenshots()
  }, [loadScreenshots])

  const reAnalyze = async (screenshotId: string) => {
    setAnalyzingId(screenshotId)
    try {
      const response = await fetch("/api/screenshots/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenshotId }),
      })

      if (!response.ok) {
        throw new Error("Failed to re-analyze")
      }

      await loadScreenshots()
    } catch (error) {
      console.error("Failed to re-analyze:", error)
    } finally {
      setAnalyzingId(null)
    }
  }

  const applyToTrade = async (screenshotId: string, tradeId: string) => {
    try {
      const response = await fetch("/api/trades/update-from-screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenshotId, tradeId }),
      })

      if (!response.ok) {
        throw new Error("Failed to apply to trade")
      }

      alert("Trade updated successfully!")
    } catch (error) {
      console.error("Failed to apply to trade:", error)
      alert("Failed to update trade")
    }
  }

  if (isLoading) {
    return <div className="p-4 text-muted-foreground">Loading screenshots...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Saved Screenshots</h3>
        <Button size="sm" variant="outline" onClick={loadScreenshots}>
          Refresh
        </Button>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-2 gap-4">
          {screenshots.map((screenshot) => (
            <Card key={screenshot.id}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Image Preview */}
                  <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={screenshot.url}
                      alt={screenshot.filename}
                      className="w-full h-full object-cover"
                    />
                    {screenshot.ai_processed && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-emerald-500/90 text-white">
                          <IconSparkles className="size-3 mr-1" />
                          Analyzed
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Filename */}
                  <p className="text-sm font-medium truncate">{screenshot.filename}</p>

                  {/* Extracted Data */}
                  {screenshot.ai_processed && screenshot.ai_extracted_data && (
                    <div className="space-y-1 text-xs">
                      {screenshot.ai_extracted_data.breakType && (
                        <div>
                          <span className="text-muted-foreground">Break:</span>{" "}
                          <Badge variant="outline" className="ml-1">
                            {screenshot.ai_extracted_data.breakType}
                          </Badge>
                        </div>
                      )}
                      {screenshot.ai_extracted_data.tpType && (
                        <div>
                          <span className="text-muted-foreground">TP:</span>{" "}
                          <Badge variant="outline" className="ml-1">
                            {screenshot.ai_extracted_data.tpType}
                          </Badge>
                        </div>
                      )}
                      {screenshot.ai_extracted_data.session && (
                        <div>
                          <span className="text-muted-foreground">Session:</span>{" "}
                          {screenshot.ai_extracted_data.session}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => reAnalyze(screenshot.id)}
                      disabled={analyzingId === screenshot.id}
                      className="flex-1"
                    >
                      {analyzingId === screenshot.id ? (
                        <IconLoader2 className="size-4 mr-2 animate-spin" />
                      ) : (
                        <IconRefresh className="size-4 mr-2" />
                      )}
                      Re-analyze
                    </Button>
                    {screenshot.trade_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => applyToTrade(screenshot.id, screenshot.trade_id!)}
                      >
                        <IconCheck className="size-4 mr-2" />
                        Apply
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {screenshots.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <IconPhoto className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No screenshots saved yet</p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

