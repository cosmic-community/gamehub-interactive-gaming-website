'use client'

import { useState, useEffect } from 'react'
import { submitScore } from '@/lib/cosmic'
import type { PuzzleTile, GameState } from '@/types'

const BOARD_SIZE = 4
const EMPTY_TILE = 16

export default function NumberPuzzle() {
  const [tiles, setTiles] = useState<number[]>([])
  const [gameState, setGameState] = useState<GameState>('idle')
  const [moves, setMoves] = useState(0)
  const [timer, setTimer] = useState(0)
  const [bestScore, setBestScore] = useState<number | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [isSubmittingScore, setIsSubmittingScore] = useState(false)

  // Load best score from localStorage
  useEffect(() => {
    const savedBestScore = localStorage.getItem('number-puzzle-best-score')
    if (savedBestScore) {
      setBestScore(parseInt(savedBestScore))
    }
  }, [])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (gameState === 'playing') {
      interval = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [gameState])

  // Generate solved state
  const generateSolvedState = (): number[] => {
    const solved = Array.from({ length: 15 }, (_, i) => i + 1)
    solved.push(EMPTY_TILE) // Empty tile at the end
    return solved
  }

  // Shuffle tiles with solvable configuration
  const shuffleTiles = (): number[] => {
    let shuffled: number[]
    let inversions: number
    
    do {
      shuffled = generateSolvedState()
      
      // Fisher-Yates shuffle
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      
      // Count inversions to ensure puzzle is solvable
      inversions = 0
      for (let i = 0; i < shuffled.length - 1; i++) {
        for (let j = i + 1; j < shuffled.length; j++) {
          if (shuffled[i] !== EMPTY_TILE && shuffled[j] !== EMPTY_TILE && shuffled[i] > shuffled[j]) {
            inversions++
          }
        }
      }
      
      // For 4x4 grid, puzzle is solvable if:
      // - Grid width is odd and number of inversions is even
      // - Grid width is even and (number of inversions + row of empty tile) is odd
      const emptyRowFromBottom = Math.floor(shuffled.indexOf(EMPTY_TILE) / BOARD_SIZE)
      const isSolvable = (inversions + emptyRowFromBottom) % 2 === 1
      
      if (!isSolvable) continue
      
      // Make sure it's not already solved
      const isSolved = shuffled.every((tile, index) => 
        tile === (index < 15 ? index + 1 : EMPTY_TILE)
      )
      
      if (!isSolved) break
      
    } while (true)
    
    return shuffled
  }

  const startGame = () => {
    const shuffledTiles = shuffleTiles()
    setTiles(shuffledTiles)
    setGameState('playing')
    setMoves(0)
    setTimer(0)
  }

  const resetGame = () => {
    setTiles([])
    setGameState('idle')
    setMoves(0)
    setTimer(0)
  }

  const getEmptyTileIndex = () => {
    return tiles.indexOf(EMPTY_TILE)
  }

  const canMoveTile = (tileIndex: number): boolean => {
    const emptyIndex = getEmptyTileIndex()
    const tileRow = Math.floor(tileIndex / BOARD_SIZE)
    const tileCol = tileIndex % BOARD_SIZE
    const emptyRow = Math.floor(emptyIndex / BOARD_SIZE)
    const emptyCol = emptyIndex % BOARD_SIZE
    
    return (
      (Math.abs(tileRow - emptyRow) === 1 && tileCol === emptyCol) ||
      (Math.abs(tileCol - emptyCol) === 1 && tileRow === emptyRow)
    )
  }

  const moveTile = (tileIndex: number) => {
    if (gameState !== 'playing') return
    if (!canMoveTile(tileIndex)) return

    const emptyIndex = getEmptyTileIndex()
    const newTiles = [...tiles]
    
    // Swap tile with empty space
    newTiles[emptyIndex] = newTiles[tileIndex]
    newTiles[tileIndex] = EMPTY_TILE
    
    setTiles(newTiles)
    setMoves(prev => prev + 1)
  }

  // Check if puzzle is solved
  useEffect(() => {
    if (tiles.length === 0 || gameState !== 'playing') return
    
    const isSolved = tiles.every((tile, index) => 
      tile === (index < 15 ? index + 1 : EMPTY_TILE)
    )
    
    if (isSolved) {
      setGameState('gameOver')
      
      // Calculate score (lower is better: time + moves)
      const score = Math.max(1000 - timer - moves, 50)
      
      // Update best score
      if (!bestScore || score > bestScore) {
        setBestScore(score)
        localStorage.setItem('number-puzzle-best-score', score.toString())
        
        // Submit score if player name is provided
        if (playerName.trim() && !isSubmittingScore) {
          setIsSubmittingScore(true)
          submitScore('number-puzzle', playerName.trim(), score)
            .catch(error => console.error('Failed to submit score:', error))
            .finally(() => setIsSubmittingScore(false))
        }
      }
    }
  }, [tiles, gameState, timer, moves, bestScore, playerName, isSubmittingScore])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="game-container space-y-6">
      {/* Game Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Number Puzzle</h2>
        
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
      </div>

      {/* Stats Display */}
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
        <div className="score-display text-center">
          <div className="text-xl font-bold text-primary">{formatTime(timer)}</div>
          <div className="text-xs text-muted-foreground">Time</div>
        </div>
        <div className="score-display text-center">
          <div className="text-xl font-bold text-accent">{moves}</div>
          <div className="text-xs text-muted-foreground">Moves</div>
        </div>
        <div className="score-display text-center">
          <div className="text-xl font-bold text-destructive">
            {bestScore || '---'}
          </div>
          <div className="text-xs text-muted-foreground">Best</div>
        </div>
      </div>

      {/* Game Board */}
      <div className="max-w-sm mx-auto">
        <div className="grid grid-cols-4 gap-1 p-4 bg-muted/20 rounded-lg">
          {tiles.map((tile, index) => (
            <button
              key={index}
              onClick={() => moveTile(index)}
              className={`puzzle-tile aspect-square ${
                tile === EMPTY_TILE 
                  ? 'empty' 
                  : canMoveTile(index) 
                    ? 'hover:bg-primary/20 cursor-pointer' 
                    : 'cursor-default'
              }`}
              disabled={gameState !== 'playing' || tile === EMPTY_TILE}
            >
              {tile !== EMPTY_TILE ? tile : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground max-w-md mx-auto">
        <p>Click tiles adjacent to the empty space to slide them. Arrange numbers 1-15 in order!</p>
      </div>

      {/* Game Status */}
      <div className="text-center space-y-4">
        {gameState === 'idle' && (
          <div>
            <p className="text-muted-foreground mb-4">Ready to solve the puzzle?</p>
            <button onClick={startGame} className="game-button">
              🔢 Start Game
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <div>
            <p className="text-muted-foreground">
              Slide tiles to arrange them in numerical order
            </p>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="space-y-4">
            <div className="text-xl font-bold text-primary">🎉 Puzzle Solved!</div>
            <div className="space-y-2">
              <div className="text-lg">
                Time: <span className="font-bold text-accent">{formatTime(timer)}</span>
              </div>
              <div className="text-lg">
                Moves: <span className="font-bold text-primary">{moves}</span>
              </div>
              
              {bestScore && timer + moves <= (1000 - bestScore) && (
                <div className="text-lg font-bold text-destructive">🏆 New Best Score!</div>
              )}
            </div>
            
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