"use client"

import * as React from "react"
import { IconKey, IconBrandGoogle, IconVolume } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  const [geminiKey, setGeminiKey] = React.useState("")
  const [elevenLabsKey, setElevenLabsKey] = React.useState("")
  const [darkMode, setDarkMode] = React.useState(true)
  const [voiceEnabled, setVoiceEnabled] = React.useState(false)

  const handleSaveKeys = () => {
    // Save API keys to localStorage or backend
    localStorage.setItem("gemini_api_key", geminiKey)
    localStorage.setItem("elevenlabs_api_key", elevenLabsKey)
    alert("API keys saved successfully!")
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your EdgeLab preferences and API integrations
        </p>
      </div>

      <div className="space-y-6">
        {/* API Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconKey className="size-5" />
              API Integrations
            </CardTitle>
            <CardDescription>
              Connect your AI services for screenshot analysis and voice features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gemini-key" className="flex items-center gap-2">
                <IconBrandGoogle className="size-4" />
                Gemini API Key
              </Label>
              <Input
                id="gemini-key"
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
              />
              <p className="text-xs text-muted-foreground">
                Used for screenshot analysis and AI chat. Get your key from{" "}
                <a
                  href="https://ai.google.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google AI Studio
                </a>
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="elevenlabs-key" className="flex items-center gap-2">
                <IconVolume className="size-4" />
                ElevenLabs API Key
              </Label>
              <Input
                id="elevenlabs-key"
                type="password"
                value={elevenLabsKey}
                onChange={(e) => setElevenLabsKey(e.target.value)}
                placeholder="Enter your ElevenLabs API key"
              />
              <p className="text-xs text-muted-foreground">
                Used for voice mode in AI chat. Get your key from{" "}
                <a
                  href="https://elevenlabs.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  ElevenLabs
                </a>
              </p>
            </div>

            <Button onClick={handleSaveKeys}>Save API Keys</Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Customize your EdgeLab experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Dark Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Enable dark theme for the interface
                </p>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Voice Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Enable voice input and responses in AI chat
                </p>
              </div>
              <Switch
                checked={voiceEnabled}
                onCheckedChange={setVoiceEnabled}
                disabled={!elevenLabsKey}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Export or clear your trading data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button variant="outline">
                Export Trades (JSON)
              </Button>
              <Button variant="outline">
                Export Trades (CSV)
              </Button>
            </div>

            <Separator />

            <div>
              <Button variant="destructive">
                Clear All Data
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will permanently delete all trades and chat history
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

