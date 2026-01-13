-- Supabase Database Schema for Poker Night Master
-- Run these commands in your Supabase SQL editor

-- Create players table
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create game_logs table
CREATE TABLE game_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  game_date DATE NOT NULL,
  buy_in DECIMAL(10,2) DEFAULT 20.00,
  cash_out DECIMAL(10,2) NOT NULL,
  net_result DECIMAL(10,2) GENERATED ALWAYS AS (cash_out - buy_in) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_game_logs_player_id ON game_logs(player_id);
CREATE INDEX idx_game_logs_game_date ON game_logs(game_date);
CREATE INDEX idx_game_logs_net_result ON game_logs(net_result);

-- Create a view for leaderboard data
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  p.id,
  p.name,
  COUNT(gl.id) as games_played,
  COALESCE(SUM(gl.buy_in), 0) as total_buy_ins,
  COALESCE(SUM(gl.cash_out), 0) as total_cash_outs,
  COALESCE(SUM(gl.net_result), 0) as net_profit
FROM players p
LEFT JOIN game_logs gl ON p.id = gl.player_id
GROUP BY p.id, p.name
ORDER BY net_profit DESC;

-- Create a view for recent games (last 30 days)
CREATE OR REPLACE VIEW recent_games AS
SELECT 
  p.id,
  p.name,
  COALESCE(SUM(gl.net_result), 0) as recent_profit
FROM players p
LEFT JOIN game_logs gl ON p.id = gl.player_id 
  AND gl.game_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.id, p.name
ORDER BY recent_profit DESC;

-- Enable Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (since this is a private poker group)
CREATE POLICY "Allow public read access on players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public read access on game_logs" ON game_logs FOR SELECT USING (true);

-- For admin operations, you'll need to set up authentication
-- These policies allow authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated insert on players" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update on players" ON players FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete on players" ON players FOR DELETE USING (true);

CREATE POLICY "Allow authenticated insert on game_logs" ON game_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update on game_logs" ON game_logs FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete on game_logs" ON game_logs FOR DELETE USING (true);