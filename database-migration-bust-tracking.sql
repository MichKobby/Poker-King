-- Database Migration: Add Bust Tracking
-- This adds tracking for players who go bust (lose all money and rebuy)

-- Create bust_events table to track when players go bust
CREATE TABLE IF NOT EXISTS bust_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_log_id UUID REFERENCES game_logs(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  game_date DATE NOT NULL,
  bust_sequence INTEGER NOT NULL DEFAULT 1, -- Track multiple busts in same game (1st bust, 2nd bust, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bust_events_game_log_id') THEN
        CREATE INDEX idx_bust_events_game_log_id ON bust_events(game_log_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bust_events_player_id') THEN
        CREATE INDEX idx_bust_events_player_id ON bust_events(player_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bust_events_game_date') THEN
        CREATE INDEX idx_bust_events_game_date ON bust_events(game_date);
    END IF;
END
$$;

-- Enable Row Level Security
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'bust_events' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE bust_events ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- Create policies for bust_events table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access on bust_events') THEN
        CREATE POLICY "Allow public read access on bust_events" ON bust_events FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated insert on bust_events') THEN
        CREATE POLICY "Allow authenticated insert on bust_events" ON bust_events FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated update on bust_events') THEN
        CREATE POLICY "Allow authenticated update on bust_events" ON bust_events FOR UPDATE USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated delete on bust_events') THEN
        CREATE POLICY "Allow authenticated delete on bust_events" ON bust_events FOR DELETE USING (true);
    END IF;
END
$$;

-- Enhanced game logs view with bust tracking
CREATE OR REPLACE VIEW game_logs_with_rebuys_and_busts AS
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
  COUNT(r.id) as rebuy_count,
  COUNT(b.id) as bust_count
FROM game_logs gl
LEFT JOIN rebuys r ON gl.id = r.game_log_id
LEFT JOIN bust_events b ON gl.id = b.game_log_id
GROUP BY gl.id, gl.player_id, gl.game_date, gl.buy_in, gl.cash_out, gl.net_result, gl.created_at, gl.updated_at;

-- Enhanced leaderboard with bust statistics
CREATE OR REPLACE VIEW leaderboard_with_rebuys_and_busts AS
SELECT 
  p.id,
  p.name,
  COUNT(glwrb.id) as games_played,
  COALESCE(SUM(glwrb.initial_buy_in), 0) as total_initial_buy_ins,
  COALESCE(SUM(glwrb.total_rebuys), 0) as total_rebuys,
  COALESCE(SUM(glwrb.total_investment), 0) as total_investment,
  COALESCE(SUM(glwrb.cash_out), 0) as total_cash_outs,
  COALESCE(SUM(glwrb.net_result_with_rebuys), 0) as net_profit_with_rebuys,
  COALESCE(SUM(glwrb.original_net_result), 0) as original_net_profit,
  COALESCE(SUM(glwrb.rebuy_count), 0) as total_rebuy_instances,
  COALESCE(SUM(glwrb.bust_count), 0) as total_bust_count,
  -- Calculate bust rate (percentage of games where player went bust)
  CASE 
    WHEN COUNT(glwrb.id) > 0 THEN 
      ROUND((COUNT(CASE WHEN glwrb.bust_count > 0 THEN 1 END) * 100.0 / COUNT(glwrb.id)), 1)
    ELSE 0 
  END as bust_rate_percentage
FROM players p
LEFT JOIN game_logs_with_rebuys_and_busts glwrb ON p.id = glwrb.player_id
GROUP BY p.id, p.name
ORDER BY net_profit_with_rebuys DESC;

-- Bust Club leaderboard (most busts)
CREATE OR REPLACE VIEW bust_club_leaderboard AS
SELECT 
  p.id,
  p.name,
  COUNT(glwrb.id) as games_played,
  COALESCE(SUM(glwrb.bust_count), 0) as total_bust_count,
  -- Calculate bust rate (percentage of games where player went bust)
  CASE 
    WHEN COUNT(glwrb.id) > 0 THEN 
      ROUND((COUNT(CASE WHEN glwrb.bust_count > 0 THEN 1 END) * 100.0 / COUNT(glwrb.id)), 1)
    ELSE 0 
  END as bust_rate_percentage,
  -- Recent bust activity (last 30 days)
  COUNT(CASE WHEN glwrb.game_date >= CURRENT_DATE - INTERVAL '30 days' AND glwrb.bust_count > 0 THEN 1 END) as recent_busts
FROM players p
LEFT JOIN game_logs_with_rebuys_and_busts glwrb ON p.id = glwrb.player_id
GROUP BY p.id, p.name
HAVING COALESCE(SUM(glwrb.bust_count), 0) > 0  -- Only show players who have gone bust
ORDER BY total_bust_count DESC, bust_rate_percentage DESC;

-- Recent games with bust tracking
CREATE OR REPLACE VIEW recent_games_with_rebuys_and_busts AS
SELECT 
  p.id,
  p.name,
  COALESCE(SUM(glwrb.net_result_with_rebuys), 0) as recent_profit_with_rebuys,
  COALESCE(SUM(glwrb.original_net_result), 0) as recent_profit_original,
  COALESCE(SUM(glwrb.total_rebuys), 0) as recent_total_rebuys,
  COALESCE(SUM(glwrb.bust_count), 0) as recent_bust_count
FROM players p
LEFT JOIN game_logs_with_rebuys_and_busts glwrb ON p.id = glwrb.player_id 
  AND glwrb.game_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.id, p.name
ORDER BY recent_profit_with_rebuys DESC;

-- Verify migration completed successfully
SELECT 'Bust tracking migration completed successfully!' as status;
