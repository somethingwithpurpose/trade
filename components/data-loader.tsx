"use client"

import * as React from "react"
import { useTradeStore } from "@/lib/store"

export function DataLoader() {
  const { loadTrades, loadChatMessages } = useTradeStore()
  const [hasLoaded, setHasLoaded] = React.useState(false)

  React.useEffect(() => {
    if (!hasLoaded) {
      loadTrades().catch(console.error)
      loadChatMessages().catch(console.error)
      setHasLoaded(true)
    }
  }, [hasLoaded, loadTrades, loadChatMessages])

  return null
}

