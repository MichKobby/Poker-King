'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus, Save, Lock, Calendar, DollarSign, Users, AlertCircle } from 'lucide-react'
import { supabase, Player } from '@/lib/supabase'

export type GameEntry = {
  player_name: string
  final_amount: number
}

export default function GameEntryForm() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [gameDate, setGameDate] = useState('')
  const [buyInAmount, setBuyInAmount] = useState(30)
  const [players, setPlayers] = useState<GameEntry[]>([
    { player_name: '', final_amount: 0 }
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
    setPlayers([...players, { player_name: '', final_amount: 0 }])
  }

  const removePlayer = (index: number) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index))
    }
  }

  const updatePlayer = (index: number, field: keyof GameEntry, value: string | number) => {
    const updatedPlayers = [...players]
    updatedPlayers[index] = { ...updatedPlayers[index], [field]: value }
    setPlayers(updatedPlayers)
  }

  const getTotalCashOut = () => {
    return players.reduce((sum, player) => sum + (player.final_amount || 0), 0)
  }

  const getTotalBuyIn = () => {
    return players.length * buyInAmount
  }

  const isFormValid = () => {
    const hasValidDate = gameDate.trim() !== ''
    const hasValidPlayers = players.every(p => p.player_name.trim() !== '' && typeof p.final_amount === 'number')
    const isBalanced = Math.abs(getTotalCashOut() - getTotalBuyIn()) < 0.01 // Total cash out should equal total buy-in
    return hasValidDate && hasValidPlayers && isBalanced
  }

  const getValidationErrors = () => {
    const errors = []
    if (gameDate.trim() === '') errors.push('Game date is required')
    if (!players.every(p => p.player_name.trim() !== '')) errors.push('All players must be selected')
    if (!players.every(p => typeof p.final_amount === 'number')) errors.push('All final amounts must be entered')
    if (Math.abs(getTotalCashOut() - getTotalBuyIn()) >= 0.01) {
      errors.push(`Total cash out ($${getTotalCashOut().toFixed(2)}) must equal total buy-in ($${getTotalBuyIn().toFixed(2)})`)
    }
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid()) {
      setError(`Please ensure all fields are filled and total cash out (${getTotalCashOut()}) equals total buy-in (${getTotalBuyIn()})`)
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

      // Create game log entries
      const gameLogEntries = players.map(player => {
        const playerData = allPlayers?.find(p => p.name === player.player_name.trim())
        if (!playerData) throw new Error(`Player ${player.player_name} not found`)

        const buyIn = buyInAmount
        const cashOut = player.final_amount || 0

        return {
          player_id: playerData.id,
          game_date: gameDate,
          buy_in: buyIn,
          cash_out: cashOut
        }
      })

      const { error: gameLogError } = await supabase
        .from('game_logs')
        .insert(gameLogEntries)

      if (gameLogError) throw gameLogError

      setSuccess(`Game recorded successfully for ${players.length} players!`)
      
      // Reset form
      setGameDate('')
      setPlayers([{ player_name: '', final_amount: 0 }])
      
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
            <p className="text-gray-400 mt-2">Enter password to access game entry form</p>
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
      <div className="poker-card">
        <div className="p-6 border-b border-poker-gold-400/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-poker-gold-400 flex items-center">
                <Calendar className="h-8 w-8 mr-3" />
                Record Poker Night
              </h2>
              <p className="text-poker-felt-400 mt-2">Enter the results for tonight's game</p>
            </div>
            <div className="poker-chips-image w-16 h-16"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Game Date and Buy-in */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="gameDate" className="block text-sm font-medium text-gray-300 mb-2">
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
                Buy-in Amount ($)
              </label>
              <input
                type="number"
                id="buyInAmount"
                step="0.01"
                min="0"
                value={buyInAmount}
                onChange={(e) => setBuyInAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-poker-gold-400 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Players Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-poker-green-400 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Players & Results
              </h3>
              <button
                type="button"
                onClick={addPlayer}
                className="poker-button-secondary flex items-center text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Player
              </button>
            </div>

            {availablePlayers.length === 0 && (
              <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-blue-400 mr-2" />
                  <div>
                    <p className="text-blue-300 font-medium">No players found</p>
                    <p className="text-blue-400 text-sm">
                      Please add players first by visiting the{' '}
                      <a href="/players" className="underline hover:text-blue-300">
                        Players page
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {players.map((player, index) => (
                <div key={index} className="flex gap-3 items-center p-3 bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <select
                      value={player.player_name}
                      onChange={(e) => updatePlayer(index, 'player_name', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      required
                    >
                      <option value="">Select a player...</option>
                      {availablePlayers
                        .filter(p => !players.some((selectedPlayer, selectedIndex) => 
                          selectedIndex !== index && selectedPlayer.player_name === p.name
                        ))
                        .map((availablePlayer) => (
                          <option key={availablePlayer.id} value={availablePlayer.name}>
                            {availablePlayer.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Final cash amount"
                        value={player.final_amount === 0 ? '0' : (player.final_amount || '')}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                          updatePlayer(index, 'final_amount', isNaN(value) ? 0 : value)
                        }}
                        className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-poker-gold-400 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  {players.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePlayer(index)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                      aria-label="Remove player"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Validation Summary */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Total Buy-in ({players.length} × ${buyInAmount}):</span>
                <span className="font-semibold text-blue-400">
                  ${getTotalBuyIn().toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Total Cash Out:</span>
                <span className={`font-semibold ${
                  Math.abs(getTotalCashOut() - getTotalBuyIn()) < 0.01 ? 'text-green-400' : 'text-red-400'
                }`}>
                  ${getTotalCashOut().toFixed(2)}
                </span>
              </div>
            </div>
            {!isFormValid() && (
              <div className="mt-2 space-y-1">
                {getValidationErrors().map((error, index) => (
                  <div key={index} className="flex items-center text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                    {error}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-poker-green-900/50 border border-poker-green-700 rounded-lg p-3 text-poker-green-300">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!isFormValid() || loading}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg font-semibold transition-colors ${
                isFormValid() && !loading
                  ? 'bg-poker-gold-600 hover:bg-poker-gold-700 text-black'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
              ) : (
                <Save className="h-5 w-5 mr-2" />
              )}
              {loading ? 'Saving...' : 'Save Game Results'}
            </button>
            
            <button
              type="button"
              onClick={() => setIsAuthenticated(false)}
              className="poker-button-secondary"
            >
              Logout
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
