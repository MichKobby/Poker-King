-- Retroactive Bust Event Creation
-- This script creates bust events for all existing rebuys in the database
-- Each rebuy represents a bust event (player lost all money and had to rebuy)

-- First, let's see what rebuy data we have
SELECT 'Current rebuy data summary:' as info;
SELECT 
  COUNT(*) as total_rebuys,
  COUNT(DISTINCT player_id) as players_with_rebuys,
  COUNT(DISTINCT game_log_id) as games_with_rebuys
FROM rebuys;

-- Show players with most rebuys (future bust champions)
SELECT 'Top rebuy players (future bust champions):' as info;
SELECT 
  p.name,
  COUNT(r.id) as total_rebuys,
  COUNT(DISTINCT r.game_log_id) as games_with_rebuys
FROM rebuys r
JOIN players p ON r.player_id = p.id
GROUP BY p.id, p.name
ORDER BY total_rebuys DESC
LIMIT 5;

-- Create bust events for all existing rebuys
-- Each rebuy = one bust event with the same sequence number
INSERT INTO bust_events (game_log_id, player_id, game_date, bust_sequence, created_at, updated_at)
SELECT 
  r.game_log_id,
  r.player_id,
  r.game_date,
  r.rebuy_sequence, -- Use the same sequence as the rebuy
  r.created_at,
  r.updated_at
FROM rebuys r
WHERE NOT EXISTS (
  -- Only insert if bust event doesn't already exist for this rebuy
  SELECT 1 FROM bust_events b 
  WHERE b.game_log_id = r.game_log_id 
  AND b.player_id = r.player_id 
  AND b.bust_sequence = r.rebuy_sequence
);

-- Show results after creation
SELECT 'Bust events created successfully!' as status;

-- Show the new bust club champions
SELECT 'NEW BUST CLUB CHAMPIONS:' as info;
SELECT 
  p.name,
  COUNT(b.id) as total_bust_count,
  COUNT(DISTINCT b.game_log_id) as games_with_busts,
  ROUND(
    (COUNT(DISTINCT CASE WHEN b.id IS NOT NULL THEN b.game_log_id END) * 100.0 / 
     COUNT(DISTINCT gl.id)), 1
  ) as bust_rate_percentage
FROM players p
LEFT JOIN game_logs gl ON p.id = gl.player_id
LEFT JOIN bust_events b ON p.id = b.player_id
GROUP BY p.id, p.name
HAVING COUNT(b.id) > 0
ORDER BY total_bust_count DESC, bust_rate_percentage DESC
LIMIT 10;

-- Verify the bust_club_leaderboard view now has data
SELECT 'Bust Club Leaderboard (Top 5):' as info;
SELECT * FROM bust_club_leaderboard LIMIT 5;
