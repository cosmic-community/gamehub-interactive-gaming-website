'use client'

import { useState } from 'react'
import TicTacToe from './games/TicTacToe'
import SnakeGame from './games/SnakeGame'
import MemoryMatch from './games/MemoryMatch'
import NumberPuzzle from './games/NumberPuzzle'
import WhackAMole from './games/WhackAMole'
import Breakout from './games/Breakout'
import Game2048 from './games/Game2048'
import Asteroids from './games/Asteroids'
import Tetris from './games/Tetris'
import type { GameType } from '@/types'

interface GameContainerProps {
  gameId: GameType
}

export default function GameContainer({ gameId }: GameContainerProps) {
  const [gameKey, setGameKey] = useState(0)
  
  // Handle game end - restart the game
  const handleGameEnd = (score: number) => {
    console.log(`Game ended with score: ${score}`)
    // Reset the game by changing the key
    setGameKey(prev => prev + 1)
  }

  const renderGame = () => {
    switch (gameId) {
      case 'tic-tac-toe':
        return <TicTacToe key={gameKey} onGameEnd={handleGameEnd} />
      case 'snake':
        return <SnakeGame key={gameKey} onGameEnd={handleGameEnd} />
      case 'memory-match':
        return <MemoryMatch key={gameKey} onGameEnd={handleGameEnd} />
      case 'number-puzzle':
        return <NumberPuzzle key={gameKey} onGameEnd={handleGameEnd} />
      case 'whack-a-mole':
        return <WhackAMole key={gameKey} onGameEnd={handleGameEnd} />
      case 'breakout':
        return <Breakout key={gameKey} onGameEnd={handleGameEnd} />
      case '2048':
        return <Game2048 key={gameKey} onGameEnd={handleGameEnd} />
      case 'asteroids':
        return <Asteroids key={gameKey} onGameEnd={handleGameEnd} />
      case 'tetris':
        return <Tetris key={gameKey} onGameEnd={handleGameEnd} />
      default:
        return <div className="text-center py-8">Game not found</div>
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {renderGame()}
    </div>
  )
}