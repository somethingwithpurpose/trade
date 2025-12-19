"use client"

import * as React from "react"
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, isToday } from "date-fns"
import { IconChevronLeft, IconChevronRight, IconPlus } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useTradeStore } from "@/lib/store"
import { CalendarSkeleton } from "@/components/calendar-skeleton"
import type { Trade } from "@/lib/types"

interface TradeCalendarProps {
  onDateSelect: (date: Date) => void
  onAddTrade: (date: Date) => void
}

export function TradeCalendar({ onDateSelect, onAddTrade }: TradeCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [isLoading, setIsLoading] = React.useState(true)
  const { trades, selectedDate, setSelectedDate } = useTradeStore()

  React.useEffect(() => {
    // Simulate loading state on mount
    const timer = setTimeout(() => setIsLoading(false), 200)
    return () => clearTimeout(timer)
  }, [])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getTradesForDay = (day: Date): Trade[] => {
    return trades.filter((trade) => isSameDay(new Date(trade.date), day))
  }

  const getDayStats = (day: Date) => {
    const dayTrades = getTradesForDay(day)
    if (dayTrades.length === 0) return null
    
    const totalR = dayTrades.reduce((sum, t) => sum + t.resultR, 0)
    const wins = dayTrades.filter((t) => t.resultR > 0).length
    
    return {
      count: dayTrades.length,
      totalR,
      wins,
      losses: dayTrades.length - wins,
      isPositive: totalR > 0,
      isNegative: totalR < 0,
    }
  }

  const handleDayClick = (day: Date) => {
    setSelectedDate(day)
    onDateSelect(day)
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (isLoading) {
    return <CalendarSkeleton />
  }

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold tracking-tight">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <IconChevronLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <IconChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const stats = getDayStats(day)
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
          const isSelected = isSameDay(day, selectedDate)
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              className={cn(
                "group relative min-h-[100px] p-2 text-left transition-all border border-transparent hover:border-border hover:bg-muted/50 rounded-md",
                !isCurrentMonth && "text-muted-foreground/50",
                isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                isToday(day) && "bg-muted/30"
              )}
            >
              {/* Day Number */}
              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    "text-sm font-medium",
                    isToday(day) && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                  )}
                >
                  {format(day, "d")}
                </span>
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation()
                    onAddTrade(day)
                  }}
                >
                  <IconPlus className="size-3" />
                </button>
              </div>

              {/* Trade Stats */}
              {stats && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-1">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        stats.isPositive && "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                        stats.isNegative && "bg-red-500/20 text-red-600 dark:text-red-400"
                      )}
                    >
                      {stats.totalR > 0 ? "+" : ""}{stats.totalR.toFixed(1)}R
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="text-emerald-600 dark:text-emerald-400">{stats.wins}W</span>
                    <span>/</span>
                    <span className="text-red-600 dark:text-red-400">{stats.losses}L</span>
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

