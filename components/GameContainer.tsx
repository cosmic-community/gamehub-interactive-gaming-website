'use client'

import { useState } from 'react'
import { submitScore } from '@/lib/cosmic'
import type { GameState, GameType } from '@/types'
import TicTacToe from './games/TicTacToe'
import SnakeGame from './games/SnakeGame'
import MemoryMatch from './games/MemoryMatch'
import NumberPuzzle from './games/NumberPuzzle'
import WhackAMole from './games/WhackAMole'
import Breakout from './games/Breakout'
import Game2048 from './games/Game2048'
import Asteroids from './games/Asteroids'
import Tetris from './games/Tetris'

interface GameContainerProps {
  gameId: GameType
  gameName: string
}

export default function GameContainer({ gameId, gameName }: GameContainerProps) {
  const [gameState, setGameState] = useState<GameState>('idle')
  const [currentScore, setCurrentScore] = useState(0)
  const [playerName, setPlayerName] = useState('')
  const [isSubmittingScore, setIsSubmittingScore] = useState(false)

  const handleGameEnd = async (score: number) => {
    setCurrentScore(score)
    setGameState('gameOver')
  }

  const handleScoreSubmit = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name to save your score')
      return
    }

    setIsSubmittingScore(true)
    try {
      await submitScore(gameId, playerName.trim(), currentScore)
      alert('Score saved successfully!')
      setPlayerName('')
      setCurrentScore(0)
      setGameState('idle')
    } catch (error) {
      console.error('Error submitting score:', error)
      alert('Failed to save score. Please try again.')
    } finally {
      setIsSubmittingScore(false)
    }
  }

  const renderGame = () => {
    const gameProps = { onGameEnd: handleGameEnd }
    
    switch (gameId) {
      case 'tic-tac-toe':
        return <TicTacToe {...gameProps} />
      case 'snake':
        return <SnakeGame {...gameProps} />
      case 'memory-match':
        return <MemoryMatch {...gameProps} />
      case 'number-puzzle':
        return <NumberPuzzle {...gameProps} />
      case 'whack-a-mole':
        return <WhackAMole {...gameProps} />
      case 'breakout':
        return <Breakout {...gameProps} />
      case '2048':
        return <Game2048 {...gameProps} />
      case 'asteroids':
        return <Asteroids {...gameProps} />
      case 'tetris':
        return <Tetris {...gameProps} />
      default:
        return <div>Game not found</div>
    }
  }

  if (gameState === 'gameOver') {
    return (
      <div className="game-container max-w-md mx-auto text-center space-y-6">
        <h2 className="text-3xl font-bold">Game Over!</h2>
        <div className="space-y-4">
          <div className="text-xl">
            Final Score: <span className="font-bold text-primary">{currentScore}</span>
          </div>
          
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-md bg-background text-foreground"
              maxLength={20}
            />
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleScoreSubmit}
                disabled={isSubmittingScore}
                className="game-button disabled:opacity-50"
              >
                {isSubmittingScore ? 'Saving...' : 'Save Score'}
              </button>
              
              <button
                onClick={() => {
                  setGameState('idle')
                  setCurrentScore(0)
                  setPlayerName('')
                }}
                className="game-button-secondary"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{gameName}</h1>
        <p className="text-muted-foreground">
          Click start to begin playing and track your high score!
        </p>
      </div>
      
      {renderGame()}
    </div>
  )
}