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
  IconMessageCircle,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Waveform } from "@/components/waveform"
import { useTradeStore } from "@/lib/store"
import type { ChatMessage, Trade } from "@/lib/types"

interface UploadedImage {
  id: string
  url: string
  filename: string
  file: File
}

// No hardcoded example queries

export function AIChatSidebar() {
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
    const currentInput = input
    setInput("")
    setIsLoading(true)

    try {
      // Convert images to base64
      const imagePromises = uploadedImages.map(async (img) => {
        const response = await fetch(img.url)
        const blob = await response.blob()
        return new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1]
            resolve(base64)
          }
          reader.readAsDataURL(blob)
        })
      })

      const imageBase64s = await Promise.all(imagePromises)
      const images = uploadedImages.map((img, idx) => ({
        base64: imageBase64s[idx],
        mimeType: img.file.type || 'image/png',
      }))

      // Call Gemini API with all trade data
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          trades: trades,
          images: images,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
        citations: data.citations,
      }
      addChatMessage(assistantMessage)
    } catch (error) {
      console.error('Error getting AI response:', error)
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
        citations: { tradeIds: [], sampleSize: 0, confidenceLevel: "low" },
      }
      addChatMessage(errorMessage)
    } finally {
      setUploadedImages([])
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleRecording = async () => {
    if (!isRecording) {
      // Start recording
      setIsRecording(true)
    } else {
      // Stop recording
      setIsRecording(false)
      // TODO: Process audio and send to ElevenLabs API
    }
  }

  return (
    <div className="flex flex-col h-full border-l bg-card" {...getRootProps()}>
      <input {...getInputProps()} />
      
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <IconMessageCircle className="size-5 text-primary" />
          <h2 className="font-semibold text-lg">AI Analyst</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Query your trading data
        </p>
      </div>

      {/* Drag overlay */}
      {isDragActive && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <IconUpload className="size-8 text-primary" />
            </div>
            <p className="text-lg font-medium">Drop images to analyze</p>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-auto">
        {chatMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <IconSparkles className="size-6 text-primary" />
            </div>
            <h3 className="text-sm font-medium mb-2">Ask about your trades</h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs">
              Get insights from your trading data
            </p>

          </div>
        ) : (
          <div className="space-y-4">
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
                    "max-w-[85%] rounded-lg p-3 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Citations for AI responses */}
                  {message.citations && (
                    <div className="mt-2 pt-2 border-t border-current/10">
                      <div className="flex items-center gap-2 text-[10px] opacity-80">
                        <span>{message.citations.sampleSize} trades</span>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] px-1 py-0",
                            message.citations.confidenceLevel === "high" && "bg-emerald-500/20",
                            message.citations.confidenceLevel === "medium" && "bg-yellow-500/20",
                            message.citations.confidenceLevel === "low" && "bg-red-500/20"
                          )}
                        >
                          {message.citations.confidenceLevel}
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
                <div className="bg-muted rounded-lg p-3 max-w-[85%]">
                  <div className="flex items-center gap-2">
                    <IconLoader2 className="size-3 animate-spin" />
                    <span className="text-xs text-muted-foreground">
                      Analyzing...
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
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
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 mb-2">
            <IconPhoto className="size-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {uploadedImages.length} image{uploadedImages.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {uploadedImages.map((img) => (
              <div
                key={img.id}
                className="relative shrink-0 w-16 h-16 rounded-md overflow-hidden border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.filename}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-destructive text-destructive-foreground"
                >
                  <IconX className="size-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t">
        {isRecording ? (
          /* Recording Mode - Show Waveform */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium">Recording...</span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={toggleRecording}
              >
                <IconPlayerStop className="size-3.5 mr-2" />
                Stop
              </Button>
            </div>
            <Waveform isActive={isRecording} />
            <p className="text-xs text-center text-muted-foreground">
              Click stop when finished
            </p>
          </div>
        ) : (
          /* Text Input Mode */
          <div className="flex items-end gap-1.5">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={open}
              className="shrink-0 h-8 w-8"
            >
              <IconUpload className="size-3.5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleRecording}
              className="shrink-0 h-8 w-8"
            >
              <IconMicrophone className="size-3.5" />
            </Button>

            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder=""
                className="min-h-[36px] max-h-[120px] resize-none text-sm pr-10"
                rows={1}
              />
            </div>

            <Button
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && uploadedImages.length === 0)}
              size="icon-sm"
              className="shrink-0 h-8 w-8"
            >
              <IconSend className="size-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}


