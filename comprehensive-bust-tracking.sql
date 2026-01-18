-- Comprehensive Bust Tracking Logic
-- Busts occur in two scenarios:
-- 1. Player has rebuys (lost all money and had to rebuy)
-- 2. Player cashes out with $0 (lost all money and went home empty)

-- Clear existing bust events to start fresh
DELETE FROM bust_events;

-- Create bust events for rebuys (each rebuy = one bust)
INSERT INTO bust_events (game_log_id, player_id, game_date, bust_sequence, created_at, updated_at)
SELECT 
  r.game_log_id,
  r.player_id,
  r.game_date,
  r.rebuy_sequence,
  r.created_at,
  r.updated_at
FROM rebuys r;

-- Create bust events for players who cashed out with $0
-- Use a high bust_sequence to avoid conflicts with rebuy sequences
INSERT INTO bust_events (game_log_id, player_id, game_date, bust_sequence, created_at, updated_at)
SELECT 
  gl.id as game_log_id,
  gl.player_id,
  gl.game_date,
  COALESCE(
    (SELECT MAX(r.rebuy_sequence) FROM rebuys r WHERE r.game_log_id = gl.id AND r.player_id = gl.player_id), 
    0
  ) + 1 as bust_sequence, -- Next sequence after any rebuys
  gl.created_at,
  gl.updated_at
FROM game_logs gl
WHERE gl.cash_out = 0
AND NOT EXISTS (
  -- Don't duplicate if this player already has bust events from rebuys in this game
  SELECT 1 FROM bust_events b 
  WHERE b.game_log_id = gl.id 
  AND b.player_id = gl.player_id
);

-- Show comprehensive bust analysis
SELECT 'COMPREHENSIVE BUST ANALYSIS:' as info;

-- Show detailed bust breakdown per player
SELECT 
  p.name,
  -- Count busts from rebuys
  COUNT(CASE WHEN b.bust_sequence <= COALESCE(max_rebuy.max_seq, 0) THEN 1 END) as rebuy_busts,
  -- Count busts from zero cashouts
  COUNT(CASE WHEN b.bust_sequence > COALESCE(max_rebuy.max_seq, 0) THEN 1 END) as zero_cashout_busts,
  -- Total busts
  COUNT(b.id) as total_busts,
  -- Games played
  COUNT(DISTINCT gl.id) as games_played,
  -- Bust rate
  ROUND((COUNT(b.id) * 100.0 / COUNT(DISTINCT gl.id)), 1) as bust_rate_percentage
FROM players p
LEFT JOIN game_logs gl ON p.id = gl.player_id
LEFT JOIN bust_events b ON p.id = b.player_id
LEFT JOIN (
  SELECT 
    player_id, 
    game_log_id, 
    MAX(rebuy_sequence) as max_seq
  FROM rebuys 
  GROUP BY player_id, game_log_id
) max_rebuy ON gl.id = max_rebuy.game_log_id AND p.id = max_rebuy.player_id
GROUP BY p.id, p.name
HAVING COUNT(b.id) > 0
ORDER BY total_busts DESC, bust_rate_percentage DESC;

-- Show game-by-game bust details for verification
SELECT 'GAME-BY-GAME BUST DETAILS:' as info;
SELECT 
  p.name,
  gl.game_date,
  gl.buy_in,
  gl.cash_out,
  COALESCE(rebuy_info.rebuy_count, 0) as rebuys,
  COALESCE(rebuy_info.total_rebuy_amount, 0) as total_rebuy_amount,
  COUNT(b.id) as bust_events_in_game,
  STRING_AGG(CAST(b.bust_sequence AS TEXT), ', ' ORDER BY b.bust_sequence) as bust_sequences
FROM game_logs gl
JOIN players p ON gl.player_id = p.id
LEFT JOIN bust_events b ON gl.id = b.game_log_id AND gl.player_id = b.player_id
LEFT JOIN (
  SELECT 
    game_log_id,
    player_id,
    COUNT(*) as rebuy_count,
    SUM(rebuy_amount) as total_rebuy_amount
  FROM rebuys
  GROUP BY game_log_id, player_id
) rebuy_info ON gl.id = rebuy_info.game_log_id AND gl.player_id = rebuy_info.player_id
GROUP BY p.name, gl.game_date, gl.buy_in, gl.cash_out, rebuy_info.rebuy_count, rebuy_info.total_rebuy_amount
HAVING COUNT(b.id) > 0
ORDER BY gl.game_date DESC, p.name;

SELECT 'Comprehensive bust tracking completed!' as status;
