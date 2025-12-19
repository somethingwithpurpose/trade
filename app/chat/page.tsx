"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AIChat } from "@/components/ai-chat"
import { BulkImageUpload } from "@/components/bulk-image-upload"
import { IconMessageCircle, IconUpload } from "@tabler/icons-react"

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="p-6 pb-0">
        <h1 className="text-3xl font-bold tracking-tight">AI Analysis</h1>
        <p className="text-muted-foreground">
          Query your trading data or upload screenshots for AI-powered insights
        </p>
      </div>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col p-6 pt-4">
        <TabsList className="w-fit">
          <TabsTrigger value="chat">
            <IconMessageCircle className="size-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="upload">
            <IconUpload className="size-4 mr-2" />
            Bulk Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 mt-4 border rounded-lg overflow-hidden">
          <AIChat />
        </TabsContent>

        <TabsContent value="upload" className="flex-1 mt-4">
          <BulkImageUpload />
        </TabsContent>
      </Tabs>
    </div>
  )
}

