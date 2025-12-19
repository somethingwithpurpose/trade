"use client"

import * as React from "react"
import { IconSparkles, IconMessageCircle, IconX } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { AIChatSidebar } from "@/components/ai-chat-sidebar"

interface AIInsightPanelProps {
  date: Date
}

export function AIInsightPanel({ date }: AIInsightPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger
        className="w-full flex items-center justify-between rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <IconSparkles className="size-4 text-primary" />
          <span>AI Insights</span>
        </div>
        <IconMessageCircle className={cn(
          "size-4 transition-transform",
          isOpen && "rotate-180"
        )} />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <Card className="border-2">
          <div className="h-[400px]">
            <AIChatSidebar />
          </div>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  )
}

