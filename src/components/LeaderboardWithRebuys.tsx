'use client'

import { useEffect, useState } from 'react'
import { Trophy, TrendingUp, TrendingDown, DollarSign, Calendar, Users, RefreshCw, Zap } from 'lucide-react'
import { supabase, LeaderboardEntryWithRebuysAndBusts, RecentGameEntryWithRebuys, BustClubEntry } from '@/lib/supabase'

export default function LeaderboardWithRebuys() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryWithRebuysAndBusts[]>([])
  const [recentGames, setRecentGames] = useState<RecentGameEntryWithRebuys[]>([])
  const [bustClub, setBustClub] = useState<BustClubEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRebuys, setShowRebuys] = useState(true)

  useEffect(() => {
    fetchLeaderboardData()
  }, [])

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch enhanced leaderboard data with rebuys and busts
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('leaderboard_with_rebuys_and_busts')
        .select('*')
      
      if (leaderboardError) throw leaderboardError

      // Fetch enhanced recent games data with rebuys
      const { data: recentData, error: recentError } = await supabase
        .from('recent_games_with_rebuys_and_busts')
        .select('*')
      
      if (recentError) throw recentError

      // Fetch bust club data
      const { data: bustData, error: bustError } = await supabase
        .from('bust_club_leaderboard')
        .select('*')
        .limit(10) // Get top 10 bust club members
      
      if (bustError) throw bustError

      setLeaderboard(leaderboardData || [])
      setRecentGames(recentData || [])
      setBustClub(bustData || [])
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
    .filter(player => (showRebuys ? player.net_profit_with_rebuys : player.original_net_profit) < 0)
    .sort((a, b) => (showRebuys ? a.net_profit_with_rebuys - b.net_profit_with_rebuys : a.original_net_profit - b.original_net_profit))
    .slice(0, 1)[0]

  const sharkOfTheMonth = recentGames
    .filter(player => (showRebuys ? player.recent_profit_with_rebuys : player.recent_profit_original) > 0)
    .sort((a, b) => (showRebuys ? b.recent_profit_with_rebuys - a.recent_profit_with_rebuys : b.recent_profit_original - a.recent_profit_original))
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
          <p className="text-yellow-200 text-sm sm:text-base md:text-lg">Enhanced Leaderboard with Rebuy Tracking</p>
        </div>
      </div>

      {/* Special Recognition Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Shark of the Month */}
        {sharkOfTheMonth && (
          <div className="poker-card p-6 border-2 border-green-500/50">
            <div className="flex items-center mb-4">
              <TrendingUp className="h-8 w-8 text-green-400 mr-3" />
              <div>
                <h3 className="text-xl font-bold text-green-400">Shark of the Month</h3>
                <p className="text-gray-400 text-sm">Best recent performance</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white mb-2">{sharkOfTheMonth.name}</p>
              <p className="text-green-400 text-xl font-semibold">
                {formatCurrency(showRebuys ? sharkOfTheMonth.recent_profit_with_rebuys : sharkOfTheMonth.recent_profit_original)}
              </p>
              {showRebuys && sharkOfTheMonth.recent_total_rebuys > 0 && (
                <p className="text-gray-400 text-sm mt-1">
                  Total rebuys: {formatCurrency(sharkOfTheMonth.recent_total_rebuys)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Wall of Shame */}
        {wallOfShame && (
          <div className="poker-card p-6 border-2 border-red-500/50">
            <div className="flex items-center mb-4">
              <TrendingDown className="h-8 w-8 text-red-400 mr-3" />
              <div>
                <h3 className="text-xl font-bold text-red-400">Wall of Shame</h3>
                <p className="text-gray-400 text-sm">Biggest overall loser</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white mb-2">{wallOfShame.name}</p>
              <p className="text-red-400 text-xl font-semibold">
                {formatCurrency(showRebuys ? wallOfShame.net_profit_with_rebuys : wallOfShame.original_net_profit)}
              </p>
              {showRebuys && wallOfShame.total_rebuys > 0 && (
                <p className="text-gray-400 text-sm mt-1">
                  Total rebuys: {formatCurrency(wallOfShame.total_rebuys)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Bust Club Champion */}
        {bustClub.length > 0 && bustClub[0] && (
          <div className="poker-card p-6 border-2 border-orange-500/50">
            <div className="flex items-center mb-4">
              <Zap className="h-8 w-8 text-orange-400 mr-3" />
              <div>
                <h3 className="text-xl font-bold text-orange-400">Bust Club Champion</h3>
                <p className="text-gray-400 text-sm">Most bust events</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white mb-2">{bustClub[0].name}</p>
              <p className="text-orange-400 text-xl font-semibold">
                {bustClub[0].total_bust_count} busts
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {bustClub[0].recent_busts} recent busts
              </p>
            </div>
          </div>
        )}

      </div>


      {/* Main Leaderboard */}
      <div className="poker-card">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-poker-gold-400 flex items-center">
              <Trophy className="h-6 w-6 mr-2" />
              Overall Leaderboard
            </h2>
            <div className="text-gray-400 text-sm">
              {showRebuys ? 'Including all rebuys' : 'Original buy-ins only'}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-4 text-gray-300 font-semibold">Rank</th>
                <th className="text-left p-4 text-gray-300 font-semibold">Player</th>
                <th className="text-center p-4 text-gray-300 font-semibold">Games</th>
                <th className="text-right p-4 text-gray-300 font-semibold">Investment</th>
                <th className="text-right p-4 text-gray-300 font-semibold">Cash Out</th>
                <th className="text-right p-4 text-gray-300 font-semibold">Net Profit</th>
                {showRebuys && (
                  <th className="text-center p-4 text-gray-300 font-semibold">Rebuys</th>
                )}
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((player, index) => {
                const netProfit = showRebuys ? player.net_profit_with_rebuys : player.original_net_profit
                const investment = showRebuys ? player.total_investment : player.total_initial_buy_ins
                
                return (
                  <tr 
                    key={player.id} 
                    className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
                      index < 3 ? 'bg-gray-800/30' : ''
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center">
                        {getPositionIcon(index + 1)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-white">{player.name}</div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center">
                        <Users className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-gray-300">{player.games_played}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-gray-300">{formatCurrency(investment)}</div>
                      {showRebuys && player.total_rebuys > 0 && (
                        <div className="text-xs text-gray-500">
                          +{formatCurrency(player.total_rebuys)} rebuys
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-gray-300">{formatCurrency(player.total_cash_outs)}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className={`font-semibold ${
                        netProfit >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatCurrency(netProfit)}
                      </div>
                    </td>
                    {showRebuys && (
                      <td className="p-4 text-center">
                        <div className="text-gray-300">{player.total_rebuy_instances}</div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {leaderboard.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No games recorded yet. Start playing to see the leaderboard!</p>
          </div>
        )}
      </div>

      {/* Bust Club Leaderboard */}
      {bustClub.length > 0 && (
        <div className="poker-card">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-orange-400 flex items-center">
              <Zap className="h-6 w-6 mr-2" />
              Bust Club Leaderboard
            </h2>
            <p className="text-gray-400 text-sm mt-1">Players who lost all their money (rebuys + zero cashouts)</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-4 text-gray-300 font-semibold">Rank</th>
                  <th className="text-left p-4 text-gray-300 font-semibold">Player</th>
                  <th className="text-center p-4 text-gray-300 font-semibold">Total Busts</th>
                  <th className="text-center p-4 text-gray-300 font-semibold">Games Played</th>
                  <th className="text-center p-4 text-gray-300 font-semibold">Recent Busts</th>
                </tr>
              </thead>
              <tbody>
                {bustClub.map((player, index) => (
                  <tr key={player.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="p-4">
                      <div className="flex items-center">
                        {index === 0 && (
                          <Zap className="h-5 w-5 text-orange-400 mr-2" />
                        )}
                        <span className="text-gray-300 font-semibold">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`font-semibold ${
                        index === 0 ? 'text-orange-400' : 
                        index === 1 ? 'text-orange-300' : 
                        index === 2 ? 'text-orange-200' : 'text-white'
                      }`}>
                        {player.name}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-orange-400 font-bold text-lg">
                        {player.total_bust_count}
                      </span>
                    </td>
                    <td className="p-4 text-center text-gray-300">
                      {player.games_played}
                    </td>
                    <td className="p-4 text-center text-gray-400">
                      {player.recent_busts}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
