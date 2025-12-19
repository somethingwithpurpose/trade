"use client"

import * as React from "react"
import { format } from "date-fns"
import {
  IconFilter,
  IconArrowUp,
  IconArrowDown,
  IconTrendingUp,
  IconTrendingDown,
  IconPhoto,
  IconUpload,
  IconSparkles,
} from "@tabler/icons-react"
import { useDropzone } from "react-dropzone"
import { v4 as uuidv4 } from "uuid"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { useTradeStore } from "@/lib/store"
import type { Trade, Instrument, Session, BreakType, TPType, BEType } from "@/lib/types"
import { BulkImageUpload } from "@/components/bulk-image-upload"
import { ScreenshotManager } from "@/components/screenshot-manager"

type SortField = 'date' | 'resultR' | 'instrument' | 'session' | 'breakType'
type SortDirection = 'asc' | 'desc'

const instruments: Instrument[] = ['ES', 'NQ', 'RTY', 'GC', 'CL', 'YM', 'ZB', 'ZN']
const sessions: Session[] = ['Asia', 'London', 'NY AM', 'NY PM']
const breakTypes: BreakType[] = ['Range Break', 'Liquidity Sweep', 'Trend Continuation', 'Failed Break', 'Reversal Break']
const tpTypes: TPType[] = ['Fixed TP', 'Runner', 'Partial + Runner', 'Scalp TP', 'HTF Target']
const beTypes: BEType[] = ['No BE', 'Standard BE', 'Smart BE', 'Trailing BE']

interface FilterState {
  instrument: string
  session: string
  breakType: string
  tpType: string
  beType: string
}

export function DataTablesIntegrated() {
  const { trades } = useTradeStore()
  const [sortField, setSortField] = React.useState<SortField>('date')
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc')
  const [filters, setFilters] = React.useState<FilterState>({
    instrument: 'All',
    session: 'All',
    breakType: 'All',
    tpType: 'All',
    beType: 'All',
  })

  const filteredTrades = React.useMemo(() => {
    return trades.filter((trade) => {
      if (filters.instrument && filters.instrument !== 'All' && trade.instrument !== filters.instrument) return false
      if (filters.session && filters.session !== 'All' && trade.session !== filters.session) return false
      if (filters.breakType && filters.breakType !== 'All' && trade.breakType !== filters.breakType) return false
      if (filters.tpType && filters.tpType !== 'All' && trade.tpType !== filters.tpType) return false
      if (filters.beType && filters.beType !== 'All' && trade.beType !== filters.beType) return false
      return true
    })
  }, [trades, filters])

  const sortedTrades = React.useMemo(() => {
    return [...filteredTrades].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case 'resultR':
          comparison = a.resultR - b.resultR
          break
        case 'instrument':
          comparison = a.instrument.localeCompare(b.instrument)
          break
        case 'session':
          comparison = a.session.localeCompare(b.session)
          break
        case 'breakType':
          comparison = (a.breakType || '').localeCompare(b.breakType || '')
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [filteredTrades, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <IconArrowUp className="size-3 ml-1" />
    ) : (
      <IconArrowDown className="size-3 ml-1" />
    )
  }

  // Calculate aggregate stats
  const stats = React.useMemo(() => {
    const wins = filteredTrades.filter((t) => t.resultR > 0)
    const totalR = filteredTrades.reduce((sum, t) => sum + t.resultR, 0)
    const avgR = filteredTrades.length > 0 ? totalR / filteredTrades.length : 0
    const winRate = filteredTrades.length > 0 ? (wins.length / filteredTrades.length) * 100 : 0
    
    return { totalR, avgR, winRate, count: filteredTrades.length }
  }, [filteredTrades])

  // Strategy performance aggregation
  const strategyPerformance = React.useMemo(() => {
    const byBreakType: Record<string, { trades: Trade[]; totalR: number; wins: number }> = {}
    const byTPType: Record<string, { trades: Trade[]; totalR: number; wins: number }> = {}
    const byBEType: Record<string, { trades: Trade[]; totalR: number; wins: number }> = {}

    filteredTrades.forEach((trade) => {
      if (trade.breakType) {
        if (!byBreakType[trade.breakType]) {
          byBreakType[trade.breakType] = { trades: [], totalR: 0, wins: 0 }
        }
        byBreakType[trade.breakType].trades.push(trade)
        byBreakType[trade.breakType].totalR += trade.resultR
        if (trade.resultR > 0) byBreakType[trade.breakType].wins++
      }
      if (trade.tpType) {
        if (!byTPType[trade.tpType]) {
          byTPType[trade.tpType] = { trades: [], totalR: 0, wins: 0 }
        }
        byTPType[trade.tpType].trades.push(trade)
        byTPType[trade.tpType].totalR += trade.resultR
        if (trade.resultR > 0) byTPType[trade.tpType].wins++
      }
      if (trade.beType) {
        if (!byBEType[trade.beType]) {
          byBEType[trade.beType] = { trades: [], totalR: 0, wins: 0 }
        }
        byBEType[trade.beType].trades.push(trade)
        byBEType[trade.beType].totalR += trade.resultR
        if (trade.resultR > 0) byBEType[trade.beType].wins++
      }
    })

    return { byBreakType, byTPType, byBEType }
  }, [filteredTrades])

  const clearFilters = () => {
    setFilters({
      instrument: 'All',
      session: 'All',
      breakType: 'All',
      tpType: 'All',
      beType: 'All',
    })
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== 'All')

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <IconFilter className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <Select
          value={filters.instrument}
          onValueChange={(v) => setFilters((prev) => ({ ...prev, instrument: v || 'All' }))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue>{filters.instrument}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            {instruments.map((i) => (
              <SelectItem key={i} value={i}>{i}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.session}
          onValueChange={(v) => setFilters((prev) => ({ ...prev, session: v || 'All' }))}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue>{filters.session}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            {sessions.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.breakType}
          onValueChange={(v) => setFilters((prev) => ({ ...prev, breakType: v || 'All' }))}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue>{filters.breakType}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            {breakTypes.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.tpType}
          onValueChange={(v) => setFilters((prev) => ({ ...prev, tpType: v || 'All' }))}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue>{filters.tpType}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            {tpTypes.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.beType}
          onValueChange={(v) => setFilters((prev) => ({ ...prev, beType: v || 'All' }))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue>{filters.beType}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            {beTypes.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        )}
      </div>

      {/* Summary Stats */}
      {stats.count === 0 ? (
        <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Trades</p>
            <p className="text-2xl font-bold text-muted-foreground">—</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total R</p>
            <p className="text-2xl font-bold text-muted-foreground">—</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg R</p>
            <p className="text-2xl font-bold text-muted-foreground">—</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Win Rate</p>
            <p className="text-2xl font-bold text-muted-foreground">—</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Trades</p>
            <p className="text-2xl font-bold">{stats.count}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total R</p>
            <p className={cn(
              "text-2xl font-bold",
              stats.totalR > 0 && "text-emerald-600",
              stats.totalR < 0 && "text-red-600"
            )}>
              {stats.totalR > 0 ? "+" : ""}{stats.totalR.toFixed(2)}R
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg R</p>
            <p className={cn(
              "text-2xl font-bold",
              stats.avgR > 0 && "text-emerald-600",
              stats.avgR < 0 && "text-red-600"
            )}>
              {stats.avgR > 0 ? "+" : ""}{stats.avgR.toFixed(2)}R
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Win Rate</p>
            <p className="text-2xl font-bold">{stats.winRate.toFixed(0)}%</p>
          </div>
        </div>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="trades">
        <TabsList>
          <TabsTrigger value="trades">Trade Evidence</TabsTrigger>
          <TabsTrigger value="strategy">Strategy Performance</TabsTrigger>
          <TabsTrigger value="upload">
            <IconUpload className="size-4 mr-2" />
            Bulk Upload
          </TabsTrigger>
          <TabsTrigger value="screenshots">
            <IconPhoto className="size-4 mr-2" />
            Saved Screenshots
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trades" className="mt-4">
          {/* Trade Evidence Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">
                      Date <SortIcon field="date" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('instrument')}
                  >
                    <div className="flex items-center">
                      Instrument <SortIcon field="instrument" />
                    </div>
                  </TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('session')}
                  >
                    <div className="flex items-center">
                      Session <SortIcon field="session" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('breakType')}
                  >
                    <div className="flex items-center">
                      Break Type <SortIcon field="breakType" />
                    </div>
                  </TableHead>
                  <TableHead>TP Type</TableHead>
                  <TableHead>BE Type</TableHead>
                  <TableHead>Intent</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50 text-right"
                    onClick={() => handleSort('resultR')}
                  >
                    <div className="flex items-center justify-end">
                      Result <SortIcon field="resultR" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTrades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No trades found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTrades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="font-medium">
                        {format(new Date(trade.date), "MMM d, yyyy")}
                        <span className="text-muted-foreground ml-2">{trade.time}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{trade.instrument}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {trade.direction === "Long" ? (
                            <IconTrendingUp className="size-4 text-emerald-600" />
                          ) : (
                            <IconTrendingDown className="size-4 text-red-600" />
                          )}
                          {trade.direction}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{trade.session}</Badge>
                      </TableCell>
                      <TableCell>
                        {trade.breakType ? (
                          <Badge variant="outline">{trade.breakType}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {trade.tpType ? (
                          <Badge variant="outline">{trade.tpType}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {trade.beType && trade.beType !== "No BE" ? (
                          <Badge variant="outline">{trade.beType}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={trade.intent === "Planned" ? "default" : "destructive"}
                        >
                          {trade.intent}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "font-bold",
                            trade.resultR > 0 && "text-emerald-600",
                            trade.resultR < 0 && "text-red-600"
                          )}
                        >
                          {trade.resultR > 0 ? "+" : ""}{trade.resultR.toFixed(2)}R
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {trade.duration}m
                      </TableCell>
                      <TableCell>
                        {trade.screenshots.length > 0 && (
                          <IconPhoto className="size-4 text-muted-foreground" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="strategy" className="mt-4 space-y-6">
          {Object.keys(strategyPerformance.byBreakType).length === 0 &&
           Object.keys(strategyPerformance.byTPType).length === 0 &&
           Object.keys(strategyPerformance.byBEType).length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>No strategy performance data available</p>
              <p className="text-sm mt-2">Add trades with classifications to see performance breakdowns</p>
            </div>
          ) : (
            <>
              {/* Break Type Performance */}
              {Object.keys(strategyPerformance.byBreakType).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Performance by Break Type
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Break Type</TableHead>
                          <TableHead className="text-right">Sample Size</TableHead>
                          <TableHead className="text-right">Win Rate</TableHead>
                          <TableHead className="text-right">Avg R</TableHead>
                          <TableHead className="text-right">Total R</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(strategyPerformance.byBreakType).map(([type, data]) => (
                          <TableRow key={type}>
                            <TableCell>
                              <Badge variant="outline">{type}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{data.trades.length}</TableCell>
                            <TableCell className="text-right">
                              {((data.wins / data.trades.length) * 100).toFixed(0)}%
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={cn(
                                data.totalR / data.trades.length > 0 && "text-emerald-600",
                                data.totalR / data.trades.length < 0 && "text-red-600"
                              )}>
                                {(data.totalR / data.trades.length).toFixed(2)}R
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={cn(
                                "font-bold",
                                data.totalR > 0 && "text-emerald-600",
                                data.totalR < 0 && "text-red-600"
                              )}>
                                {data.totalR > 0 ? "+" : ""}{data.totalR.toFixed(2)}R
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* TP Type Performance */}
              {Object.keys(strategyPerformance.byTPType).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Performance by TP Type
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>TP Type</TableHead>
                          <TableHead className="text-right">Sample Size</TableHead>
                          <TableHead className="text-right">Win Rate</TableHead>
                          <TableHead className="text-right">Avg R</TableHead>
                          <TableHead className="text-right">Total R</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(strategyPerformance.byTPType).map(([type, data]) => (
                          <TableRow key={type}>
                            <TableCell>
                              <Badge variant="outline">{type}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{data.trades.length}</TableCell>
                            <TableCell className="text-right">
                              {((data.wins / data.trades.length) * 100).toFixed(0)}%
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={cn(
                                data.totalR / data.trades.length > 0 && "text-emerald-600",
                                data.totalR / data.trades.length < 0 && "text-red-600"
                              )}>
                                {(data.totalR / data.trades.length).toFixed(2)}R
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={cn(
                                "font-bold",
                                data.totalR > 0 && "text-emerald-600",
                                data.totalR < 0 && "text-red-600"
                              )}>
                                {data.totalR > 0 ? "+" : ""}{data.totalR.toFixed(2)}R
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* BE Type Performance */}
              {Object.keys(strategyPerformance.byBEType).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Performance by BE Type
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>BE Type</TableHead>
                          <TableHead className="text-right">Sample Size</TableHead>
                          <TableHead className="text-right">Win Rate</TableHead>
                          <TableHead className="text-right">Avg R</TableHead>
                          <TableHead className="text-right">Total R</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(strategyPerformance.byBEType).map(([type, data]) => (
                          <TableRow key={type}>
                            <TableCell>
                              <Badge variant="outline">{type}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{data.trades.length}</TableCell>
                            <TableCell className="text-right">
                              {((data.wins / data.trades.length) * 100).toFixed(0)}%
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={cn(
                                data.totalR / data.trades.length > 0 && "text-emerald-600",
                                data.totalR / data.trades.length < 0 && "text-red-600"
                              )}>
                                {(data.totalR / data.trades.length).toFixed(2)}R
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={cn(
                                "font-bold",
                                data.totalR > 0 && "text-emerald-600",
                                data.totalR < 0 && "text-red-600"
                              )}>
                                {data.totalR > 0 ? "+" : ""}{data.totalR.toFixed(2)}R
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="upload" className="mt-4">
          <BulkImageUpload />
        </TabsContent>

        <TabsContent value="screenshots" className="mt-4">
          <ScreenshotManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}

