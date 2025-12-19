"use client"

import * as React from "react"
import { IconChartBar, IconClock, IconTarget, IconTrendingUp, IconPlus } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTradeStore } from "@/lib/store"

export default function PerformancePage() {
  const { trades } = useTradeStore()

  // Calculate overall stats
  const stats = React.useMemo(() => {
    const wins = trades.filter((t) => t.resultR > 0)
    const losses = trades.filter((t) => t.resultR < 0)
    const totalR = trades.reduce((sum, t) => sum + t.resultR, 0)
    const avgR = trades.length > 0 ? totalR / trades.length : 0
    const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0
    
    // Average win and loss
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.resultR, 0) / wins.length : 0
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.resultR, 0) / losses.length) : 0
    
    // Profit factor
    const grossProfit = wins.reduce((sum, t) => sum + t.resultR, 0)
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.resultR, 0))
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0
    
    // Expectancy
    const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss

    // Behavioral stats
    const plannedTrades = trades.filter((t) => t.intent === "Planned")
    const impulseTrades = trades.filter((t) => t.intent !== "Planned")
    const plannedWinRate = plannedTrades.length > 0 
      ? (plannedTrades.filter((t) => t.resultR > 0).length / plannedTrades.length) * 100 
      : 0
    const impulseWinRate = impulseTrades.length > 0 
      ? (impulseTrades.filter((t) => t.resultR > 0).length / impulseTrades.length) * 100 
      : 0

    return {
      totalTrades: trades.length,
      totalR,
      avgR,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      expectancy,
      wins: wins.length,
      losses: losses.length,
      plannedTrades: plannedTrades.length,
      impulseTrades: impulseTrades.length,
      plannedWinRate,
      impulseWinRate,
    }
  }, [trades])

  // Session performance
  const sessionPerformance = React.useMemo(() => {
    const bySession: Record<string, { trades: number; totalR: number; wins: number }> = {}
    
    trades.forEach((trade) => {
      if (!bySession[trade.session]) {
        bySession[trade.session] = { trades: 0, totalR: 0, wins: 0 }
      }
      bySession[trade.session].trades++
      bySession[trade.session].totalR += trade.resultR
      if (trade.resultR > 0) bySession[trade.session].wins++
    })

    return Object.entries(bySession)
      .map(([session, data]) => ({
        session,
        trades: data.trades,
        totalR: data.totalR,
        avgR: data.totalR / data.trades,
        winRate: (data.wins / data.trades) * 100,
      }))
      .sort((a, b) => b.totalR - a.totalR)
  }, [trades])

  // Empty state
  if (trades.length === 0) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <IconTrendingUp className="size-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">No Performance Data Yet</h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            Start logging trades to see performance analytics, behavioral insights, and strategy metrics.
          </p>
          <Button onClick={() => window.location.href = '/'}>
            <IconPlus className="size-4 mr-2" />
            Add Your First Trade
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
        <p className="text-muted-foreground">
          Strategy performance metrics and behavioral insights
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <IconTrendingUp className="size-4" />
              Total R
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.totalTrades === 0 ? (
              <>
                <div className="text-3xl font-bold text-muted-foreground">—</div>
                <p className="text-xs text-muted-foreground mt-1">No trades</p>
              </>
            ) : (
              <>
                <div className={cn(
                  "text-3xl font-bold",
                  stats.totalR > 0 && "text-emerald-600",
                  stats.totalR < 0 && "text-red-600"
                )}>
                  {stats.totalR > 0 ? "+" : ""}{stats.totalR.toFixed(2)}R
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalTrades} total trades
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <IconTarget className="size-4" />
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.totalTrades === 0 ? (
              <>
                <div className="text-3xl font-bold text-muted-foreground">—</div>
                <p className="text-xs text-muted-foreground mt-1">No trades</p>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold">
                  {stats.winRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.wins}W / {stats.losses}L
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <IconChartBar className="size-4" />
              Profit Factor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.totalTrades === 0 ? (
              <>
                <div className="text-3xl font-bold text-muted-foreground">—</div>
                <p className="text-xs text-muted-foreground mt-1">No trades</p>
              </>
            ) : (
              <>
                <div className={cn(
                  "text-3xl font-bold",
                  stats.profitFactor >= 1.5 && "text-emerald-600",
                  stats.profitFactor < 1 && "text-red-600"
                )}>
                  {stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.profitFactor >= 1.5 ? "Strong edge" : stats.profitFactor >= 1 ? "Slight edge" : "Losing edge"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <IconClock className="size-4" />
              Expectancy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.totalTrades === 0 ? (
              <>
                <div className="text-3xl font-bold text-muted-foreground">—</div>
                <p className="text-xs text-muted-foreground mt-1">No trades</p>
              </>
            ) : (
              <>
                <div className={cn(
                  "text-3xl font-bold",
                  stats.expectancy > 0 && "text-emerald-600",
                  stats.expectancy < 0 && "text-red-600"
                )}>
                  {stats.expectancy > 0 ? "+" : ""}{stats.expectancy.toFixed(2)}R
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Per trade
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      {stats.totalTrades > 0 && (
        <div className="grid grid-cols-2 gap-6">
          {/* Win/Loss Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Win/Loss Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-emerald-500/10">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Win</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    +{stats.avgWin.toFixed(2)}R
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Loss</p>
                  <p className="text-2xl font-bold text-red-600">
                    -{stats.avgLoss.toFixed(2)}R
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Risk/Reward Ratio</p>
                <p className="text-2xl font-bold">
                  1:{stats.avgLoss > 0 ? (stats.avgWin / stats.avgLoss).toFixed(2) : "∞"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Behavioral Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Behavioral Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Planned</p>
                    <Badge variant="default" className="text-xs">{stats.plannedTrades}</Badge>
                  </div>
                  <p className="text-2xl font-bold">
                    {stats.plannedWinRate.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">win rate</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Impulse</p>
                    <Badge variant="destructive" className="text-xs">{stats.impulseTrades}</Badge>
                  </div>
                  <p className="text-2xl font-bold">
                    {stats.impulseWinRate.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">win rate</p>
                </div>
              </div>
              {stats.plannedWinRate > stats.impulseWinRate && stats.impulseTrades > 0 && (
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    ⚠️ Planned trades outperform impulse trades by {(stats.plannedWinRate - stats.impulseWinRate).toFixed(0)} percentage points. Focus on execution discipline.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Session Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Session Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {sessionPerformance.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No session data available
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {sessionPerformance.map((session) => (
              <div
                key={session.session}
                className={cn(
                  "p-4 rounded-lg border",
                  session.totalR > 0 && "bg-emerald-500/5 border-emerald-500/20",
                  session.totalR < 0 && "bg-red-500/5 border-red-500/20",
                  session.totalR === 0 && "bg-muted"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{session.session}</Badge>
                  <span className="text-xs text-muted-foreground">{session.trades} trades</span>
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  session.totalR > 0 && "text-emerald-600",
                  session.totalR < 0 && "text-red-600"
                )}>
                  {session.totalR > 0 ? "+" : ""}{session.totalR.toFixed(2)}R
                </p>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>{session.winRate.toFixed(0)}% win</span>
                  <span>{session.avgR > 0 ? "+" : ""}{session.avgR.toFixed(2)}R avg</span>
                </div>
              </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

