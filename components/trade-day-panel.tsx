"use client"

import * as React from "react"
import { format } from "date-fns"
import {
  IconTrendingUp,
  IconTrendingDown,
  IconPlus,
  IconClock,
  IconPhoto,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useTradeStore } from "@/lib/store"
import { AIInsightPanel } from "@/components/ai-insight-panel"
import { TradeListSkeleton } from "@/components/trade-list-skeleton"
import type { Trade } from "@/lib/types"

interface TradeDayPanelProps {
  date: Date
  onEditTrade: (trade: Trade) => void
  onAddTrade: () => void
}

export function TradeDayPanel({ date, onEditTrade, onAddTrade }: TradeDayPanelProps) {
  const { getDaySummary, trades } = useTradeStore()
  const [isLoading, setIsLoading] = React.useState(true)
  const summary = getDaySummary(date)

  React.useEffect(() => {
    // Simulate loading state on mount
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [date])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
        <Separator />
        <Skeleton className="h-10 w-full" />
        <Separator />
        <TradeListSkeleton count={2} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {format(date, "EEEE, MMMM d")}
          </h2>
          <p className="text-muted-foreground">
            {summary.tradeCount} trade{summary.tradeCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={onAddTrade} size="sm">
          <IconPlus className="size-4 mr-2" />
          Add Trade
        </Button>
      </div>

      {/* Day Stats */}
      {summary.tradeCount === 0 ? (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total R
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                —
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Avg R
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                —
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                —
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Max DD
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                —
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total R
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "text-2xl font-bold",
                  summary.totalR > 0 && "text-emerald-600 dark:text-emerald-400",
                  summary.totalR < 0 && "text-red-600 dark:text-red-400"
                )}
              >
                {summary.totalR > 0 ? "+" : ""}
                {summary.totalR.toFixed(2)}R
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Avg R
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "text-2xl font-bold",
                  summary.avgR > 0 && "text-emerald-600 dark:text-emerald-400",
                  summary.avgR < 0 && "text-red-600 dark:text-red-400"
                )}
              >
                {summary.avgR > 0 ? "+" : ""}
                {summary.avgR.toFixed(2)}R
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.winRate.toFixed(0)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Max DD
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                -{summary.maxDrawdown.toFixed(2)}R
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Separator />

      {/* AI Insights Panel */}
      <AIInsightPanel date={date} />

      <Separator />

      {/* Trade List */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Trades
        </h3>

        {summary.trades.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <IconTrendingUp className="size-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No trades yet</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">
              Add your first trade for this day
            </p>
            <Button onClick={onAddTrade} size="sm">
              <IconPlus className="size-4 mr-2" />
              Add Trade
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {summary.trades.map((trade) => (
              <button
                key={trade.id}
                onClick={() => onEditTrade(trade)}
                className="w-full text-left p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-md",
                        trade.direction === "Long"
                          ? "bg-emerald-500/10"
                          : "bg-red-500/10"
                      )}
                    >
                      {trade.direction === "Long" ? (
                        <IconTrendingUp
                          className={cn(
                            "size-5",
                            "text-emerald-600 dark:text-emerald-400"
                          )}
                        />
                      ) : (
                        <IconTrendingDown
                          className={cn(
                            "size-5",
                            "text-red-600 dark:text-red-400"
                          )}
                        />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{trade.instrument}</span>
                        <Badge variant="secondary" className="text-xs">
                          {trade.session}
                        </Badge>
                        {trade.breakType && (
                          <Badge variant="outline" className="text-xs">
                            {trade.breakType}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <IconClock className="size-3" />
                          {trade.time}
                        </span>
                        <span>{trade.size} contract{trade.size !== 1 ? "s" : ""}</span>
                        <span>@ {trade.entryPrice}</span>
                        {trade.screenshots.length > 0 && (
                          <span className="flex items-center gap-1">
                            <IconPhoto className="size-3" />
                            {trade.screenshots.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={cn(
                        "text-lg font-bold",
                        trade.resultR > 0 && "text-emerald-600 dark:text-emerald-400",
                        trade.resultR < 0 && "text-red-600 dark:text-red-400"
                      )}
                    >
                      {trade.resultR > 0 ? "+" : ""}
                      {trade.resultR.toFixed(2)}R
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {trade.resultDollars > 0 ? "+" : ""}${trade.resultDollars.toFixed(0)}
                    </div>
                  </div>
                </div>

                {/* Intent & Confidence */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <Badge
                    variant={trade.intent === "Planned" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {trade.intent}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Confidence: {trade.confidenceAtEntry}/5
                  </span>
                  {trade.tpType && (
                    <Badge variant="outline" className="text-xs">
                      {trade.tpType}
                    </Badge>
                  )}
                  {trade.beType && trade.beType !== "No BE" && (
                    <Badge variant="outline" className="text-xs">
                      {trade.beType}
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

