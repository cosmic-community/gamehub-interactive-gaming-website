'use client'

import TicTacToe from '@/components/games/TicTacToe'
import SnakeGame from '@/components/games/SnakeGame'
import MemoryMatch from '@/components/games/MemoryMatch'
import NumberPuzzle from '@/components/games/NumberPuzzle'
import WhackAMole from '@/components/games/WhackAMole'

interface GameContainerProps {
  gameId: string
}

export default function GameContainer({ gameId }: GameContainerProps) {
  const renderGame = () => {
    switch (gameId) {
      case 'tic-tac-toe':
        return <TicTacToe />
      case 'snake':
        return <SnakeGame />
      case 'memory-match':
        return <MemoryMatch />
      case 'number-puzzle':
        return <NumberPuzzle />
      case 'whack-a-mole':
        return <WhackAMole />
      default:
        return (
          <div className="game-container text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Game Not Found</h2>
            <p className="text-muted-foreground">
              The requested game could not be loaded.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {renderGame()}
    </div>
  )
}