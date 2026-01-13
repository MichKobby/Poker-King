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

export type GameEntry = {
  player_name: string
  net_result: number
}
