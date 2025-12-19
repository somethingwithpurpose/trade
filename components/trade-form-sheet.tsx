"use client"

import * as React from "react"
import { format } from "date-fns"
import { v4 as uuidv4 } from "uuid"
import {
  IconX,
  IconTrendingUp,
  IconTrendingDown,
  IconCalendar,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useTradeStore } from "@/lib/store"
import { ImageUploader } from "@/components/image-uploader"
import type {
  Trade,
  Instrument,
  Session,
  Direction,
  TradeIntent,
  EmotionalState,
  TPType,
  SLType,
  BEType,
  BreakType,
  TradeScreenshot,
} from "@/lib/types"

const instruments: Instrument[] = ['ES', 'NQ', 'RTY', 'GC', 'CL', 'YM', 'ZB', 'ZN']
const sessions: Session[] = ['Asia', 'London', 'NY AM', 'NY PM']
const directions: Direction[] = ['Long', 'Short']
const intents: TradeIntent[] = ['Planned', 'Impulse', 'Revenge', 'Boredom']
const emotionalStates: EmotionalState[] = [
  'Calm', 'Anxious', 'Confident', 'Fearful', 'FOMO', 'Frustrated', 'Focused', 'Tired', 'Rushed'
]
const tpTypes: TPType[] = ['Fixed TP', 'Runner', 'Partial + Runner', 'Scalp TP', 'HTF Target']
const slTypes: SLType[] = ['Fixed SL', 'Structural SL', 'Volatility-based SL', 'Time-based SL']
const beTypes: BEType[] = ['No BE', 'Standard BE', 'Smart BE', 'Trailing BE']
const breakTypes: BreakType[] = ['Range Break', 'Liquidity Sweep', 'Trend Continuation', 'Failed Break', 'Reversal Break']

interface TradeFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trade?: Trade | null
  defaultDate?: Date
}

export function TradeFormSheet({
  open,
  onOpenChange,
  trade,
  defaultDate = new Date(),
}: TradeFormSheetProps) {
  const { addTrade, updateTrade, deleteTrade } = useTradeStore()
  const isEditing = !!trade

  // Form state
  const [instrument, setInstrument] = React.useState<Instrument>(trade?.instrument || 'ES')
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    trade?.date ? new Date(trade.date) : defaultDate
  )
  const [date, setDate] = React.useState(trade?.date ? format(new Date(trade.date), "yyyy-MM-dd") : format(defaultDate, "yyyy-MM-dd"))
  const [time, setTime] = React.useState(trade?.time || format(new Date(), "HH:mm"))
  const [session, setSession] = React.useState<Session>(trade?.session || 'NY AM')
  const [direction, setDirection] = React.useState<Direction>(trade?.direction || 'Long')
  const [size, setSize] = React.useState(trade?.size?.toString() || '1')
  const [entryPrice, setEntryPrice] = React.useState(trade?.entryPrice?.toString() || '')
  const [stopLossPrice, setStopLossPrice] = React.useState(trade?.stopLossPrice?.toString() || '')
  const [takeProfitPrice, setTakeProfitPrice] = React.useState(trade?.takeProfitPrice?.toString() || '')
  const [resultR, setResultR] = React.useState(trade?.resultR?.toString() || '')
  const [resultTicks, setResultTicks] = React.useState(trade?.resultTicks?.toString() || '')
  const [resultDollars, setResultDollars] = React.useState(trade?.resultDollars?.toString() || '')
  const [duration, setDuration] = React.useState(trade?.duration?.toString() || '')
  
  // Behavioral
  const [intent, setIntent] = React.useState<TradeIntent>(trade?.intent || 'Planned')
  const [confidence, setConfidence] = React.useState<number[]>([trade?.confidenceAtEntry || 3])
  const [selectedEmotions, setSelectedEmotions] = React.useState<EmotionalState[]>(trade?.emotionalStates || [])
  
  // Classification
  const [tpType, setTpType] = React.useState<TPType | ''>(trade?.tpType || '')
  const [slType, setSlType] = React.useState<SLType | ''>(trade?.slType || '')
  const [beType, setBeType] = React.useState<BEType | ''>(trade?.beType || '')
  const [breakType, setBreakType] = React.useState<BreakType | ''>(trade?.breakType || '')
  
  // Notes & Screenshots
  const [notes, setNotes] = React.useState(trade?.notes || '')
  const [screenshots, setScreenshots] = React.useState<TradeScreenshot[]>(trade?.screenshots || [])

  const toggleEmotion = (emotion: EmotionalState) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion)
        ? prev.filter((e) => e !== emotion)
        : [...prev, emotion]
    )
  }

  const handleSave = async () => {
    const tradeData: Trade = {
      id: trade?.id || uuidv4(),
      instrument,
      date: new Date(date),
      time,
      session,
      direction,
      size: parseFloat(size) || 1,
      entryPrice: parseFloat(entryPrice) || 0,
      stopLossPrice: parseFloat(stopLossPrice) || 0,
      takeProfitPrice: parseFloat(takeProfitPrice) || 0,
      resultR: parseFloat(resultR) || 0,
      resultTicks: parseFloat(resultTicks) || 0,
      resultDollars: parseFloat(resultDollars) || 0,
      duration: parseFloat(duration) || 0,
      intent,
      confidenceAtEntry: confidence[0] as 1 | 2 | 3 | 4 | 5,
      emotionalStates: selectedEmotions,
      tpType: tpType || undefined,
      slType: slType || undefined,
      beType: beType || undefined,
      breakType: breakType || undefined,
      screenshots,
      notes,
      createdAt: trade?.createdAt || new Date(),
      updatedAt: new Date(),
    }

    if (isEditing) {
      await updateTrade(trade.id, tradeData)
    } else {
      await addTrade(tradeData)
    }

    onOpenChange(false)
  }

  const handleDelete = async () => {
    if (trade && confirm("Are you sure you want to delete this trade?")) {
      await deleteTrade(trade.id)
      onOpenChange(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0" showCloseButton={false}>
        <SheetHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>{isEditing ? "Edit Trade" : "New Trade"}</SheetTitle>
              <SheetDescription>
                {isEditing
                  ? "Update trade details and classifications"
                  : "Log a new trade with all relevant details"}
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
            >
              <IconX className="size-4" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)] px-6">
          <div className="space-y-6 py-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Trade Details
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Instrument</Label>
                  <Select value={instrument} onValueChange={(v) => setInstrument(v as Instrument)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {instruments.map((i) => (
                        <SelectItem key={i} value={i}>{i}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Session</Label>
                  <Select value={session} onValueChange={(v) => setSession(v as Session)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "w-full justify-start text-left font-normal rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground flex items-center",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <IconCalendar className="mr-2 size-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date)
                          if (date) {
                            setDate(format(date, "yyyy-MM-dd"))
                          }
                        }}
                        defaultMonth={selectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Direction Toggle */}
              <div className="space-y-2">
                <Label>Direction</Label>
                <div className="flex gap-2">
                  {directions.map((d) => (
                    <Button
                      key={d}
                      type="button"
                      variant={direction === d ? "default" : "outline"}
                      className={cn(
                        "flex-1",
                        direction === d && d === "Long" && "bg-emerald-600 hover:bg-emerald-700",
                        direction === d && d === "Short" && "bg-red-600 hover:bg-red-700"
                      )}
                      onClick={() => setDirection(d)}
                    >
                      {d === "Long" ? (
                        <IconTrendingUp className="size-4 mr-2" />
                      ) : (
                        <IconTrendingDown className="size-4 mr-2" />
                      )}
                      {d}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Input
                    type="number"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Entry</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stop Loss</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={stopLossPrice}
                    onChange={(e) => setStopLossPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Take Profit</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={takeProfitPrice}
                    onChange={(e) => setTakeProfitPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Result (R)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={resultR}
                    onChange={(e) => setResultR(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ticks</Label>
                  <Input
                    type="number"
                    value={resultTicks}
                    onChange={(e) => setResultTicks(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>$ Result</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={resultDollars}
                    onChange={(e) => setResultDollars(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Behavioral */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Behavioral Data
              </h3>

              <div className="space-y-2">
                <Label>Trade Intent</Label>
                <div className="flex flex-wrap gap-2">
                  {intents.map((i) => (
                    <Button
                      key={i}
                      type="button"
                      variant={intent === i ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        intent === i && i !== "Planned" && "bg-destructive hover:bg-destructive/90"
                      )}
                      onClick={() => setIntent(i)}
                    >
                      {i}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Confidence at Entry</Label>
                  <span className="text-sm font-medium">{confidence[0]}/5</span>
                </div>
                <Slider
                  value={confidence}
                  onValueChange={setConfidence}
                  min={1}
                  max={5}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Emotional State</Label>
                <div className="flex flex-wrap gap-2">
                  {emotionalStates.map((e) => (
                    <Badge
                      key={e}
                      variant={selectedEmotions.includes(e) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleEmotion(e)}
                    >
                      {e}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Classification */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Trade Classification
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Take Profit Type</Label>
                  <Select value={tpType} onValueChange={(v) => setTpType(v as TPType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select TP type" />
                    </SelectTrigger>
                    <SelectContent>
                      {tpTypes.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Stop Loss Type</Label>
                  <Select value={slType} onValueChange={(v) => setSlType(v as SLType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select SL type" />
                    </SelectTrigger>
                    <SelectContent>
                      {slTypes.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Break-Even Type</Label>
                  <Select value={beType} onValueChange={(v) => setBeType(v as BEType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select BE type" />
                    </SelectTrigger>
                    <SelectContent>
                      {beTypes.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Break Type</Label>
                  <Select value={breakType} onValueChange={(v) => setBreakType(v as BreakType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select break type" />
                    </SelectTrigger>
                    <SelectContent>
                      {breakTypes.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Screenshots */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Screenshots & Media
              </h3>
              <ImageUploader
                screenshots={screenshots}
                onScreenshotsChange={setScreenshots}
              />
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this trade..."
                rows={4}
              />
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="p-6 pt-4 border-t">
          <div className="flex items-center justify-between w-full">
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                Delete Trade
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSave}>
                {isEditing ? "Save Changes" : "Add Trade"}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

