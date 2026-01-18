-- Test script to manually create bust tracking data for testing
-- Run this ONLY if you want to test with sample data

-- First, let's see what players exist
SELECT 'Existing players:' as info;
SELECT id, name FROM players LIMIT 5;

-- Check recent game logs
SELECT 'Recent game logs:' as info;
SELECT gl.id, p.name, gl.game_date, gl.buy_in, gl.cash_out 
FROM game_logs gl 
JOIN players p ON gl.player_id = p.id 
ORDER BY gl.game_date DESC 
LIMIT 5;

-- If you want to manually test, uncomment and modify these lines:
-- Replace 'PLAYER_ID_HERE' with an actual player ID from above
-- Replace 'GAME_LOG_ID_HERE' with an actual game log ID from above

/*
-- Insert a test rebuy
INSERT INTO rebuys (game_log_id, player_id, game_date, rebuy_amount, rebuy_sequence)
VALUES ('GAME_LOG_ID_HERE', 'PLAYER_ID_HERE', '2024-01-18', 10.00, 1);

-- Insert a corresponding bust event
INSERT INTO bust_events (game_log_id, player_id, game_date, bust_sequence)
VALUES ('GAME_LOG_ID_HERE', 'PLAYER_ID_HERE', '2024-01-18', 1);
*/

-- Check if bust club view works
SELECT 'Testing bust club view:' as info;
SELECT * FROM bust_club_leaderboard LIMIT 3;
