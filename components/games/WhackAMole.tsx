'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Mole, GameState } from '@/types'

const GRID_SIZE = 9
const GAME_DURATION = 30000 // 30 seconds
const MOLE_SHOW_TIME = 1500 // 1.5 seconds
const MOLE_HIT_TIME = 500 // 0.5 seconds

export default function WhackAMole() {
  const [moles, setMoles] = useState<Mole[]>([])
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION / 1000)
  const [highScore, setHighScore] = useState(0)

  // Initialize moles
  useEffect(() => {
    const initialMoles: Mole[] = Array.from({ length: GRID_SIZE }, (_, index) => ({
      id: index,
      isActive: false,
      wasHit: false
    }))
    setMoles(initialMoles)
  }, [])

  // Load high score
  useEffect(() => {
    const savedHighScore = localStorage.getItem('whack-a-mole-high-score')
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore))
    }
  }, [])

  // Game timer
  useEffect(() => {
    if (gameState !== 'playing') return

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = prevTime - 1
        if (newTime <= 0) {
          setGameState('gameOver')
          return 0
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState])

  // Mole spawning logic
  useEffect(() => {
    if (gameState !== 'playing') return

    const spawnMole = () => {
      setMoles(prevMoles => {
        const inactiveMoles = prevMoles.filter(mole => !mole.isActive)
        if (inactiveMoles.length === 0) return prevMoles
        
        const randomMoleIndex = Math.floor(Math.random() * inactiveMoles.length)
        const randomMole = inactiveMoles[randomMoleIndex]
        
        if (!randomMole) return prevMoles

        const newMoles = prevMoles.map(mole => 
          mole.id === randomMole.id 
            ? { ...mole, isActive: true, wasHit: false }
            : mole
        )

        // Schedule mole to hide
        setTimeout(() => {
          setMoles(currentMoles => 
            currentMoles.map(mole => 
              mole.id === randomMole.id && !mole.wasHit
                ? { ...mole, isActive: false }
                : mole
            )
          )
        }, MOLE_SHOW_TIME)

        return newMoles
      })
    }

    const spawnInterval = setInterval(spawnMole, 800)
    return () => clearInterval(spawnInterval)
  }, [gameState])

  // Handle mole hit
  const handleMoleHit = useCallback((moleId: number) => {
    if (gameState !== 'playing') return

    setMoles(prevMoles => {
      const targetMole = prevMoles.find(mole => mole.id === moleId)
      if (!targetMole || !targetMole.isActive || targetMole.wasHit) {
        return prevMoles
      }

      const newMoles = prevMoles.map(mole => 
        mole.id === moleId 
          ? { ...mole, wasHit: true }
          : mole
      )

      // Hide the hit mole after a short delay
      setTimeout(() => {
        setMoles(currentMoles => 
          currentMoles.map(mole => 
            mole.id === moleId 
              ? { ...mole, isActive: false, wasHit: false }
              : mole
          )
        )
      }, MOLE_HIT_TIME)

      return newMoles
    })

    setScore(prevScore => prevScore + 10)
  }, [gameState])

  // Start game
  const startGame = () => {
    setScore(0)
    setTimeLeft(GAME_DURATION / 1000)
    setGameState('playing')
    setMoles(prevMoles => 
      prevMoles.map(mole => ({ ...mole, isActive: false, wasHit: false }))
    )
  }

  // End game
  useEffect(() => {
    if (gameState === 'gameOver' && score > highScore) {
      setHighScore(score)
      localStorage.setItem('whack-a-mole-high-score', score.toString())
    }
  }, [gameState, score, highScore])

  // Reset game
  const resetGame = () => {
    setGameState('idle')
    setScore(0)
    setTimeLeft(GAME_DURATION / 1000)
    setMoles(prevMoles => 
      prevMoles.map(mole => ({ ...mole, isActive: false, wasHit: false }))
    )
  }

  const getMoleClassName = (mole: Mole): string => {
    let className = 'mole-hole transition-all duration-200'
    
    if (mole.wasHit) {
      className += ' mole-hit scale-110'
    } else if (mole.isActive) {
      className += ' mole-active scale-110'
    } else {
      className += ' hover:bg-muted/60'
    }
    
    return className
  }

  const getMoleEmoji = (mole: Mole): string => {
    if (mole.wasHit) return '💥'
    if (mole.isActive) return '🐹'
    return '🕳️'
  }

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">🔨 Whack-a-Mole</h2>
        <p className="text-muted-foreground">
          Hit the moles as they pop up! Quick reflexes required.
        </p>
      </div>

      {/* Game Stats */}
      <div className="flex justify-center gap-6">
        <div className="score-display">
          <div className="text-sm text-muted-foreground">Score</div>
          <div className="text-xl font-bold">{score}</div>
        </div>
        
        <div className="score-display">
          <div className="text-sm text-muted-foreground">High Score</div>
          <div className="text-xl font-bold text-accent">{highScore}</div>
        </div>
        
        <div className="score-display">
          <div className="text-sm text-muted-foreground">Time</div>
          <div className="text-xl font-bold">{timeLeft}s</div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="flex justify-center">
        <div className="grid grid-cols-3 gap-4 p-6 bg-card border border-border rounded-lg">
          {moles.map((mole) => (
            <button
              key={mole.id}
              className={getMoleClassName(mole)}
              onClick={() => handleMoleHit(mole.id)}
              disabled={gameState !== 'playing'}
            >
              {getMoleEmoji(mole)}
            </button>
          ))}
        </div>
      </div>

      {/* Game Controls */}
      <div className="flex justify-center gap-4">
        {gameState === 'idle' && (
          <button onClick={startGame} className="game-button">
            🎮 Start Game
          </button>
        )}
        
        {gameState === 'playing' && (
          <button onClick={resetGame} className="game-button-secondary">
            🔄 Reset
          </button>
        )}
      </div>

      {/* Game Over Screen */}
      {gameState === 'gameOver' && (
        <div className="text-center space-y-4 p-6 bg-accent/10 border border-accent rounded-lg">
          <div className="text-4xl">⏰</div>
          <h3 className="text-2xl font-bold text-accent">Time's Up!</h3>
          <p className="text-muted-foreground">
            Final Score: <span className="font-bold">{score}</span>
          </p>
          {score === highScore && score > 0 && (
            <p className="text-accent font-bold">🎉 New High Score!</p>
          )}
          <div className="flex justify-center gap-4">
            <button onClick={startGame} className="game-button">
              🎮 Play Again
            </button>
            <button onClick={resetGame} className="game-button-secondary">
              🏠 Back to Menu
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground max-w-md mx-auto">
        <p>
          Click on the moles as they pop up from their holes. You have 30 seconds to get as many as possible!
        </p>
      </div>
    </div>
  )
}