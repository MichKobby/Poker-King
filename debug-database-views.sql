-- Debug script to check database state
-- Run this in Supabase SQL editor to see what's missing

-- Check if tables exist
SELECT 'Tables that exist:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('rebuys', 'bust_events', 'game_logs', 'players');

-- Check if views exist
SELECT 'Views that exist:' as info;
SELECT table_name as view_name
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN (
  'leaderboard_with_rebuys_and_busts',
  'bust_club_leaderboard',
  'game_logs_with_rebuys_and_busts',
  'recent_games_with_rebuys_and_busts'
);

-- Check if there's any data in bust_events
SELECT 'Bust events count:' as info;
SELECT COUNT(*) as bust_events_count FROM bust_events;

-- Check if there's any data in rebuys
SELECT 'Rebuys count:' as info;
SELECT COUNT(*) as rebuys_count FROM rebuys;

-- Test the bust_club_leaderboard view
SELECT 'Bust club data:' as info;
SELECT * FROM bust_club_leaderboard LIMIT 3;
