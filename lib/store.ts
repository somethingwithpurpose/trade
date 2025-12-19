"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Trade, TradeDaySummary, FilterState, ChatMessage } from './types'
import * as db from './store-db'

// No hardcoded data - start with empty array
// Helper to normalize dates

interface TradeStore {
  trades: Trade[]
  selectedDate: Date
  selectedTrade: Trade | null
  chatMessages: ChatMessage[]
  filters: FilterState
  isLoading: boolean
  
  // Actions
  addTrade: (trade: Trade) => Promise<void>
  updateTrade: (id: string, updates: Partial<Trade>) => Promise<void>
  deleteTrade: (id: string) => Promise<void>
  setSelectedDate: (date: Date) => void
  setSelectedTrade: (trade: Trade | null) => void
  addChatMessage: (message: ChatMessage) => Promise<void>
  setFilters: (filters: Partial<FilterState>) => void
  resetFilters: () => void
  loadTrades: () => Promise<void>
  loadChatMessages: () => Promise<void>
  
  // Computed
  getTradesForDate: (date: Date) => Trade[]
  getDaySummary: (date: Date) => TradeDaySummary
  getFilteredTrades: () => Trade[]
}

const defaultFilters: FilterState = {
  instruments: [],
  dateRange: { start: null, end: null },
  sessions: [],
  breakTypes: [],
  tpTypes: [],
  slTypes: [],
  beTypes: [],
  intents: [],
}

// Helper to normalize dates
const normalizeTrade = (trade: Trade): Trade => ({
  ...trade,
  date: trade.date instanceof Date ? trade.date : new Date(trade.date),
  createdAt: trade.createdAt instanceof Date ? trade.createdAt : new Date(trade.createdAt),
  updatedAt: trade.updatedAt instanceof Date ? trade.updatedAt : new Date(trade.updatedAt),
})

export const useTradeStore = create<TradeStore>()(
  persist(
    (set, get) => ({
      trades: [],
      selectedDate: new Date(),
      selectedTrade: null,
      chatMessages: [],
      filters: defaultFilters,
      isLoading: false,

      loadTrades: async () => {
        set({ isLoading: true })
        try {
          const trades = await db.fetchTrades()
          set({ trades, isLoading: false })
        } catch (error) {
          console.error("Failed to load trades from database:", error)
          set({ isLoading: false })
        }
      },

      loadChatMessages: async () => {
        try {
          const messages = await db.fetchChatMessages()
          set({ chatMessages: messages })
        } catch (error) {
          console.error("Failed to load chat messages from database:", error)
        }
      },

      addTrade: async (trade) => {
        try {
          const normalizedTrade = {
            ...trade,
            date: trade.date instanceof Date ? trade.date : new Date(trade.date),
            createdAt: trade.createdAt instanceof Date ? trade.createdAt : new Date(trade.createdAt),
            updatedAt: trade.updatedAt instanceof Date ? trade.updatedAt : new Date(trade.updatedAt),
          }
          await db.createTrade(normalizedTrade)
          set((state) => ({
            trades: [...state.trades, normalizedTrade],
          }))
        } catch (error) {
          console.error("Failed to save trade to database:", error)
          // Fallback to local storage
          set((state) => ({
            trades: [...state.trades, {
              ...trade,
              date: trade.date instanceof Date ? trade.date : new Date(trade.date),
              createdAt: trade.createdAt instanceof Date ? trade.createdAt : new Date(trade.createdAt),
              updatedAt: trade.updatedAt instanceof Date ? trade.updatedAt : new Date(trade.updatedAt),
            }],
          }))
        }
      },

      updateTrade: async (id, updates) => {
        try {
          const state = get()
          const existingTrade = state.trades.find((t) => t.id === id)
          if (!existingTrade) return
          
          const updatedTrade = {
            ...existingTrade,
            ...updates,
            date: updates.date ? (updates.date instanceof Date ? updates.date : new Date(updates.date)) : existingTrade.date,
            updatedAt: new Date(),
          }
          await db.updateTrade(id, updatedTrade)
          set((state) => ({
            trades: state.trades.map((t) => (t.id === id ? updatedTrade : t)),
          }))
        } catch (error) {
          console.error("Failed to update trade in database:", error)
          // Fallback to local storage
          set((state) => ({
            trades: state.trades.map((t) =>
              t.id === id ? { 
                ...t, 
                ...updates, 
                date: updates.date ? (updates.date instanceof Date ? updates.date : new Date(updates.date)) : t.date,
                updatedAt: new Date() 
              } : t
            ),
          }))
        }
      },

      deleteTrade: async (id) => {
        try {
          await db.deleteTrade(id)
          set((state) => ({
            trades: state.trades.filter((t) => t.id !== id),
          }))
        } catch (error) {
          console.error("Failed to delete trade from database:", error)
          // Fallback to local storage
          set((state) => ({
            trades: state.trades.filter((t) => t.id !== id),
          }))
        }
      },

      setSelectedDate: (date) => set({ selectedDate: date }),

      setSelectedTrade: (trade) => set({ selectedTrade: trade }),

      addChatMessage: async (message) => {
        try {
          await db.createChatMessage(message)
          set((state) => ({
            chatMessages: [...state.chatMessages, message],
          }))
        } catch (error) {
          console.error("Failed to save chat message to database:", error)
          // Fallback to local storage
          set((state) => ({
            chatMessages: [...state.chatMessages, message],
          }))
        }
      },

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      resetFilters: () => set({ filters: defaultFilters }),

      getTradesForDate: (date) => {
        const trades = get().trades
        const targetDate = new Date(date).toDateString()
        return trades.filter((t) => {
          const tradeDate = new Date(t.date).toDateString()
          return tradeDate === targetDate
        })
      },

      getDaySummary: (date) => {
        const trades = get().getTradesForDate(date)
        const wins = trades.filter((t) => t.resultR > 0)
        const totalR = trades.reduce((sum, t) => sum + t.resultR, 0)
        
        // Calculate max drawdown
        let maxDrawdown = 0
        let runningPnL = 0
        let peak = 0
        trades.forEach((t) => {
          runningPnL += t.resultR
          peak = Math.max(peak, runningPnL)
          maxDrawdown = Math.min(maxDrawdown, runningPnL - peak)
        })

        return {
          date,
          trades,
          totalR,
          avgR: trades.length > 0 ? totalR / trades.length : 0,
          winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
          maxDrawdown: Math.abs(maxDrawdown),
          tradeCount: trades.length,
        }
      },

      getFilteredTrades: () => {
        const { trades, filters } = get()
        
        return trades.filter((trade) => {
          if (filters.instruments.length > 0 && !filters.instruments.includes(trade.instrument)) {
            return false
          }
          if (filters.sessions.length > 0 && !filters.sessions.includes(trade.session)) {
            return false
          }
          if (filters.breakTypes.length > 0 && trade.breakType && !filters.breakTypes.includes(trade.breakType)) {
            return false
          }
          if (filters.tpTypes.length > 0 && trade.tpType && !filters.tpTypes.includes(trade.tpType)) {
            return false
          }
          if (filters.slTypes.length > 0 && trade.slType && !filters.slTypes.includes(trade.slType)) {
            return false
          }
          if (filters.beTypes.length > 0 && trade.beType && !filters.beTypes.includes(trade.beType)) {
            return false
          }
          if (filters.intents.length > 0 && !filters.intents.includes(trade.intent)) {
            return false
          }
          if (filters.dateRange.start && trade.date < filters.dateRange.start) {
            return false
          }
          if (filters.dateRange.end && trade.date > filters.dateRange.end) {
            return false
          }
          return true
        })
      },
    }),
    {
      name: 'edgelab-trades',
      partialize: (state) => ({
        trades: state.trades.map(t => ({
          ...t,
          date: new Date(t.date).toISOString(),
          createdAt: new Date(t.createdAt).toISOString(),
          updatedAt: new Date(t.updatedAt).toISOString(),
        })),
        chatMessages: state.chatMessages.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp).toISOString(),
        })),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert date strings back to Date objects after rehydration
          state.trades = state.trades.map(t => ({
            ...t,
            date: new Date(t.date),
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
          }))
          state.chatMessages = state.chatMessages.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
          if (state.selectedDate) {
            state.selectedDate = new Date(state.selectedDate)
          }
        }
      },
    }
  )
)

