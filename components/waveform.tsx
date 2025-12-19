"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface WaveformProps {
  isActive: boolean
  className?: string
}

export function Waveform({ isActive, className }: WaveformProps) {
  const [bars, setBars] = React.useState<number[]>(Array.from({ length: 50 }, () => 0))
  const audioContextRef = React.useRef<AudioContext | null>(null)
  const analyserRef = React.useRef<AnalyserNode | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const animationFrameRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (isActive) {
      startRecording()
    } else {
      stopRecording()
    }

    return () => {
      stopRecording()
    }
  }, [isActive])

  const startRecording = async () => {
    try {
      // Request microphone access with optimal settings for voice
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
        } 
      })
      streamRef.current = stream

      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 44100,
      })
      audioContextRef.current = audioContext

      // Create analyser with optimal settings for voice visualization
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 1024 // Larger FFT for better frequency resolution
      analyser.smoothingTimeConstant = 0.1 // Very low smoothing for immediate response
      analyser.minDecibels = -90
      analyser.maxDecibels = -10
      analyserRef.current = analyser

      // Create gain node to amplify the signal
      const gainNode = audioContext.createGain()
      gainNode.gain.value = 3.0 // Higher amplification for voice

      // Connect microphone -> gain -> analyser
      const microphone = audioContext.createMediaStreamSource(stream)
      microphone.connect(gainNode)
      gainNode.connect(analyser)

      // Start analyzing audio
      analyzeAudio()
    } catch (error) {
      console.error("Error accessing microphone:", error)
      // Fallback to animated bars if microphone access fails
      animateFallback()
    }
  }

  const analyzeAudio = () => {
    if (!analyserRef.current) return

    const bufferLength = analyserRef.current.frequencyBinCount
    const frequencyData = new Uint8Array(bufferLength)
    const timeData = new Uint8Array(bufferLength)

    const updateBars = () => {
      if (!analyserRef.current || !isActive) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        return
      }

      // Get both frequency and time domain data
      analyserRef.current.getByteFrequencyData(frequencyData)
      analyserRef.current.getByteTimeDomainData(timeData)

      // Calculate overall volume from time domain
      let sum = 0
      let max = 0
      for (let i = 0; i < timeData.length; i++) {
        const value = Math.abs(timeData[i] - 128) / 128
        sum += value
        max = Math.max(max, value)
      }
      const averageVolume = sum / timeData.length
      const peakVolume = max

      // Convert to bar heights (50 bars)
      const barCount = 50
      const step = Math.floor(bufferLength / barCount)
      const newBars: number[] = []

      for (let i = 0; i < barCount; i++) {
        const index = i * step
        
        // Get frequency value
        const freqValue = frequencyData[index] || 0
        
        // Get time domain value for this position
        const timeIndex = Math.floor((i / barCount) * timeData.length)
        const timeValue = Math.abs(timeData[timeIndex] - 128) / 128
        
        // Combine frequency and time domain with emphasis on voice frequencies (300-3400 Hz)
        // Voice frequencies are roughly in the middle of the spectrum
        const voiceWeight = i > barCount * 0.2 && i < barCount * 0.8 ? 1.5 : 0.8
        const mixed = ((freqValue / 255) * 0.6 + timeValue * 0.4) * voiceWeight
        
        // Amplify and scale for better visual response
        const amplified = Math.min(mixed * 4.0 + averageVolume * 1.5 + peakVolume * 0.5, 1)
        
        // Apply exponential scaling for better visual response to voice
        const scaled = Math.pow(Math.max(amplified, 0.05), 0.6)
        
        newBars.push(Math.max(scaled, 0.15)) // Higher minimum for visibility
      }

      setBars(newBars)
      animationFrameRef.current = requestAnimationFrame(updateBars)
    }

    updateBars()
  }

  const animateFallback = () => {
    const updateBars = () => {
      if (!isActive) return
      setBars((prev) =>
        prev.map(() => Math.random() * 0.7 + 0.3)
      )
      animationFrameRef.current = requestAnimationFrame(updateBars)
    }
    updateBars()
  }

  const stopRecording = () => {
    // Stop animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Stop microphone stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error)
      audioContextRef.current = null
    }

    // Reset bars
    setBars(Array.from({ length: 50 }, () => 0))
    analyserRef.current = null
  }

  return (
    <div
      className={cn(
        "flex items-end justify-center gap-0.5 h-16 px-4",
        className
      )}
    >
      {bars.map((height, index) => {
        const barHeight = Math.max(height * 100, 15) // Minimum 15% height
        return (
          <div
            key={index}
            className="bg-primary rounded-sm transition-none"
            style={{
              width: "3px",
              height: `${barHeight}%`,
              minHeight: isActive ? "6px" : "0px",
              opacity: isActive ? Math.min(height + 0.2, 1) : 0,
            }}
          />
        )
      })}
    </div>
  )
}
