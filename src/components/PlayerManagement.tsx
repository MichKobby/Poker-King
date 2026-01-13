'use client'

import { useEffect, useState } from 'react'
import { Plus, Users, Trash2, Edit2, Save, X } from 'lucide-react'
import { supabase, Player } from '@/lib/supabase'

export default function PlayerManagement() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name')

      if (error) throw error
      setPlayers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch players')
    } finally {
      setLoading(false)
    }
  }

  const addPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlayerName.trim()) return

    try {
      setError(null)
      const { error } = await supabase
        .from('players')
        .insert({ name: newPlayerName.trim() })

      if (error) throw error

      setSuccess(`Player "${newPlayerName}" added successfully!`)
      setNewPlayerName('')
      fetchPlayers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add player')
    }
  }

  const deletePlayer = async (playerId: string, playerName: string) => {
    if (!confirm(`Are you sure you want to delete "${playerName}"? This will also delete all their game history.`)) {
      return
    }

    try {
      setError(null)
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId)

      if (error) throw error

      setSuccess(`Player "${playerName}" deleted successfully!`)
      fetchPlayers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete player')
    }
  }

  const startEdit = (player: Player) => {
    setEditingPlayer(player.id)
    setEditName(player.name)
  }

  const cancelEdit = () => {
    setEditingPlayer(null)
    setEditName('')
  }

  const saveEdit = async (playerId: string) => {
    if (!editName.trim()) return

    try {
      setError(null)
      const { error } = await supabase
        .from('players')
        .update({ name: editName.trim() })
        .eq('id', playerId)

      if (error) throw error

      setSuccess(`Player name updated successfully!`)
      setEditingPlayer(null)
      setEditName('')
      fetchPlayers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update player')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading players...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="poker-card-stack h-32 flex items-center justify-center relative mb-6">
        <div className="text-center z-10 relative">
          <div className="flex items-center justify-center">
            <Users className="h-10 w-10 text-poker-gold-400 mr-3" />
            <h1 className="text-3xl font-bold text-white">Player Management</h1>
            <Users className="h-10 w-10 text-poker-gold-400 ml-3" />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="poker-card-premium hover-lift">
        <div className="p-6 border-b border-poker-gold-400/20">
          <h2 className="text-2xl font-bold text-poker-gold-400 flex items-center">
            <Users className="h-8 w-8 mr-3" />
            Manage Your Poker Crew
          </h2>
          <p className="text-poker-felt-400 mt-2">Add and manage players for your poker nights</p>
        </div>

        {/* Add New Player */}
        <div className="p-6 border-b border-gray-800">
          <form onSubmit={addPlayer} className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Enter player name"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              className="poker-button flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Player
            </button>
          </form>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-6 mt-4 bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 bg-green-900/50 border border-green-700 rounded-lg p-3 text-green-300">
            {success}
          </div>
        )}

        {/* Players List */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-green-400 mb-4">
            Current Players ({players.length})
          </h3>

          {players.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No players added yet</p>
              <p className="text-gray-500">Add your first player above to get started</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    {editingPlayer === player.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        autoFocus
                      />
                    ) : (
                      <span className="text-white font-medium">{player.name}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {editingPlayer === player.id ? (
                      <>
                        <button
                          onClick={() => saveEdit(player.id)}
                          className="p-1 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded transition-colors"
                          title="Save changes"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-gray-400 hover:text-gray-300 hover:bg-gray-600 rounded transition-colors"
                          title="Cancel edit"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(player)}
                          className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded transition-colors"
                          title="Edit player name"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deletePlayer(player.id, player.name)}
                          className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                          title="Delete player"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
