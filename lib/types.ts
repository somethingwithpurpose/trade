// Core Trading Types for EdgeLab

export type Instrument = 'ES' | 'NQ' | 'RTY' | 'GC' | 'CL' | 'YM' | 'ZB' | 'ZN'

export type Session = 'Asia' | 'London' | 'NY AM' | 'NY PM'

export type Direction = 'Long' | 'Short'

export type TradeIntent = 'Planned' | 'Impulse' | 'Revenge' | 'Boredom'

export type EmotionalState = 
  | 'Calm'
  | 'Anxious'
  | 'Confident'
  | 'Fearful'
  | 'FOMO'
  | 'Frustrated'
  | 'Focused'
  | 'Tired'
  | 'Rushed'

// Take Profit Types
export type TPType = 
  | 'Fixed TP'
  | 'Runner'
  | 'Partial + Runner'
  | 'Scalp TP'
  | 'HTF Target'

// Stop Loss Types
export type SLType = 
  | 'Fixed SL'
  | 'Structural SL'
  | 'Volatility-based SL'
  | 'Time-based SL'

// Break-Even Types
export type BEType = 
  | 'No BE'
  | 'Standard BE'
  | 'Smart BE'
  | 'Trailing BE'

// Break Type Taxonomy
export type BreakType = 
  | 'Range Break'
  | 'Liquidity Sweep'
  | 'Trend Continuation'
  | 'Failed Break'
  | 'Reversal Break'

export type BreakAlignment = 'HTF Aligned' | 'Counter HTF'

// Trade Screenshot with AI-extracted metadata
export interface TradeScreenshot {
  id: string
  url: string
  filename: string
  uploadedAt: Date
  type: 'chart' | 'dom' | 'markup' | 'other'
  // AI-extracted fields (populated after processing)
  aiProcessed: boolean
  aiExtractedData?: {
    marketStructure?: string
    breakType?: BreakType
    entryStyle?: string
    htfAlignment?: BreakAlignment
    sessionContext?: string
    notes?: string
  }
}

// Core Trade Object
export interface Trade {
  id: string
  // Manual Fields
  instrument: Instrument
  date: Date
  time: string
  session: Session
  direction: Direction
  size: number
  entryPrice: number
  stopLossPrice: number
  takeProfitPrice: number
  resultR: number
  resultTicks: number
  resultDollars: number
  duration: number // in minutes
  
  // Behavioral Fields
  intent: TradeIntent
  confidenceAtEntry: 1 | 2 | 3 | 4 | 5
  emotionalStates: EmotionalState[]
  
  // Classification (can be manual or AI-detected)
  tpType?: TPType
  slType?: SLType
  beType?: BEType
  breakType?: BreakType
  breakAlignment?: BreakAlignment
  
  // Screenshots
  screenshots: TradeScreenshot[]
  
  // Notes
  notes?: string
  tags?: string[]
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

// Day Summary for Calendar View
export interface TradeDaySummary {
  date: Date
  trades: Trade[]
  totalR: number
  avgR: number
  winRate: number
  maxDrawdown: number
  tradeCount: number
}

// Strategy Performance Aggregate
export interface StrategyPerformance {
  groupBy: 'tpType' | 'beType' | 'breakType' | 'slType'
  value: string
  sampleSize: number
  winRate: number
  avgR: number
  expectancy: number
  maxDrawdown: number
}

// Time-Based Performance
export interface TimePerformance {
  hour?: number
  session?: Session
  avgR: number
  failureRate: number
  overtradeFrequency: number
  sampleSize: number
}

// Filter State
export interface FilterState {
  instruments: Instrument[]
  dateRange: { start: Date | null; end: Date | null }
  sessions: Session[]
  breakTypes: BreakType[]
  tpTypes: TPType[]
  slTypes: SLType[]
  beTypes: BEType[]
  intents: TradeIntent[]
}

// AI Chat Message
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  // For AI responses
  citations?: {
    tradeIds: string[]
    sampleSize: number
    confidenceLevel: 'high' | 'medium' | 'low'
  }
}

