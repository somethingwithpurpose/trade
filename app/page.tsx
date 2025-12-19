"use client"

import * as React from "react"

import { TradeCalendar } from "@/components/trade-calendar"
import { TradeDayPanel } from "@/components/trade-day-panel"
import { TradeFormSheet } from "@/components/trade-form-sheet"
import { useTradeStore } from "@/lib/store"
import type { Trade } from "@/lib/types"

export default function CalendarPage() {
  const { selectedDate, setSelectedDate } = useTradeStore()
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingTrade, setEditingTrade] = React.useState<Trade | null>(null)
  const [formDefaultDate, setFormDefaultDate] = React.useState(new Date())

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleAddTrade = (date: Date) => {
    setEditingTrade(null)
    setFormDefaultDate(date)
    setIsFormOpen(true)
  }

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade)
    setFormDefaultDate(new Date(trade.date))
    setIsFormOpen(true)
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Calendar Panel */}
      <div className="flex-1 p-6 overflow-auto border-r">
        <TradeCalendar
          onDateSelect={handleDateSelect}
          onAddTrade={handleAddTrade}
        />
      </div>

      {/* Day Panel with integrated AI */}
      <div className="w-[600px] p-6 overflow-auto bg-muted/30">
        <TradeDayPanel
          date={selectedDate}
          onEditTrade={handleEditTrade}
          onAddTrade={() => handleAddTrade(selectedDate)}
        />
      </div>

      {/* Trade Form Sheet */}
      <TradeFormSheet
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        trade={editingTrade}
        defaultDate={formDefaultDate}
      />
    </div>
  )
}
