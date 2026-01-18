-- Database Migration: Add Rebuy Functionality
-- This migration adds rebuy support without modifying existing tables
-- Run this in your Supabase SQL editor AFTER the main schema

-- Create rebuys table to track additional buy-ins during games
CREATE TABLE rebuys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_log_id UUID REFERENCES game_logs(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  game_date DATE NOT NULL,
  rebuy_amount DECIMAL(10,2) NOT NULL,
  rebuy_sequence INTEGER NOT NULL DEFAULT 1, -- Track order of rebuys (1st rebuy, 2nd rebuy, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_rebuys_game_log_id ON rebuys(game_log_id);
CREATE INDEX idx_rebuys_player_id ON rebuys(player_id);
CREATE INDEX idx_rebuys_game_date ON rebuys(game_date);

-- Enable Row Level Security
ALTER TABLE rebuys ENABLE ROW LEVEL SECURITY;

-- Create policies for rebuys table
CREATE POLICY "Allow public read access on rebuys" ON rebuys FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert on rebuys" ON rebuys FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update on rebuys" ON rebuys FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete on rebuys" ON rebuys FOR DELETE USING (true);

-- Create a view that combines game_logs with total rebuys
CREATE OR REPLACE VIEW game_logs_with_rebuys AS
SELECT 
  gl.id,
  gl.player_id,
  gl.game_date,
  gl.buy_in as initial_buy_in,
  COALESCE(SUM(r.rebuy_amount), 0) as total_rebuys,
  gl.buy_in + COALESCE(SUM(r.rebuy_amount), 0) as total_investment,
  gl.cash_out,
  gl.cash_out - (gl.buy_in + COALESCE(SUM(r.rebuy_amount), 0)) as net_result_with_rebuys,
  gl.net_result as original_net_result,
  gl.created_at,
  gl.updated_at,
  COUNT(r.id) as rebuy_count
FROM game_logs gl
LEFT JOIN rebuys r ON gl.id = r.game_log_id
GROUP BY gl.id, gl.player_id, gl.game_date, gl.buy_in, gl.cash_out, gl.net_result, gl.created_at, gl.updated_at;

-- Update leaderboard view to include rebuys
CREATE OR REPLACE VIEW leaderboard_with_rebuys AS
SELECT 
  p.id,
  p.name,
  COUNT(glwr.id) as games_played,
  COALESCE(SUM(glwr.initial_buy_in), 0) as total_initial_buy_ins,
  COALESCE(SUM(glwr.total_rebuys), 0) as total_rebuys,
  COALESCE(SUM(glwr.total_investment), 0) as total_investment,
  COALESCE(SUM(glwr.cash_out), 0) as total_cash_outs,
  COALESCE(SUM(glwr.net_result_with_rebuys), 0) as net_profit_with_rebuys,
  COALESCE(SUM(glwr.original_net_result), 0) as original_net_profit,
  COALESCE(SUM(glwr.rebuy_count), 0) as total_rebuy_instances
FROM players p
LEFT JOIN game_logs_with_rebuys glwr ON p.id = glwr.player_id
GROUP BY p.id, p.name
ORDER BY net_profit_with_rebuys DESC;

-- Update recent games view to include rebuys
CREATE OR REPLACE VIEW recent_games_with_rebuys AS
SELECT 
  p.id,
  p.name,
  COALESCE(SUM(glwr.net_result_with_rebuys), 0) as recent_profit_with_rebuys,
  COALESCE(SUM(glwr.original_net_result), 0) as recent_profit_original,
  COALESCE(SUM(glwr.total_rebuys), 0) as recent_total_rebuys
FROM players p
LEFT JOIN game_logs_with_rebuys glwr ON p.id = glwr.player_id 
  AND glwr.game_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.id, p.name
ORDER BY recent_profit_with_rebuys DESC;

-- Keep original views intact for backward compatibility
-- The original leaderboard and recent_games views remain unchanged
-- New views with "_with_rebuys" suffix provide enhanced functionality
