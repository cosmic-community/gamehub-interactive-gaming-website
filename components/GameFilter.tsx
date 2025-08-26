'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useMemo } from 'react'

const games = [
  { id: 'all', name: 'All Games', icon: '🎮' },
  { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', icon: '⭕' },
  { id: 'snake', name: 'Snake', icon: '🐍' },
  { id: 'memory-match', name: 'Memory Match', icon: '🧠' },
  { id: 'number-puzzle', name: 'Number Puzzle', icon: '🔢' },
  { id: 'whack-a-mole', name: 'Whack-a-Mole', icon: '🔨' }
]

export default function GameFilter() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const selectedGame = searchParams.get('game') || 'all'

  const handleGameChange = (gameId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (gameId === 'all') {
      params.delete('game')
    } else {
      params.set('game', gameId)
    }
    
    const queryString = params.toString()
    const url = queryString ? `${pathname}?${queryString}` : pathname
    
    router.push(url)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-center">Filter by Game</h2>
      
      <div className="flex flex-wrap gap-2 justify-center">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => handleGameChange(game.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              selectedGame === game.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            <span>{game.icon}</span>
            <span className="hidden sm:inline">{game.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}