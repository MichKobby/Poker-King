'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus, Save, Lock, Calendar, DollarSign, Users, AlertCircle, RefreshCw } from 'lucide-react'
import { supabase, Player, GameEntryWithRebuys } from '@/lib/supabase'

export default function GameEntryFormWithRebuys() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [gameDate, setGameDate] = useState('')
  const [buyInAmount, setBuyInAmount] = useState(30)
  const [players, setPlayers] = useState<GameEntryWithRebuys[]>([
    { player_name: '', final_amount: 0, rebuys: [] }
  ])
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchAvailablePlayers()
    }
  }, [isAuthenticated])

  const fetchAvailablePlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name')

      if (error) throw error
      setAvailablePlayers(data || [])
    } catch (err) {
      console.error('Failed to fetch players:', err)
    }
  }

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'admin123') {
      setIsAuthenticated(true)
      setError(null)
    } else {
      setError('Invalid password')
    }
  }

  const addPlayer = () => {
    setPlayers([...players, { player_name: '', final_amount: 0, rebuys: [] }])
  }

  const removePlayer = (index: number) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index))
    }
  }

  const updatePlayer = (index: number, field: keyof GameEntryWithRebuys, value: string | number | number[]) => {
    const updatedPlayers = [...players]
    updatedPlayers[index] = { ...updatedPlayers[index], [field]: value }
    setPlayers(updatedPlayers)
  }

  const addRebuy = (playerIndex: number) => {
    const updatedPlayers = [...players]
    updatedPlayers[playerIndex].rebuys.push(0)
    setPlayers(updatedPlayers)
  }

  const removeRebuy = (playerIndex: number, rebuyIndex: number) => {
    const updatedPlayers = [...players]
    updatedPlayers[playerIndex].rebuys.splice(rebuyIndex, 1)
    setPlayers(updatedPlayers)
  }

  const updateRebuy = (playerIndex: number, rebuyIndex: number, amount: number) => {
    const updatedPlayers = [...players]
    updatedPlayers[playerIndex].rebuys[rebuyIndex] = amount
    setPlayers(updatedPlayers)
  }

  const getPlayerTotalInvestment = (player: GameEntryWithRebuys) => {
    const totalRebuys = player.rebuys.reduce((sum, rebuy) => sum + (rebuy || 0), 0)
    return buyInAmount + totalRebuys
  }

  const getTotalCashOut = () => {
    return players.reduce((sum, player) => sum + (player.final_amount || 0), 0)
  }

  const getTotalInvestment = () => {
    return players.reduce((sum, player) => sum + getPlayerTotalInvestment(player), 0)
  }

  const isFormValid = () => {
    const hasValidDate = gameDate.trim() !== ''
    const hasValidPlayers = players.every(p => p.player_name.trim() !== '' && typeof p.final_amount === 'number')
    const hasValidRebuys = players.every(p => p.rebuys.every(r => typeof r === 'number' && r >= 0))
    const isBalanced = Math.abs(getTotalCashOut() - getTotalInvestment()) < 0.01
    return hasValidDate && hasValidPlayers && hasValidRebuys && isBalanced
  }

  const getValidationErrors = () => {
    const errors = []
    if (gameDate.trim() === '') errors.push('Game date is required')
    if (!players.every(p => p.player_name.trim() !== '')) errors.push('All players must be selected')
    if (!players.every(p => typeof p.final_amount === 'number')) errors.push('All final amounts must be entered')
    if (!players.every(p => p.rebuys.every(r => typeof r === 'number' && r >= 0))) errors.push('All rebuy amounts must be valid numbers')
    if (Math.abs(getTotalCashOut() - getTotalInvestment()) >= 0.01) {
      errors.push(`Total cash out ($${getTotalCashOut().toFixed(2)}) must equal total investment ($${getTotalInvestment().toFixed(2)})`)
    }
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid()) {
      setError(`Please ensure all fields are filled and total cash out (${getTotalCashOut()}) equals total investment (${getTotalInvestment()})`)
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // First, ensure all players exist in the database
      for (const player of players) {
        const { data: existingPlayer } = await supabase
          .from('players')
          .select('id')
          .eq('name', player.player_name.trim())
          .single()

        if (!existingPlayer) {
          const { error: playerError } = await supabase
            .from('players')
            .insert({ name: player.player_name.trim() })

          if (playerError) throw playerError
        }
      }

      // Get all player IDs
      const { data: allPlayers, error: playersError } = await supabase
        .from('players')
        .select('id, name')
        .in('name', players.map(p => p.player_name.trim()))

      if (playersError) throw playersError

      // Create game log entries (using original buy_in for backward compatibility)
      const gameLogEntries = players.map(player => {
        const playerData = allPlayers?.find(p => p.name === player.player_name.trim())
        if (!playerData) throw new Error(`Player ${player.player_name} not found`)

        return {
          player_id: playerData.id,
          game_date: gameDate,
          buy_in: buyInAmount, // Keep original buy_in amount for backward compatibility
          cash_out: player.final_amount || 0
        }
      })

      const { data: insertedGameLogs, error: gameLogError } = await supabase
        .from('game_logs')
        .insert(gameLogEntries)
        .select()

      if (gameLogError) throw gameLogError

      // Create rebuy entries if any player has rebuys
      const rebuyEntries: {
        game_log_id: string;
        player_id: string;
        game_date: string;
        rebuy_amount: number;
        rebuy_sequence: number;
      }[] = []
      for (let i = 0; i < players.length; i++) {
        const player = players[i]
        const gameLogId = insertedGameLogs[i].id
        const playerData = allPlayers?.find(p => p.name === player.player_name.trim())

        if (player.rebuys.length > 0) {
          player.rebuys.forEach((rebuyAmount, rebuyIndex) => {
            if (rebuyAmount > 0) {
              rebuyEntries.push({
                game_log_id: gameLogId,
                player_id: playerData!.id,
                game_date: gameDate,
                rebuy_amount: rebuyAmount,
                rebuy_sequence: rebuyIndex + 1
              })
            }
          })
        }
      }

      if (rebuyEntries.length > 0) {
        const { error: rebuyError } = await supabase
          .from('rebuys')
          .insert(rebuyEntries)

        if (rebuyError) throw rebuyError
      }

      const totalRebuys = rebuyEntries.length
      setSuccess(`Game recorded successfully for ${players.length} players with ${totalRebuys} rebuys!`)
      
      // Reset form
      setGameDate('')
      setPlayers([{ player_name: '', final_amount: 0, rebuys: [] }])
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <div className="poker-card p-8">
          <div className="text-center mb-6">
            <Lock className="h-12 w-12 text-poker-gold-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-poker-gold-400">Admin Access</h2>
            <p className="text-gray-400 mt-2">Enter password to access enhanced game entry form</p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-poker-gold-400 focus:border-transparent"
                placeholder="Enter admin password"
                required
              />
            </div>
            
            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
                {error}
              </div>
            )}
            
            <button type="submit" className="w-full poker-button">
              Access Admin Panel
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="poker-card p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <RefreshCw className="h-8 w-8 text-poker-gold-400 mr-3" />
            <h1 className="text-3xl font-bold text-poker-gold-400">Enhanced Game Entry</h1>
          </div>
          <p className="text-gray-300">Record game results with rebuy tracking</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Game Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="gameDate" className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar className="inline h-4 w-4 mr-2" />
                Game Date
              </label>
              <input
                type="date"
                id="gameDate"
                value={gameDate}
                onChange={(e) => setGameDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-poker-gold-400 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="buyInAmount" className="block text-sm font-medium text-gray-300 mb-2">
                <DollarSign className="inline h-4 w-4 mr-2" />
                Initial Buy-in Amount
              </label>
              <input
                type="number"
                id="buyInAmount"
                value={buyInAmount}
                onChange={(e) => setBuyInAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-poker-gold-400 focus:border-transparent"
                min="1"
                step="0.01"
                required
              />
            </div>
          </div>

          {/* Players Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Players ({players.length})
              </h3>
              <button
                type="button"
                onClick={addPlayer}
                className="poker-button-secondary flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </button>
            </div>

            <div className="space-y-4">
              {players.map((player, playerIndex) => (
                <div key={playerIndex} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Player Name
                      </label>
                      <select
                        value={player.player_name}
                        onChange={(e) => updatePlayer(playerIndex, 'player_name', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-poker-gold-400 focus:border-transparent"
                        title={`Select player ${playerIndex + 1}`}
                        required
                      >
                        <option value="">Select Player</option>
                        {availablePlayers.map((availablePlayer) => (
                          <option key={availablePlayer.id} value={availablePlayer.name}>
                            {availablePlayer.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Final Cash Out
                      </label>
                      <input
                        type="number"
                        value={player.final_amount || ''}
                        onChange={(e) => updatePlayer(playerIndex, 'final_amount', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-poker-gold-400 focus:border-transparent"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Total Investment
                      </label>
                      <div className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300">
                        ${getPlayerTotalInvestment(player).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Rebuys Section */}
                  <div className="border-t border-gray-600 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-300">
                        Rebuys ({player.rebuys.length})
                      </h4>
                      <button
                        type="button"
                        onClick={() => addRebuy(playerIndex)}
                        className="text-poker-gold-400 hover:text-poker-gold-300 text-sm flex items-center"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Rebuy
                      </button>
                    </div>

                    {player.rebuys.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {player.rebuys.map((rebuy, rebuyIndex) => (
                          <div key={rebuyIndex} className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={rebuy || ''}
                              onChange={(e) => updateRebuy(playerIndex, rebuyIndex, Number(e.target.value))}
                              className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-poker-gold-400"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                            />
                            <button
                              type="button"
                              onClick={() => removeRebuy(playerIndex, rebuyIndex)}
                              className="text-red-400 hover:text-red-300"
                              title={`Remove rebuy ${rebuyIndex + 1}`}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {players.length > 1 && (
                    <div className="flex justify-end mt-4">
                      <button
                        type="button"
                        onClick={() => removePlayer(playerIndex)}
                        className="text-red-400 hover:text-red-300 text-sm flex items-center"
                      >
                        <Minus className="h-4 w-4 mr-1" />
                        Remove Player
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-200 mb-3">Game Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Total Investment:</span>
                <div className="text-poker-gold-400 font-semibold">${getTotalInvestment().toFixed(2)}</div>
              </div>
              <div>
                <span className="text-gray-400">Total Cash Out:</span>
                <div className="text-poker-gold-400 font-semibold">${getTotalCashOut().toFixed(2)}</div>
              </div>
              <div>
                <span className="text-gray-400">Difference:</span>
                <div className={`font-semibold ${Math.abs(getTotalCashOut() - getTotalInvestment()) < 0.01 ? 'text-green-400' : 'text-red-400'}`}>
                  ${(getTotalCashOut() - getTotalInvestment()).toFixed(2)}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Status:</span>
                <div className={`font-semibold ${isFormValid() ? 'text-green-400' : 'text-red-400'}`}>
                  {isFormValid() ? 'Balanced' : 'Unbalanced'}
                </div>
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {!isFormValid() && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <h4 className="text-red-300 font-semibold">Validation Errors</h4>
              </div>
              <ul className="text-red-300 text-sm space-y-1">
                {getValidationErrors().map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-900/50 border border-green-700 rounded-lg p-4 text-green-300">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-300">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="poker-button flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving Game...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Game Results
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
