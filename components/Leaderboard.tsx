'use client'

import type { GameScore } from '@/types'

interface LeaderboardProps {
  scores: GameScore[]
  showGameName?: boolean
}

export default function Leaderboard({ scores, showGameName = false }: LeaderboardProps) {
  const formatGameName = (gameId: string) => {
    const gameNames: Record<string, string> = {
      'tic-tac-toe': 'Tic-Tac-Toe',
      'snake': 'Snake',
      'memory-match': 'Memory Match', 
      'number-puzzle': 'Number Puzzle',
      'whack-a-mole': 'Whack-a-Mole'
    }
    return gameNames[gameId] || gameId
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇'
      case 1: return '🥈'  
      case 2: return '🥉'
      default: return `#${index + 1}`
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (scores.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🏆</div>
        <h3 className="text-xl font-bold mb-2">No Scores Yet</h3>
        <p className="text-muted-foreground">Be the first to set a high score!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {scores.map((score, index) => (
          <div
            key={score.id}
            className={`leaderboard-item transition-all duration-200 hover:scale-105 ${
              index < 3 ? 'neon-glow' : ''
            }`}
          >
            <div className="flex items-center gap-4 flex-1">
              {/* Rank */}
              <div className="text-2xl font-bold min-w-16 text-center">
                {getRankIcon(index)}
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-lg truncate">
                  {score.metadata?.player_name || 'Anonymous'}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {showGameName && score.metadata?.game_id && (
                    <span className="bg-secondary px-2 py-1 rounded text-xs">
                      {formatGameName(score.metadata.game_id)}
                    </span>
                  )}
                  
                  {score.metadata?.played_at && (
                    <span>
                      {formatDate(score.metadata.played_at)}
                    </span>
                  )}
                </div>
              </div>

              {/* Score */}
              <div className="score-display text-right min-w-20">
                <div className="text-2xl font-bold text-primary">
                  {score.metadata?.score?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-muted-foreground">points</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button (if needed) */}
      {scores.length >= 50 && (
        <div className="text-center pt-4">
          <button className="game-button-secondary">
            Load More Scores
          </button>
        </div>
      )}
    </div>
  )
}