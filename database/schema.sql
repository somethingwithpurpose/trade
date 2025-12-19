-- EdgeLab Trading Analytics Database Schema
-- PostgreSQL Database Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trades table (core trade data) - Created first since screenshots references it
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Manual Fields
  instrument VARCHAR(10) NOT NULL CHECK (instrument IN ('ES', 'NQ', 'RTY', 'GC', 'CL', 'YM', 'ZB', 'ZN')),
  date DATE NOT NULL,
  time VARCHAR(10) NOT NULL,
  session VARCHAR(20) NOT NULL CHECK (session IN ('Asia', 'London', 'NY AM', 'NY PM')),
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('Long', 'Short')),
  size INTEGER NOT NULL,
  entry_price DECIMAL(12, 2) NOT NULL,
  stop_loss_price DECIMAL(12, 2),
  take_profit_price DECIMAL(12, 2),
  result_r DECIMAL(10, 2) NOT NULL,
  result_ticks INTEGER,
  result_dollars DECIMAL(12, 2),
  duration INTEGER, -- in minutes
  
  -- Behavioral Fields
  intent VARCHAR(20) NOT NULL CHECK (intent IN ('Planned', 'Impulse', 'Revenge', 'Boredom')),
  confidence_at_entry INTEGER CHECK (confidence_at_entry BETWEEN 1 AND 5),
  emotional_states TEXT[], -- Array of emotional states
  
  -- Classification Fields
  tp_type VARCHAR(30) CHECK (tp_type IN ('Fixed TP', 'Runner', 'Partial + Runner', 'Scalp TP', 'HTF Target')),
  sl_type VARCHAR(30) CHECK (sl_type IN ('Fixed SL', 'Structural SL', 'Volatility-based SL', 'Time-based SL')),
  be_type VARCHAR(20) CHECK (be_type IN ('No BE', 'Standard BE', 'Smart BE', 'Trailing BE')),
  break_type VARCHAR(30) CHECK (break_type IN ('Range Break', 'Liquidity Sweep', 'Trend Continuation', 'Failed Break', 'Reversal Break')),
  
  -- Notes and metadata
  notes TEXT,
  tags TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screenshots table (for storing image metadata and URLs)
CREATE TABLE IF NOT EXISTS screenshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  type VARCHAR(20) CHECK (type IN ('chart', 'dom', 'markup', 'other')),
  ai_processed BOOLEAN DEFAULT FALSE,
  ai_extracted_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table (for AI chat history)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  citations JSONB, -- { tradeIds: string[], sampleSize: number, confidenceLevel: string }
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trades_date ON trades(date);
CREATE INDEX IF NOT EXISTS idx_trades_instrument ON trades(instrument);
CREATE INDEX IF NOT EXISTS idx_trades_session ON trades(session);
CREATE INDEX IF NOT EXISTS idx_trades_intent ON trades(intent);
CREATE INDEX IF NOT EXISTS idx_trades_break_type ON trades(break_type);
CREATE INDEX IF NOT EXISTS idx_trades_tp_type ON trades(tp_type);
CREATE INDEX IF NOT EXISTS idx_trades_be_type ON trades(be_type);
CREATE INDEX IF NOT EXISTS idx_screenshots_trade_id ON screenshots(trade_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_screenshots_updated_at BEFORE UPDATE ON screenshots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

