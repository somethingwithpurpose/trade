"use client"

import * as React from "react"
import { useDropzone } from "react-dropzone"
import { v4 as uuidv4 } from "uuid"
import {
  IconUpload,
  IconPhoto,
  IconX,
  IconSparkles,
  IconLoader2,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { TradeScreenshot } from "@/lib/types"

interface ImageUploaderProps {
  screenshots: TradeScreenshot[]
  onScreenshotsChange: (screenshots: TradeScreenshot[]) => void
  maxFiles?: number
}

export function ImageUploader({
  screenshots,
  onScreenshotsChange,
  maxFiles = 50,
}: ImageUploaderProps) {
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [processingProgress, setProcessingProgress] = React.useState(0)

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      const newScreenshots: TradeScreenshot[] = acceptedFiles.map((file) => ({
        id: uuidv4(),
        url: URL.createObjectURL(file),
        filename: file.name,
        uploadedAt: new Date(),
        type: "chart" as const,
        aiProcessed: false,
      }))

      onScreenshotsChange([...screenshots, ...newScreenshots])
    },
    [screenshots, onScreenshotsChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
    },
    maxFiles: maxFiles - screenshots.length,
    disabled: screenshots.length >= maxFiles,
  })

  const removeScreenshot = (id: string) => {
    onScreenshotsChange(screenshots.filter((s) => s.id !== id))
  }

  const processWithAI = async () => {
    setIsProcessing(true)
    setProcessingProgress(0)

    const unprocessed = screenshots.filter((s) => !s.aiProcessed)
    
    for (let i = 0; i < unprocessed.length; i++) {
      const screenshot = unprocessed[i]
      
      try {
        // Convert blob URL to File object
        const response = await fetch(screenshot.url)
        const blob = await response.blob()
        const file = new File([blob], screenshot.filename, { type: blob.type })
        
        // Call Gemini Vision API
        const formData = new FormData()
        formData.append('file', file)
        
        const apiResponse = await fetch('/api/analyze-image', {
          method: 'POST',
          body: formData,
        })
        
        if (!apiResponse.ok) {
          const errorData = await apiResponse.json()
          throw new Error(errorData.error || 'Failed to analyze image')
        }
        
        const extractedData = await apiResponse.json()
        
        const updatedScreenshots = screenshots.map((s) =>
          s.id === screenshot.id
            ? {
                ...s,
                aiProcessed: true,
                aiExtractedData: {
                  marketStructure: extractedData.marketStructure || undefined,
                  breakType: extractedData.breakType || undefined,
                  entryStyle: extractedData.entryStyle || undefined,
                  htfAlignment: extractedData.htfLtfAlignment === 'Aligned' ? 'HTF Aligned' as const : extractedData.htfLtfAlignment === 'Contrary' ? 'Counter HTF' as const : undefined,
                  sessionContext: extractedData.session || undefined,
                  notes: extractedData.notes || undefined,
                },
              }
            : s
        )
        onScreenshotsChange(updatedScreenshots)
      } catch (error) {
        console.error('Error processing screenshot:', error)
        // Mark as processed but with error - could add error state if needed
        const updatedScreenshots = screenshots.map((s) =>
          s.id === screenshot.id
            ? {
                ...s,
                aiProcessed: true,
                aiExtractedData: {
                  notes: `Error: ${error instanceof Error ? error.message : 'Failed to process'}`,
                },
              }
            : s
        )
        onScreenshotsChange(updatedScreenshots)
      }
      
      setProcessingProgress(((i + 1) / unprocessed.length) * 100)
    }

    setIsProcessing(false)
  }

  const unprocessedCount = screenshots.filter((s) => !s.aiProcessed).length

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          screenshots.length >= maxFiles && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-muted p-3">
            <IconUpload className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">
              {isDragActive ? "Drop images here" : "Drag & drop images"}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse • Supports bulk upload
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, WEBP up to {maxFiles} files
          </p>
        </div>
      </div>

      {/* AI Processing Button */}
      {screenshots.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {screenshots.length} image{screenshots.length !== 1 ? "s" : ""} uploaded
            {unprocessedCount > 0 && (
              <span className="ml-1">• {unprocessedCount} pending AI analysis</span>
            )}
          </div>
          {unprocessedCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={processWithAI}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <IconLoader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <IconSparkles className="size-4 mr-2" />
              )}
              Analyze with AI
            </Button>
          )}
        </div>
      )}

      {/* Processing Progress */}
      {isProcessing && (
        <div className="space-y-2">
          <Progress value={processingProgress} />
          <p className="text-xs text-muted-foreground text-center">
            Processing images with Gemini Vision...
          </p>
        </div>
      )}

      {/* Screenshot Grid */}
      {screenshots.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {screenshots.map((screenshot) => (
            <div
              key={screenshot.id}
              className="relative group rounded-lg overflow-hidden border bg-muted aspect-video"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshot.url}
                alt={screenshot.filename}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  size="icon-sm"
                  variant="destructive"
                  onClick={() => removeScreenshot(screenshot.id)}
                >
                  <IconX className="size-4" />
                </Button>
              </div>

              {/* Status Badge */}
              <div className="absolute top-2 left-2">
                {screenshot.aiProcessed ? (
                  <Badge className="bg-emerald-500/90 text-white text-[10px]">
                    <IconSparkles className="size-3 mr-1" />
                    AI Analyzed
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">
                    <IconPhoto className="size-3 mr-1" />
                    Pending
                  </Badge>
                )}
              </div>

              {/* Filename */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-[10px] text-white truncate">
                  {screenshot.filename}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Extracted Data Preview */}
      {screenshots.some((s) => s.aiProcessed && s.aiExtractedData) && (
        <div className="space-y-2 p-4 rounded-lg bg-muted/50 border">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <IconSparkles className="size-4 text-primary" />
            AI-Extracted Insights
          </h4>
          {screenshots
            .filter((s) => s.aiProcessed && s.aiExtractedData)
            .slice(0, 1)
            .map((s) => (
              <div key={s.id} className="text-sm space-y-1">
                {s.aiExtractedData?.marketStructure && (
                  <p>
                    <span className="text-muted-foreground">Structure:</span>{" "}
                    {s.aiExtractedData.marketStructure}
                  </p>
                )}
                {s.aiExtractedData?.breakType && (
                  <p>
                    <span className="text-muted-foreground">Break Type:</span>{" "}
                    <Badge variant="outline" className="ml-1">
                      {s.aiExtractedData.breakType}
                    </Badge>
                  </p>
                )}
                {s.aiExtractedData?.htfAlignment && (
                  <p>
                    <span className="text-muted-foreground">HTF Alignment:</span>{" "}
                    <Badge variant="outline" className="ml-1">
                      {s.aiExtractedData.htfAlignment}
                    </Badge>
                  </p>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

