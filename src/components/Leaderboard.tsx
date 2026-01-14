'use client'

import { useEffect, useState } from 'react'
import { Trophy, TrendingUp, TrendingDown, DollarSign, Calendar, Users } from 'lucide-react'
import { supabase, LeaderboardEntry, RecentGameEntry } from '@/lib/supabase'

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [recentGames, setRecentGames] = useState<RecentGameEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLeaderboardData()
  }, [])

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch leaderboard data
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('leaderboard')
        .select('*')
      
      if (leaderboardError) throw leaderboardError

      // Fetch recent games data
      const { data: recentData, error: recentError } = await supabase
        .from('recent_games')
        .select('*')
      
      if (recentError) throw recentError

      setLeaderboard(leaderboardData || [])
      setRecentGames(recentData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-poker-gold-400" />
      case 2:
        return <Trophy className="h-6 w-6 text-gray-400" />
      case 3:
        return <Trophy className="h-6 w-6 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-gray-400">#{position}</span>
    }
  }

  const wallOfShame = leaderboard
    .filter(player => player.net_profit < 0)
    .sort((a, b) => a.net_profit - b.net_profit)
    .slice(0, 1)[0]

  const sharkOfTheMonth = recentGames
    .filter(player => player.recent_profit > 0)
    .sort((a, b) => b.recent_profit - a.recent_profit)
    .slice(0, 1)[0]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-poker-gold-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-center">
        <p className="text-red-300">Error loading leaderboard: {error}</p>
        <button 
          onClick={fetchLeaderboardData}
          className="mt-2 poker-button-secondary"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero Section with Background Image */}
      <div className="poker-hero-image h-32 sm:h-40 md:h-48 flex items-center justify-center relative">
        <div className="text-center z-10 relative px-4">
          <div className="flex items-center justify-center mb-2 sm:mb-4">
            <Trophy className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-yellow-400 mr-2 sm:mr-4" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Poker Night Master</h1>
            <Trophy className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-yellow-400 ml-2 sm:ml-4" />
          </div>
          <p className="text-yellow-200 text-sm sm:text-base md:text-lg">Friday Night Legends Leaderboard</p>
        </div>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Wall of Shame */}
        <div className="poker-card p-4 sm:p-6 hover-lift">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-red-400">Wall of Shame</h3>
            <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
          </div>
          {wallOfShame ? (
            <div className="text-center">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-300 truncate">{wallOfShame.name}</p>
              <p className="text-red-400 text-sm sm:text-base">{formatCurrency(wallOfShame.net_profit)}</p>
              <p className="text-xs sm:text-sm text-gray-400">{wallOfShame.games_played} games</p>
            </div>
          ) : (
            <p className="text-gray-400 text-center text-sm sm:text-base">No losses yet!</p>
          )}
        </div>

        {/* Shark of the Month */}
        <div className="poker-card p-4 sm:p-6 hover-lift">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-poker-gold-400">Shark of the Month</h3>
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-poker-gold-400" />
          </div>
          {sharkOfTheMonth ? (
            <div className="text-center">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-poker-gold-300 truncate">{sharkOfTheMonth.name}</p>
              <p className="text-poker-gold-400 text-sm sm:text-base">{formatCurrency(sharkOfTheMonth.recent_profit)}</p>
              <p className="text-xs sm:text-sm text-gray-400">Last 30 days</p>
            </div>
          ) : (
            <p className="text-gray-400 text-center text-sm sm:text-base">No recent games</p>
          )}
        </div>

        {/* Total Players */}
        <div className="poker-card p-4 sm:p-6 hover-lift sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-poker-green-400">Total Players</h3>
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-poker-green-400" />
          </div>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-poker-green-300">{leaderboard.length}</p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="poker-card-premium hover-lift">
        <div className="p-4 sm:p-6 border-b border-poker-gold-400/20">
          <h2 className="text-xl sm:text-2xl font-bold text-poker-gold-400 flex items-center">
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3" />
            Current Standings
          </h2>
          <p className="text-poker-felt-400 mt-1 sm:mt-2 text-sm sm:text-base">Your poker group's hall of fame and shame</p>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-poker-green-700">
                <th className="text-left p-4 text-poker-gold-400 font-semibold">Rank</th>
                <th className="text-left p-4 text-poker-gold-400 font-semibold">Player</th>
                <th className="text-center p-4 text-poker-gold-400 font-semibold">Games</th>
                <th className="text-right p-4 text-poker-gold-400 font-semibold">Buy-ins</th>
                <th className="text-right p-4 text-poker-gold-400 font-semibold">Cash-outs</th>
                <th className="text-right p-4 text-poker-gold-400 font-semibold">Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((player, index) => (
                <tr 
                  key={player.id} 
                  className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center">
                      {getPositionIcon(index + 1)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-white">{player.name}</div>
                  </td>
                  <td className="p-4 text-center text-gray-300">{player.games_played}</td>
                  <td className="p-4 text-right text-gray-300">{formatCurrency(player.total_buy_ins)}</td>
                  <td className="p-4 text-right text-gray-300">{formatCurrency(player.total_cash_outs)}</td>
                  <td className="p-4 text-right">
                    <span className={`font-semibold ${
                      player.net_profit > 0 
                        ? 'text-poker-green-400' 
                        : player.net_profit < 0 
                        ? 'text-red-400' 
                        : 'text-gray-300'
                    }`} style={{
                      color: player.net_profit > 0 
                        ? '#4ade80' 
                        : player.net_profit < 0 
                        ? '#f87171' 
                        : '#cbd5e1'
                    }}>
                      {formatCurrency(player.net_profit)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 p-4">
          {leaderboard.map((player, index) => (
            <div 
              key={player.id}
              className="poker-card p-4 border border-gray-700 hover:border-poker-gold-400/30 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getPositionIcon(index + 1)}
                  <div>
                    <h3 className="font-bold text-white text-lg">{player.name}</h3>
                    <p className="text-gray-400 text-sm">{player.games_played} games played</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${
                    player.net_profit > 0 
                      ? 'text-poker-green-400' 
                      : player.net_profit < 0 
                      ? 'text-red-400' 
                      : 'text-gray-300'
                  }`} style={{
                    color: player.net_profit > 0 
                      ? '#4ade80' 
                      : player.net_profit < 0 
                      ? '#f87171' 
                      : '#cbd5e1'
                  }}>
                    {formatCurrency(player.net_profit)}
                  </div>
                  <p className="text-gray-400 text-xs">Net Profit</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-700">
                <div className="text-center">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Buy-ins</p>
                  <p className="text-white font-semibold">{formatCurrency(player.total_buy_ins)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Cash-outs</p>
                  <p className="text-white font-semibold">{formatCurrency(player.total_cash_outs)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {leaderboard.length === 0 && (
          <div className="p-6 sm:p-8 text-center">
            <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-base sm:text-lg">No games recorded yet</p>
            <p className="text-gray-500 text-sm sm:text-base">Start by adding your first poker night!</p>
          </div>
        )}
      </div>
    </div>
  )
}
