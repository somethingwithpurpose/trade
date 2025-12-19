"use client"

import { DataTablesIntegrated } from "@/components/data-tables-integrated"
import { AIChatSidebar } from "@/components/ai-chat-sidebar"

export default function DataPage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Trade Evidence</h1>
          <p className="text-muted-foreground">
            Analyze your trading data with filters and aggregations
          </p>
        </div>
        <DataTablesIntegrated />
      </div>

      {/* AI Chat Sidebar */}
      <div className="w-[360px] h-full border-l">
        <AIChatSidebar />
      </div>
    </div>
  )
}

