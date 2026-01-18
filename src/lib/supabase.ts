import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aggyzmjbjqgaszamxxck.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZ3l6bWpianFnYXN6YW14eGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjkzMTMsImV4cCI6MjA4Mzg0NTMxM30._bjGhrxJj_cM4r4sJWtiZtAWRQrQLr4DemUB6uKKqWs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Player = {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export type GameLog = {
  id: string
  player_id: string
  game_date: string
  buy_in: number
  cash_out: number
  net_result: number
  created_at: string
  updated_at: string
}

export type LeaderboardEntry = {
  id: string
  name: string
  games_played: number
  total_buy_ins: number
  total_cash_outs: number
  net_profit: number
}

export type RecentGameEntry = {
  id: string
  name: string
  recent_profit: number
}

export type Rebuy = {
  id: string
  game_log_id: string
  player_id: string
  game_date: string
  rebuy_amount: number
  rebuy_sequence: number
  created_at: string
  updated_at: string
}

export type GameLogWithRebuys = {
  id: string
  player_id: string
  game_date: string
  initial_buy_in: number
  total_rebuys: number
  total_investment: number
  cash_out: number
  net_result_with_rebuys: number
  original_net_result: number
  created_at: string
  updated_at: string
  rebuy_count: number
}

export type LeaderboardEntryWithRebuys = {
  id: string
  name: string
  games_played: number
  total_initial_buy_ins: number
  total_rebuys: number
  total_investment: number
  total_cash_outs: number
  net_profit_with_rebuys: number
  original_net_profit: number
  total_rebuy_instances: number
}

export type RecentGameEntryWithRebuys = {
  id: string
  name: string
  recent_profit_with_rebuys: number
  recent_profit_original: number
  recent_total_rebuys: number
}

export type GameEntry = {
  player_name: string
  net_result: number
}

export type BustEvent = {
  id: string
  game_log_id: string
  player_id: string
  game_date: string
  bust_sequence: number
  created_at: string
  updated_at: string
}

export type GameLogWithRebuysAndBusts = {
  id: string
  player_id: string
  game_date: string
  initial_buy_in: number
  total_rebuys: number
  total_investment: number
  cash_out: number
  net_result_with_rebuys: number
  original_net_result: number
  created_at: string
  updated_at: string
  rebuy_count: number
  bust_count: number
}

export type LeaderboardEntryWithRebuysAndBusts = {
  id: string
  name: string
  games_played: number
  total_initial_buy_ins: number
  total_rebuys: number
  total_investment: number
  total_cash_outs: number
  net_profit_with_rebuys: number
  original_net_profit: number
  total_rebuy_instances: number
  total_bust_count: number
  bust_rate_percentage: number
}

export type BustClubEntry = {
  id: string
  name: string
  games_played: number
  total_bust_count: number
  bust_rate_percentage: number
  recent_busts: number
}

export type GameEntryWithRebuys = {
  player_name: string
  final_amount: number
  rebuys: number[]
}
