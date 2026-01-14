'use client'

import { useEffect, useState } from 'react'
import { Calendar, Users, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type GameHistoryEntry = {
  game_date: string
  players: {
    name: string
    buy_in: number
    cash_out: number
    net_result: number
  }[]
}

export default function GameHistory() {
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedGames, setExpandedGames] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchGameHistory()
  }, [])

  const fetchGameHistory = async () => {
    try {
      setLoading(true)
      
      // Fetch all game logs with player information
      const { data: gameLogs, error: gameLogsError } = await supabase
        .from('game_logs')
        .select(`
          game_date,
          buy_in,
          cash_out,
          net_result,
          players (
            name
          )
        `)
        .order('game_date', { ascending: false })

      if (gameLogsError) throw gameLogsError

      // Group by game date
      const groupedGames: { [key: string]: GameHistoryEntry } = {}
      
      gameLogs?.forEach((log: any) => {
        const dateKey = log.game_date
        
        if (!groupedGames[dateKey]) {
          groupedGames[dateKey] = {
            game_date: dateKey,
            players: []
          }
        }
        
        groupedGames[dateKey].players.push({
          name: log.players.name,
          buy_in: log.buy_in,
          cash_out: log.cash_out,
          net_result: log.net_result
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
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

  const getGameSummary = (players: GameHistoryEntry['players']) => {
    const totalPot = players.reduce((sum, p) => sum + p.buy_in, 0)
    const bigWinner = players.reduce((max, p) => p.net_result > max.net_result ? p : max, players[0])
    const bigLoser = players.reduce((min, p) => p.net_result < min.net_result ? p : min, players[0])
    
    return { totalPot, bigWinner, bigLoser }
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
    <div className="space-y-4">
      <div className="poker-card">
        <div className="p-6 border-b border-poker-green-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-poker-gold-400 flex items-center">
              <Calendar className="h-8 w-8 mr-3" />
              Game History
            </h2>
            <button 
              onClick={fetchGameHistory}
              className="poker-button-secondary text-sm"
            >
              Refresh
            </button>
          </div>
          <p className="text-gray-400 mt-2">Click on any game to see detailed results</p>
        </div>

        <div className="divide-y divide-gray-800">
          {gameHistory.map((game) => {
            const { totalPot, bigWinner, bigLoser } = getGameSummary(game.players)
            const isExpanded = expandedGames.has(game.game_date)
            
            return (
              <div key={game.game_date} className="p-6">
                <button
                  onClick={() => toggleGameExpansion(game.game_date)}
                  className="w-full text-left hover:bg-gray-800/50 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {formatDate(game.game_date)}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {game.players.length} players
                            </span>
                            <span className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {formatCurrency(totalPot)} pot
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 mt-3">
                        <div className="text-sm">
                          <span className="text-gray-400">Big Winner: </span>
                          <span className="text-poker-green-400 font-semibold">
                            {bigWinner.name} ({formatCurrency(bigWinner.net_result)})
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-400">Big Loser: </span>
                          <span className="text-red-400 font-semibold">
                            {bigLoser.name} ({formatCurrency(bigLoser.net_result)})
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-poker-gold-400 mb-3">
                      Detailed Results
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-2 text-poker-gold-400 font-semibold">Player</th>
                            <th className="text-right py-2 text-poker-gold-400 font-semibold">Buy-in</th>
                            <th className="text-right py-2 text-poker-gold-400 font-semibold">Cash-out</th>
                            <th className="text-right py-2 text-poker-gold-400 font-semibold">Net Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {game.players
                            .sort((a, b) => b.net_result - a.net_result)
                            .map((player, index) => (
                            <tr key={`${game.game_date}-${player.name}`} className="border-b border-gray-700/50">
                              <td className="py-2 text-white font-medium">{player.name}</td>
                              <td className="py-2 text-right text-gray-300">{formatCurrency(player.buy_in)}</td>
                              <td className="py-2 text-right text-gray-300">{formatCurrency(player.cash_out)}</td>
                              <td className="py-2 text-right">
                                <span className={`font-semibold ${
                                  player.net_result > 0 
                                    ? 'text-poker-green-400' 
                                    : player.net_result < 0 
                                    ? 'text-red-400' 
                                    : 'text-gray-300'
                                }`} style={{
                                  color: player.net_result > 0 
                                    ? '#4ade80' 
                                    : player.net_result < 0 
                                    ? '#f87171' 
                                    : '#cbd5e1'
                                }}>
                                  {formatCurrency(player.net_result)}
                                </span>
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
          })}
        </div>

        {gameHistory.length === 0 && (
          <div className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No games recorded yet</p>
            <p className="text-gray-500">Game history will appear here once you start recording poker nights</p>
          </div>
        )}
      </div>
    </div>
  )
}
