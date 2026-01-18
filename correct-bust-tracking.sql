-- Correct Bust Tracking Logic
-- A bust occurs when a player cashes out with $0 (lost all their money)
-- This is different from rebuys - a player can rebuy without going bust

-- First, let's see existing game data to understand bust patterns
SELECT 'Games where players went bust (cash_out = 0):' as info;
SELECT 
  p.name,
  gl.game_date,
  gl.buy_in,
  gl.cash_out,
  gl.net_result
FROM game_logs gl
JOIN players p ON gl.player_id = p.id
WHERE gl.cash_out = 0
ORDER BY gl.game_date DESC, p.name;

-- Count total busts per player (historical data)
SELECT 'Historical bust counts per player:' as info;
SELECT 
  p.name,
  COUNT(CASE WHEN gl.cash_out = 0 THEN 1 END) as total_busts,
  COUNT(gl.id) as total_games,
  ROUND(
    (COUNT(CASE WHEN gl.cash_out = 0 THEN 1 END) * 100.0 / COUNT(gl.id)), 1
  ) as bust_rate_percentage
FROM players p
LEFT JOIN game_logs gl ON p.id = gl.player_id
GROUP BY p.id, p.name
HAVING COUNT(gl.id) > 0
ORDER BY total_busts DESC, bust_rate_percentage DESC;

-- Clear existing incorrect bust events (if any)
DELETE FROM bust_events;

-- Create correct bust events for all historical games where cash_out = 0
INSERT INTO bust_events (game_log_id, player_id, game_date, bust_sequence, created_at, updated_at)
SELECT 
  gl.id as game_log_id,
  gl.player_id,
  gl.game_date,
  1 as bust_sequence, -- Each game can only have one bust per player
  gl.created_at,
  gl.updated_at
FROM game_logs gl
WHERE gl.cash_out = 0; -- This is the correct condition for a bust

-- Show results
SELECT 'Bust events created for players who cashed out with $0!' as status;

-- Show the correct bust club champions
SELECT 'CORRECT BUST CLUB CHAMPIONS (players who lost everything):' as info;
SELECT 
  p.name,
  COUNT(b.id) as total_bust_count,
  COUNT(DISTINCT gl.id) as total_games,
  ROUND(
    (COUNT(b.id) * 100.0 / COUNT(DISTINCT gl.id)), 1
  ) as bust_rate_percentage,
  -- Show recent busts (last 30 days)
  COUNT(CASE WHEN b.game_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_busts
FROM players p
LEFT JOIN game_logs gl ON p.id = gl.player_id
LEFT JOIN bust_events b ON p.id = b.player_id
GROUP BY p.id, p.name
HAVING COUNT(b.id) > 0
ORDER BY total_bust_count DESC, bust_rate_percentage DESC;

-- Verify the bust_club_leaderboard view now has correct data
SELECT 'Bust Club Leaderboard (based on cash_out = 0):' as info;
SELECT * FROM bust_club_leaderboard LIMIT 5;
