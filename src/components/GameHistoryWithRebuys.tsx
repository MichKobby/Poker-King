'use client'

import { useEffect, useState } from 'react'
import { Calendar, Users, DollarSign, ChevronDown, ChevronUp, RefreshCw, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type GameHistoryEntryWithRebuys = {
  game_date: string
  players: {
    name: string
    initial_buy_in: number
    rebuys: { amount: number; sequence: number }[]
    total_investment: number
    cash_out: number
    net_result: number
  }[]
}

export default function GameHistoryWithRebuys() {
  const [gameHistory, setGameHistory] = useState<GameHistoryEntryWithRebuys[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedGames, setExpandedGames] = useState<Set<string>>(new Set())
  const [showRebuys, setShowRebuys] = useState(true)

  useEffect(() => {
    fetchGameHistory()
  }, [])

  const fetchGameHistory = async () => {
    try {
      setLoading(true)
      
      // Fetch game logs with player information and rebuys
      const { data: gameLogs, error: gameLogsError } = await supabase
        .from('game_logs_with_rebuys')
        .select(`
          game_date,
          initial_buy_in,
          total_rebuys,
          total_investment,
          cash_out,
          net_result_with_rebuys,
          player_id,
          players (
            name
          )
        `)
        .order('game_date', { ascending: false })

      if (gameLogsError) throw gameLogsError

      // Fetch rebuy details
      const { data: rebuys, error: rebuysError } = await supabase
        .from('rebuys')
        .select('*')
        .order('game_date', { ascending: false })
        .order('rebuy_sequence', { ascending: true })

      if (rebuysError) throw rebuysError

      // Group by game date and combine with rebuy information
      const groupedGames: { [key: string]: GameHistoryEntryWithRebuys } = {}
      
      gameLogs?.forEach((log: any) => {
        const dateKey = log.game_date
        
        if (!groupedGames[dateKey]) {
          groupedGames[dateKey] = {
            game_date: dateKey,
            players: []
          }
        }

        // Get rebuys for this player and game
        const playerRebuys = rebuys?.filter(r => 
          r.player_id === log.player_id && r.game_date === log.game_date
        ) || []

        groupedGames[dateKey].players.push({
          name: log.players.name,
          initial_buy_in: log.initial_buy_in,
          rebuys: playerRebuys.map(r => ({
            amount: r.rebuy_amount,
            sequence: r.rebuy_sequence
          })),
          total_investment: log.total_investment,
          cash_out: log.cash_out,
          net_result: log.net_result_with_rebuys
        })
      })

      // Convert to array and sort by date
      const historyArray = Object.values(groupedGames).sort(
        (a, b) => new Date(b.game_date).getTime() - new Date(a.game_date).getTime()
      )

      setGameHistory(historyArray)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const toggleGameExpansion = (gameDate: string) => {
    const newExpanded = new Set(expandedGames)
    if (newExpanded.has(gameDate)) {
      newExpanded.delete(gameDate)
    } else {
      newExpanded.add(gameDate)
    }
    setExpandedGames(newExpanded)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getGameTotals = (game: GameHistoryEntryWithRebuys) => {
    const totalInvestment = game.players.reduce((sum, p) => sum + p.total_investment, 0)
    const totalCashOut = game.players.reduce((sum, p) => sum + p.cash_out, 0)
    const totalRebuys = game.players.reduce((sum, p) => sum + p.rebuys.reduce((rebuySum, r) => rebuySum + r.amount, 0), 0)
    const rebuyCount = game.players.reduce((sum, p) => sum + p.rebuys.length, 0)
    
    return { totalInvestment, totalCashOut, totalRebuys, rebuyCount }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-poker-gold-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading game history...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-center">
        <p className="text-red-300">Error loading game history: {error}</p>
        <button 
          onClick={fetchGameHistory}
          className="mt-2 poker-button-secondary"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-poker-gold-400 mb-2 flex items-center justify-center">
          <Calendar className="h-8 w-8 mr-3" />
          Enhanced Game History
        </h1>
        <p className="text-gray-300">Complete game records with rebuy tracking</p>
      </div>


      {/* Game History */}
      <div className="space-y-4">
        {gameHistory.map((game) => {
          const isExpanded = expandedGames.has(game.game_date)
          const { totalInvestment, totalCashOut, totalRebuys, rebuyCount } = getGameTotals(game)
          
          return (
            <div key={game.game_date} className="poker-card">
              {/* Game Header */}
              <div 
                className="p-6 cursor-pointer hover:bg-gray-800/30 transition-colors"
                onClick={() => toggleGameExpansion(game.game_date)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {formatDate(game.game_date)}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {game.players.length} players
                        </span>
                        <span className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {formatCurrency(totalInvestment)} invested
                        </span>
                        {showRebuys && rebuyCount > 0 && (
                          <span className="flex items-center">
                            <Plus className="h-4 w-4 mr-1" />
                            {rebuyCount} rebuys
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-poker-gold-400">
                        {formatCurrency(totalCashOut)}
                      </div>
                      <div className="text-sm text-gray-400">Total payout</div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Game Details */}
              {isExpanded && (
                <div className="border-t border-gray-700">
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-2 text-gray-300 font-semibold">Player</th>
                            <th className="text-right py-2 text-gray-300 font-semibold">Buy-in</th>
                            {showRebuys && (
                              <th className="text-right py-2 text-gray-300 font-semibold">Rebuys</th>
                            )}
                            <th className="text-right py-2 text-gray-300 font-semibold">Total Investment</th>
                            <th className="text-right py-2 text-gray-300 font-semibold">Cash Out</th>
                            <th className="text-right py-2 text-gray-300 font-semibold">Net Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {game.players.map((player, index) => (
                            <tr key={index} className="border-b border-gray-800">
                              <td className="py-3">
                                <div className="font-semibold text-white">{player.name}</div>
                              </td>
                              <td className="py-3 text-right text-gray-300">
                                {formatCurrency(player.initial_buy_in)}
                              </td>
                              {showRebuys && (
                                <td className="py-3 text-right">
                                  {player.rebuys.length > 0 ? (
                                    <div>
                                      <div className="text-gray-300">
                                        {formatCurrency(player.rebuys.reduce((sum, r) => sum + r.amount, 0))}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {player.rebuys.map((rebuy, i) => (
                                          <span key={i}>
                                            #{rebuy.sequence}: {formatCurrency(rebuy.amount)}
                                            {i < player.rebuys.length - 1 && ', '}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500">-</span>
                                  )}
                                </td>
                              )}
                              <td className="py-3 text-right text-gray-300">
                                {formatCurrency(player.total_investment)}
                              </td>
                              <td className="py-3 text-right text-gray-300">
                                {formatCurrency(player.cash_out)}
                              </td>
                              <td className="py-3 text-right">
                                <span className={`font-semibold ${
                                  player.net_result >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {formatCurrency(player.net_result)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-gray-600 font-semibold">
                            <td className="py-3 text-poker-gold-400">Totals</td>
                            <td className="py-3 text-right text-poker-gold-400">
                              {formatCurrency(game.players.reduce((sum, p) => sum + p.initial_buy_in, 0))}
                            </td>
                            {showRebuys && (
                              <td className="py-3 text-right text-poker-gold-400">
                                {formatCurrency(totalRebuys)}
                              </td>
                            )}
                            <td className="py-3 text-right text-poker-gold-400">
                              {formatCurrency(totalInvestment)}
                            </td>
                            <td className="py-3 text-right text-poker-gold-400">
                              {formatCurrency(totalCashOut)}
                            </td>
                            <td className="py-3 text-right text-poker-gold-400">
                              {formatCurrency(totalCashOut - totalInvestment)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {gameHistory.length === 0 && (
        <div className="poker-card p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Games Yet</h3>
          <p className="text-gray-400">Start recording games to see the history here!</p>
        </div>
      )}
    </div>
  )
}
