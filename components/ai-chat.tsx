"use client"

import * as React from "react"
import { v4 as uuidv4 } from "uuid"
import { useDropzone } from "react-dropzone"
import {
  IconSend,
  IconSparkles,
  IconUpload,
  IconX,
  IconMicrophone,
  IconPlayerStop,
  IconPhoto,
  IconLoader2,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useTradeStore } from "@/lib/store"
import type { ChatMessage, Trade } from "@/lib/types"

interface UploadedImage {
  id: string
  url: string
  filename: string
  file: File
}


export function AIChat() {
  const { trades, chatMessages, addChatMessage } = useTradeStore()
  const [input, setInput] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [uploadedImages, setUploadedImages] = React.useState<UploadedImage[]>([])
  const [isRecording, setIsRecording] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Image upload handling
  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const newImages: UploadedImage[] = acceptedFiles.map((file) => ({
      id: uuidv4(),
      url: URL.createObjectURL(file),
      filename: file.name,
      file,
    }))
    setUploadedImages((prev) => [...prev, ...newImages])
  }, [])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] },
    noClick: true,
    noKeyboard: true,
  })

  const removeImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id))
  }

  // Scroll to bottom on new messages
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [chatMessages])

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const handleSend = async () => {
    if (!input.trim() && uploadedImages.length === 0) return

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }
    addChatMessage(userMessage)
    setInput("")
    setIsLoading(true)

    // Simulate AI response - replace with actual Gemini API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Generate mock response based on query
    const mockResponse = generateMockResponse(input, trades)
    
    const assistantMessage: ChatMessage = {
      id: uuidv4(),
      role: "assistant",
      content: mockResponse.content,
      timestamp: new Date(),
      citations: mockResponse.citations,
    }
    addChatMessage(assistantMessage)
    setUploadedImages([])
    setIsLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // Voice recording logic would go here - integrate with ElevenLabs
  }

  return (
    <div className="flex flex-col h-full" {...getRootProps()}>
      <input {...getInputProps()} />
      
      {/* Drag overlay */}
      {isDragActive && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <IconUpload className="size-8 text-primary" />
            </div>
            <p className="text-lg font-medium">Drop images to analyze</p>
            <p className="text-sm text-muted-foreground">
              AI will extract trading insights from your screenshots
            </p>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div ref={scrollRef} className="flex-1 p-6 overflow-auto">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <IconSparkles className="size-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">AI Trading Analyst</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Ask questions about your trading data or upload screenshots for AI analysis.
              All responses are based on your actual trade history.
            </p>

          </div>
        ) : (
          <div className="space-y-6">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-4",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Citations for AI responses */}
                  {message.citations && (
                    <div className="mt-3 pt-3 border-t border-current/10">
                      <div className="flex items-center gap-2 text-xs opacity-80">
                        <span>Based on {message.citations.sampleSize} trades</span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px]",
                            message.citations.confidenceLevel === "high" && "bg-emerald-500/20",
                            message.citations.confidenceLevel === "medium" && "bg-yellow-500/20",
                            message.citations.confidenceLevel === "low" && "bg-red-500/20"
                          )}
                        >
                          {message.citations.confidenceLevel} confidence
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <IconLoader2 className="size-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Analyzing your trading data...
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Uploaded Images Preview */}
      {uploadedImages.length > 0 && (
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-2">
            <IconPhoto className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {uploadedImages.length} image{uploadedImages.length !== 1 ? "s" : ""} to analyze
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {uploadedImages.map((img) => (
              <div
                key={img.id}
                className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.filename}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1 right-1 p-0.5 rounded-full bg-destructive text-destructive-foreground"
                >
                  <IconX className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4">
        <div className="flex items-end gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={open}
            className="shrink-0"
          >
            <IconUpload className="size-4" />
          </Button>
          
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={toggleRecording}
            className="shrink-0"
          >
            {isRecording ? (
              <IconPlayerStop className="size-4" />
            ) : (
              <IconMicrophone className="size-4" />
            )}
          </Button>

          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your trading data..."
              className="min-h-[44px] max-h-[200px] resize-none pr-12"
              rows={1}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && uploadedImages.length === 0)}
            className="shrink-0"
          >
            <IconSend className="size-4" />
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI cites data from your trades • Flags low-confidence conclusions
        </p>
      </div>
    </div>
  )
}

// Mock response generator - replace with actual Gemini API integration
function generateMockResponse(query: string, trades: Trade[]) {
  const lowerQuery = query.toLowerCase()
  
  if (lowerQuery.includes("tp") || lowerQuery.includes("take profit")) {
    const tpStats: Record<string, { count: number; totalR: number }> = {}
    trades.forEach((t) => {
      if (t.tpType) {
        if (!tpStats[t.tpType]) tpStats[t.tpType] = { count: 0, totalR: 0 }
        tpStats[t.tpType].count++
        tpStats[t.tpType].totalR += t.resultR
      }
    })
    
    const sorted = Object.entries(tpStats)
      .map(([type, stats]) => ({ type, avgR: stats.totalR / stats.count, count: stats.count }))
      .sort((a, b) => b.avgR - a.avgR)

    if (sorted.length === 0) {
      return {
        content: "I don't have enough data on TP types yet. Make sure to classify your trades with TP types to get meaningful insights.",
        citations: { tradeIds: [], sampleSize: 0, confidenceLevel: "low" as const },
      }
    }

    return {
      content: `Based on your trading data, here's the TP type performance breakdown:\n\n${sorted
        .map((s, i) => `${i + 1}. **${s.type}**: ${s.avgR > 0 ? "+" : ""}${s.avgR.toFixed(2)}R average (${s.count} trades)`)
        .join("\n")}\n\n${sorted[0].type} shows the highest expectancy in your dataset. However, note that sample size matters - consider this more reliable if you have 20+ trades per category.`,
      citations: {
        tradeIds: trades.filter((t) => t.tpType).map((t) => t.id),
        sampleSize: trades.filter((t) => t.tpType).length,
        confidenceLevel: trades.filter((t) => t.tpType).length >= 20 ? "high" as const : "medium" as const,
      },
    }
  }

  if (lowerQuery.includes("impulse") || lowerQuery.includes("intent")) {
    const planned = trades.filter((t) => t.intent === "Planned")
    const impulse = trades.filter((t) => t.intent === "Impulse")
    
    const plannedWinRate = planned.length > 0 ? (planned.filter((t) => t.resultR > 0).length / planned.length) * 100 : 0
    const impulseWinRate = impulse.length > 0 ? (impulse.filter((t) => t.resultR > 0).length / impulse.length) * 100 : 0

    return {
      content: `Here's how your trade intent affects performance:\n\n**Planned trades**: ${plannedWinRate.toFixed(0)}% win rate (${planned.length} trades)\n**Impulse trades**: ${impulseWinRate.toFixed(0)}% win rate (${impulse.length} trades)\n\n${
        plannedWinRate > impulseWinRate
          ? "Your planned trades significantly outperform impulse trades. This is evidence to trust your process and avoid reactive entries."
          : impulse.length < 5
          ? "Not enough impulse trade data to draw conclusions yet."
          : "Interestingly, your impulse trades perform similarly to planned ones. However, this could be survivor bias - impulse trades often carry more psychological risk."
      }`,
      citations: {
        tradeIds: trades.map((t) => t.id),
        sampleSize: trades.length,
        confidenceLevel: trades.length >= 30 ? "high" as const : "medium" as const,
      },
    }
  }

  if (lowerQuery.includes("session")) {
    const sessionStats: Record<string, { count: number; totalR: number }> = {}
    trades.forEach((t) => {
      if (!sessionStats[t.session]) sessionStats[t.session] = { count: 0, totalR: 0 }
      sessionStats[t.session].count++
      sessionStats[t.session].totalR += t.resultR
    })

    const sorted = Object.entries(sessionStats)
      .map(([session, stats]) => ({ session, avgR: stats.totalR / stats.count, count: stats.count }))
      .sort((a, b) => b.avgR - a.avgR)

    return {
      content: `Session performance breakdown:\n\n${sorted
        .map((s) => `**${s.session}**: ${s.avgR > 0 ? "+" : ""}${s.avgR.toFixed(2)}R average (${s.count} trades)`)
        .join("\n")}\n\n${sorted[0]?.session || "No data"} is your most profitable session. Consider focusing your energy here and reducing activity in underperforming sessions.`,
      citations: {
        tradeIds: trades.map((t) => t.id),
        sampleSize: trades.length,
        confidenceLevel: trades.length >= 20 ? "high" as const : "medium" as const,
      },
    }
  }

  // Default response
  return {
    content: `I analyzed your ${trades.length} trades to answer your question.\n\nTo give you more specific insights, try asking about:\n- TP/SL/BE type performance\n- Session-based analysis\n- Trade intent (planned vs impulse)\n- Break type patterns\n\nYou can also upload chart screenshots for AI-powered pattern recognition.`,
    citations: {
      tradeIds: [],
      sampleSize: trades.length,
      confidenceLevel: "medium" as const,
    },
  }
}

