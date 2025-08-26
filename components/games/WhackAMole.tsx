'use client'

import { useState, useEffect, useCallback } from 'react'
import { submitScore } from '@/lib/cosmic'
import type { Mole, GameState } from '@/types'

const BOARD_SIZE = 9
const GAME_DURATION = 30 // seconds

export default function WhackAMole() {
  const [moles, setMoles] = useState<Mole[]>([])
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [highScore, setHighScore] = useState(0)
  const [playerName, setPlayerName] = useState('')
  const [isSubmittingScore, setIsSubmittingScore] = useState(false)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('whack-a-mole-high-score')
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore))
    }
  }, [])

  // Initialize moles
  const initializeMoles = () => {
    const initialMoles: Mole[] = Array.from({ length: BOARD_SIZE }, (_, i) => ({
      id: i,
      isActive: false,
      wasHit: false
    }))
    setMoles(initialMoles)
  }

  // Get mole spawn interval based on difficulty
  const getMoleInterval = () => {
    switch (difficulty) {
      case 'easy': return 1500
      case 'medium': return 1000
      case 'hard': return 700
      default: return 1000
    }
  }

  // Get mole active duration based on difficulty
  const getMoleDuration = () => {
    switch (difficulty) {
      case 'easy': return 2000
      case 'medium': return 1500
      case 'hard': return 1000
      default: return 1500
    }
  }

  // Spawn a random mole
  const spawnMole = useCallback(() => {
    setMoles(currentMoles => {
      const inactiveMoles = currentMoles
        .map((mole, index) => ({ ...mole, index }))
        .filter(mole => !mole.isActive)
      
      if (inactiveMoles.length === 0) return currentMoles

      const randomMole = inactiveMoles[Math.floor(Math.random() * inactiveMoles.length)]
      const newMoles = [...currentMoles]
      newMoles[randomMole.index] = {
        ...newMoles[randomMole.index],
        isActive: true,
        wasHit: false
      }

      // Hide mole after duration
      setTimeout(() => {
        setMoles(prevMoles => {
          const updatedMoles = [...prevMoles]
          if (updatedMoles[randomMole.index] && !updatedMoles[randomMole.index].wasHit) {
            updatedMoles[randomMole.index] = {
              ...updatedMoles[randomMole.index],
              isActive: false
            }
          }
          return updatedMoles
        })
      }, getMoleDuration())

      return newMoles
    })
  }, [difficulty])

  const startGame = () => {
    initializeMoles()
    setGameState('playing')
    setScore(0)
    setTimeLeft(GAME_DURATION)
  }

  const resetGame = () => {
    initializeMoles()
    setGameState('idle')
    setScore(0)
    setTimeLeft(GAME_DURATION)
  }

  const whackMole = (moleId: number) => {
    if (gameState !== 'playing') return

    setMoles(currentMoles => {
      const newMoles = [...currentMoles]
      const mole = newMoles[moleId]
      
      if (mole && mole.isActive && !mole.wasHit) {
        newMoles[moleId] = {
          ...mole,
          isActive: false,
          wasHit: true
        }
        setScore(prev => prev + 10)
        
        // Show hit state briefly
        setTimeout(() => {
          setMoles(prevMoles => {
            const updatedMoles = [...prevMoles]
            if (updatedMoles[moleId]) {
              updatedMoles[moleId] = {
                ...updatedMoles[moleId],
                wasHit: false
              }
            }
            return updatedMoles
          })
        }, 300)
      }
      
      return newMoles
    })
  }

  // Game timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (gameState === 'playing' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('gameOver')
      
      // Update high score
      if (score > highScore) {
        setHighScore(score)
        localStorage.setItem('whack-a-mole-high-score', score.toString())
        
        // Submit score if player name is provided
        if (playerName.trim() && !isSubmittingScore) {
          setIsSubmittingScore(true)
          submitScore('whack-a-mole', playerName.trim(), score)
            .catch(error => console.error('Failed to submit score:', error))
            .finally(() => setIsSubmittingScore(false))
        }
      }
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [gameState, timeLeft, score, highScore, playerName, isSubmittingScore])

  // Mole spawning
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (gameState === 'playing') {
      interval = setInterval(spawnMole, getMoleInterval())
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [gameState, spawnMole])

  return (
    <div className="game-container space-y-6">
      {/* Game Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Whack-a-Mole</h2>
        
        {/* Player Name Input */}
        <div className="max-w-sm mx-auto">
          <input
            type="text"
            placeholder="Enter your name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-center"
            maxLength={20}
          />
        </div>

        {/* Difficulty Selection */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setDifficulty('easy')}
            className={`px-3 py-1 rounded text-sm ${
              difficulty === 'easy' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
            disabled={gameState === 'playing'}
          >
            Easy
          </button>
          <button
            onClick={() => setDifficulty('medium')}
            className={`px-3 py-1 rounded text-sm ${
              difficulty === 'medium' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
            disabled={gameState === 'playing'}
          >
            Medium
          </button>
          <button
            onClick={() => setDifficulty('hard')}
            className={`px-3 py-1 rounded text-sm ${
              difficulty === 'hard' ? 'bg-destructive text-destructive-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
            disabled={gameState === 'playing'}
          >
            Hard
          </button>
        </div>
      </div>

      {/* Score Display */}
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
        <div className="score-display text-center">
          <div className="text-2xl font-bold text-primary">{score}</div>
          <div className="text-xs text-muted-foreground">Score</div>
        </div>
        <div className="score-display text-center">
          <div className="text-2xl font-bold text-destructive">{timeLeft}</div>
          <div className="text-xs text-muted-foreground">Time Left</div>
        </div>
        <div className="score-display text-center">
          <div className="text-2xl font-bold text-accent">{highScore}</div>
          <div className="text-xs text-muted-foreground">High Score</div>
        </div>
      </div>

      {/* Game Board */}
      <div className="max-w-md mx-auto">
        <div className="grid grid-cols-3 gap-4 p-6">
          {moles.map((mole) => (
            <button
              key={mole.id}
              onClick={() => whackMole(mole.id)}
              className={`mole-hole transition-all duration-200 ${
                mole.wasHit
                  ? 'mole-hit scale-110'
                  : mole.isActive
                    ? 'mole-active hover:scale-110'
                    : 'hover:bg-muted/60'
              }`}
              disabled={gameState !== 'playing'}
            >
              {mole.wasHit ? '💥' : mole.isActive ? '🐹' : '🕳️'}
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground">
        <p>Hit the moles as they pop up! You have {GAME_DURATION} seconds.</p>
      </div>

      {/* Game Status */}
      <div className="text-center space-y-4">
        {gameState === 'idle' && (
          <div>
            <p className="text-muted-foreground mb-4">Ready to start whacking?</p>
            <button onClick={startGame} className="game-button">
              🔨 Start Game
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div>
            <div className="text-lg font-bold text-primary mb-4">
              🔨 Whack those moles!
            </div>
            {/* Progress bar */}
            <div className="max-w-md mx-auto bg-secondary rounded-full h-2">
              <div 
                className="bg-destructive h-2 rounded-full transition-all duration-1000"
                style={{ width: `${((GAME_DURATION - timeLeft) / GAME_DURATION) * 100}%` }}
              />
            </div>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="space-y-4">
            <div className="text-xl font-bold text-destructive">⏰ Time's Up!</div>
            <div className="text-lg">
              Final Score: <span className="font-bold text-primary">{score}</span>
            </div>
            
            {score === highScore && score > 0 && (
              <div className="text-lg font-bold text-accent">🎉 New High Score!</div>
            )}
            
            {isSubmittingScore && (
              <p className="text-muted-foreground">Saving score...</p>
            )}
            
            <div className="flex gap-2 justify-center">
              <button onClick={startGame} className="game-button">
                🔄 Play Again
              </button>
              <button onClick={resetGame} className="game-button-secondary">
                ⬅️ Main Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}