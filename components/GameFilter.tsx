'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const games = [
  { id: '', name: 'All Games' },
  { id: 'tic-tac-toe', name: 'Tic-Tac-Toe' },
  { id: 'snake', name: 'Snake' },
  { id: 'memory-match', name: 'Memory Match' },
  { id: 'number-puzzle', name: 'Number Puzzle' },
  { id: 'whack-a-mole', name: 'Whack-a-Mole' }
]

export default function GameFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedGame, setSelectedGame] = useState(searchParams.get('game') || '')

  const handleGameFilter = (gameId: string) => {
    setSelectedGame(gameId)
    
    const params = new URLSearchParams(searchParams)
    if (gameId) {
      params.set('game', gameId)
    } else {
      params.delete('game')
    }
    
    const query = params.toString()
    router.push(`/leaderboard${query ? `?${query}` : ''}`)
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {games.map((game) => (
        <button
          key={game.id}
          onClick={() => handleGameFilter(game.id)}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            selectedGame === game.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          {game.name}
        </button>
      ))}
    </div>
  )
}