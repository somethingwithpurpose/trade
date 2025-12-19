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
  IconCheck,
  IconAlertCircle,
  IconTrash,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BulkImage {
  id: string
  url: string
  filename: string
  file: File
  status: 'pending' | 'processing' | 'completed' | 'error'
  extractedData?: {
    instrument?: string
    direction?: string
    breakType?: string
    entryStyle?: string
    marketStructure?: string
    session?: string
    notes?: string
  }
  error?: string
}

export function BulkImageUpload() {
  const [images, setImages] = React.useState<BulkImage[]>([])
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [processingProgress, setProcessingProgress] = React.useState(0)
  const [selectedImages, setSelectedImages] = React.useState<Set<string>>(new Set())

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    const newImages: BulkImage[] = acceptedFiles.map((file) => ({
      id: uuidv4(),
      url: URL.createObjectURL(file),
      filename: file.name,
      file,
      status: 'pending' as const,
    }))
    setImages((prev) => [...prev, ...newImages])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] },
    maxFiles: 100,
  })

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id))
    setSelectedImages((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const toggleSelect = (id: string) => {
    setSelectedImages((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAll = () => {
    setSelectedImages(new Set(images.map((img) => img.id)))
  }

  const clearSelection = () => {
    setSelectedImages(new Set())
  }

  const deleteSelected = () => {
    setImages((prev) => prev.filter((img) => !selectedImages.has(img.id)))
    setSelectedImages(new Set())
  }

  const processImages = async () => {
    const pending = images.filter((img) => img.status === 'pending')
    if (pending.length === 0) return

    setIsProcessing(true)
    setProcessingProgress(0)

    for (let i = 0; i < pending.length; i++) {
      const image = pending[i]
      setImages((prev) =>
        prev.map((img) =>
          img.id === image.id ? { ...img, status: 'processing' as const } : img
        )
      )

      try {
        const formData = new FormData()
        formData.append('file', image.file)

        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          const errorMessage = errorData.error || `Failed to analyze image: ${response.status} ${response.statusText}`
          
          // Check if it's a quota error
          if (errorMessage.includes('quota') || errorMessage.includes('Quota exceeded') || response.status === 429) {
            throw new Error(`API quota exceeded. Please check your billing or try again later.`)
          }
          
          throw new Error(errorMessage)
        }

        const extractedData = await response.json()

        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,
                  status: 'completed' as const,
                  extractedData: {
                    breakType: extractedData.breakType,
                    tpType: extractedData.tpType,
                    slType: extractedData.slType,
                    beType: extractedData.beType,
                    session: extractedData.session,
                    marketStructure: extractedData.marketStructure,
                    entryStyle: extractedData.entryStyle,
                    notes: extractedData.notes,
                  },
                }
              : img
          )
        )
      } catch (error) {
        console.error('Error processing image:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to analyze image'
        
        // Extract a cleaner error message for quota errors
        let displayError = errorMessage
        if (errorMessage.includes('quota') || errorMessage.includes('Quota exceeded')) {
          displayError = 'API quota exceeded. Please check your billing or wait before retrying.'
        } else if (errorMessage.includes('Both APIs')) {
          displayError = 'Both Gemini and OpenAI quotas exceeded. Please check billing or wait before retrying.'
        }
        
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,
                  status: 'error' as const,
                  error: displayError,
                }
              : img
          )
        )
      }

      setProcessingProgress(((i + 1) / pending.length) * 100)
    }

    setIsProcessing(false)
    setProcessingProgress(0)
  }

  const pendingCount = images.filter((img) => img.status === 'pending').length
  const completedCount = images.filter((img) => img.status === 'completed').length

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bulk Image Upload</h2>
          <p className="text-muted-foreground">
            Upload multiple chart screenshots for AI analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          {images.length > 0 && (
            <>
              <Badge variant="secondary">{images.length} images</Badge>
              {completedCount > 0 && (
                <Badge className="bg-emerald-500/20 text-emerald-600">
                  {completedCount} analyzed
                </Badge>
              )}
              {pendingCount > 0 && (
                <Badge variant="outline">{pendingCount} pending</Badge>
              )}
            </>
          )}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-muted p-4">
            <IconUpload className="size-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-medium">
              {isDragActive ? "Drop images here" : "Drag & drop images"}
            </p>
            <p className="text-muted-foreground">
              or click to browse • Up to 100 images at once
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            PNG, JPG, WEBP supported
          </p>
        </div>
      </div>

      {/* Actions Bar */}
      {images.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectedImages.size === images.length ? clearSelection : selectAll}
              >
                {selectedImages.size === images.length ? "Deselect All" : "Select All"}
              </Button>
              {selectedImages.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteSelected}
                >
                  <IconTrash className="size-4 mr-2" />
                  Delete ({selectedImages.size})
                </Button>
              )}
            </div>
          </div>
          <Button
            onClick={processImages}
            disabled={isProcessing || pendingCount === 0}
          >
            {isProcessing ? (
              <IconLoader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <IconSparkles className="size-4 mr-2" />
            )}
            {isProcessing ? "Processing..." : `Analyze ${pendingCount} Images`}
          </Button>
        </div>
      )}

      {/* Processing Progress */}
      {isProcessing && (
        <div className="space-y-2">
          <Progress value={processingProgress} />
          <p className="text-sm text-muted-foreground text-center">
            Processing images with Gemini Vision... {Math.round(processingProgress)}%
          </p>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <ScrollArea className="h-[500px]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pr-4">
            {images.map((image) => (
              <Card
                key={image.id}
                className={cn(
                  "overflow-hidden cursor-pointer transition-all",
                  selectedImages.has(image.id) && "ring-2 ring-primary"
                )}
                onClick={() => toggleSelect(image.id)}
              >
                <div className="relative aspect-video">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.filename}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 left-2">
                    {image.status === 'pending' && (
                      <Badge variant="secondary" className="text-[10px]">
                        <IconPhoto className="size-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                    {image.status === 'processing' && (
                      <Badge className="bg-blue-500/90 text-white text-[10px]">
                        <IconLoader2 className="size-3 mr-1 animate-spin" />
                        Processing
                      </Badge>
                    )}
                    {image.status === 'completed' && (
                      <Badge className="bg-emerald-500/90 text-white text-[10px]">
                        <IconCheck className="size-3 mr-1" />
                        Analyzed
                      </Badge>
                    )}
                    {image.status === 'error' && (
                      <Badge variant="destructive" className="text-[10px]">
                        <IconAlertCircle className="size-3 mr-1" />
                        Error
                      </Badge>
                    )}
                  </div>

                  {/* Selection indicator */}
                  {selectedImages.has(image.id) && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <IconCheck className="size-3 text-primary-foreground" />
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeImage(image.id)
                    }}
                    className="absolute bottom-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:opacity-100"
                  >
                    <IconX className="size-3" />
                  </button>
                </div>

                {/* Extracted Data */}
                {image.extractedData && (
                  <CardContent className="p-3 space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {image.extractedData.instrument && (
                        <Badge variant="outline" className="text-[10px]">
                          {image.extractedData.instrument}
                        </Badge>
                      )}
                      {image.extractedData.direction && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            image.extractedData.direction === "Long"
                              ? "text-emerald-600"
                              : "text-red-600"
                          )}
                        >
                          {image.extractedData.direction}
                        </Badge>
                      )}
                      {image.extractedData.breakType && (
                        <Badge variant="outline" className="text-[10px]">
                          {image.extractedData.breakType}
                        </Badge>
                      )}
                    </div>
                    {image.extractedData.marketStructure && (
                      <p className="text-xs text-muted-foreground truncate">
                        {image.extractedData.marketStructure}
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <IconPhoto className="size-12 mx-auto mb-4 opacity-50" />
          <p>No images uploaded yet</p>
          <p className="text-sm">Drop images above or click to browse</p>
        </div>
      )}
    </div>
  )
}

