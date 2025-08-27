'use client'

import { useState, useEffect, useCallback } from 'react'
import type { GameState } from '@/types'
import { submitScore } from '@/lib/cosmic'

type Grid = (number | null)[][]

const GRID_SIZE = 4

export default function Game2048() {
  const [grid, setGrid] = useState<Grid>(() => 
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  )
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [playerName, setPlayerName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNameInput, setShowNameInput] = useState(false)

  // Add random tile to empty cell
  const addRandomTile = useCallback((currentGrid: Grid): Grid => {
    const emptyCells: { row: number; col: number }[] = []
    
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (currentGrid[row][col] === null) {
          emptyCells.push({ row, col })
        }
      }
    }
    
    if (emptyCells.length === 0) return currentGrid
    
    const newGrid = currentGrid.map(row => [...row])
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)]
    newGrid[randomCell.row][randomCell.col] = Math.random() > 0.9 ? 4 : 2
    
    return newGrid
  }, [])

  // Initialize game
  const initializeGame = useCallback(() => {
    let newGrid: Grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
    newGrid = addRandomTile(newGrid)
    newGrid = addRandomTile(newGrid)
    setGrid(newGrid)
    setScore(0)
  }, [addRandomTile])

  // Move tiles in specified direction
  const moveTiles = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameState !== 'playing') return

    setGrid(currentGrid => {
      let newGrid = currentGrid.map(row => [...row])
      let moved = false
      let scoreIncrease = 0

      const moveLineLeft = (line: (number | null)[]): (number | null)[] => {
        // Remove nulls
        const filteredLine = line.filter(cell => cell !== null) as number[]
        const newLine: (number | null)[] = []
        
        let i = 0
        while (i < filteredLine.length) {
          if (i < filteredLine.length - 1 && filteredLine[i] === filteredLine[i + 1]) {
            // Merge tiles
            const merged = filteredLine[i] * 2
            newLine.push(merged)
            scoreIncrease += merged
            i += 2
          } else {
            newLine.push(filteredLine[i])
            i += 1
          }
        }
        
        // Pad with nulls
        while (newLine.length < GRID_SIZE) {
          newLine.push(null)
        }
        
        return newLine
      }

      if (direction === 'left') {
        for (let row = 0; row < GRID_SIZE; row++) {
          const oldLine = [...newGrid[row]]
          const newLine = moveLineLeft(oldLine)
          newGrid[row] = newLine
          if (JSON.stringify(oldLine) !== JSON.stringify(newLine)) {
            moved = true
          }
        }
      } else if (direction === 'right') {
        for (let row = 0; row < GRID_SIZE; row++) {
          const oldLine = [...newGrid[row]]
          const reversedLine = [...oldLine].reverse()
          const movedLine = moveLineLeft(reversedLine)
          const newLine = movedLine.reverse()
          newGrid[row] = newLine
          if (JSON.stringify(oldLine) !== JSON.stringify(newLine)) {
            moved = true
          }
        }
      } else if (direction === 'up') {
        for (let col = 0; col < GRID_SIZE; col++) {
          const oldLine = []
          for (let row = 0; row < GRID_SIZE; row++) {
            oldLine.push(newGrid[row][col])
          }
          const newLine = moveLineLeft(oldLine)
          for (let row = 0; row < GRID_SIZE; row++) {
            newGrid[row][col] = newLine[row]
          }
          if (JSON.stringify(oldLine) !== JSON.stringify(newLine)) {
            moved = true
          }
        }
      } else if (direction === 'down') {
        for (let col = 0; col < GRID_SIZE; col++) {
          const oldLine = []
          for (let row = 0; row < GRID_SIZE; row++) {
            oldLine.push(newGrid[row][col])
          }
          const reversedLine = [...oldLine].reverse()
          const movedLine = moveLineLeft(reversedLine)
          const newLine = movedLine.reverse()
          for (let row = 0; row < GRID_SIZE; row++) {
            newGrid[row][col] = newLine[row]
          }
          if (JSON.stringify(oldLine) !== JSON.stringify(newLine)) {
            moved = true
          }
        }
      }

      if (moved) {
        setScore(prev => prev + scoreIncrease)
        const gridWithNewTile = addRandomTile(newGrid)
        
        // Check for 2048 (win condition)
        const hasWon = gridWithNewTile.some(row => 
          row.some(cell => cell === 2048)
        )
        
        if (hasWon) {
          setGameState('gameOver')
          setShowNameInput(true)
          return gridWithNewTile
        }
        
        // Check for game over (no moves possible)
        const canMove = checkCanMove(gridWithNewTile)
        if (!canMove) {
          setGameState('gameOver')
          setShowNameInput(true)
        }
        
        return gridWithNewTile
      }

      return currentGrid
    })
  }, [gameState, addRandomTile])

  // Check if any moves are possible
  const checkCanMove = (currentGrid: Grid): boolean => {
    // Check for empty cells
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (currentGrid[row][col] === null) return true
      }
    }
    
    // Check for possible merges
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const current = currentGrid[row][col]
        if (current === null) continue
        
        // Check right neighbor
        if (col < GRID_SIZE - 1 && currentGrid[row][col + 1] === current) return true
        // Check bottom neighbor  
        if (row < GRID_SIZE - 1 && currentGrid[row + 1][col] === current) return true
      }
    }
    
    return false
  }

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault()
          moveTiles('up')
          break
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault()
          moveTiles('down')
          break
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault()
          moveTiles('left')
          break
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault()
          moveTiles('right')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [moveTiles])

  const startGame = () => {
    initializeGame()
    setGameState('playing')
    setShowNameInput(false)
  }

  const resetGame = () => {
    setGameState('idle')
    setScore(0)
    setShowNameInput(false)
  }

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!playerName.trim() || score === 0) return

    setIsSubmitting(true)
    try {
      await submitScore('2048', playerName.trim(), score)
      setShowNameInput(false)
      resetGame()
    } catch (error) {
      console.error('Failed to submit score:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTileColor = (value: number | null) => {
    if (!value) return 'bg-muted border-border'
    
    const colors: Record<number, string> = {
      2: 'bg-slate-200 text-slate-800',
      4: 'bg-slate-300 text-slate-800',
      8: 'bg-orange-300 text-white',
      16: 'bg-orange-400 text-white',
      32: 'bg-red-400 text-white',
      64: 'bg-red-500 text-white',
      128: 'bg-yellow-400 text-white',
      256: 'bg-yellow-500 text-white',
      512: 'bg-yellow-600 text-white',
      1024: 'bg-green-500 text-white',
      2048: 'bg-green-600 text-white neon-glow'
    }
    
    return colors[value] || 'bg-purple-600 text-white'
  }

  return (
    <div className="space-y-6">
      {/* Game Info */}
      <div className="game-container">
        <div className="flex justify-between items-center mb-6">
          <div className="score-display">Score: {score}</div>
          <div className="score-display">Best: {bestScore}</div>
        </div>

        <div className="text-center text-sm text-muted-foreground mb-4">
          <p><strong>Controls:</strong> Arrow Keys / WASD / Swipe / Direction Buttons</p>
          <p>Merge tiles with same numbers to reach 2048!</p>
        </div>

        <div className="flex justify-center gap-3">
          {gameState === 'idle' && (
            <button onClick={startGame} className="game-button">🎮 Start Game</button>
          )}
          <button onClick={resetGame} className="game-button-secondary">🔄 Reset</button>
        </div>
      </div>

      {/* Game Grid */}
      <div className="game-container">
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-4 gap-2 bg-muted p-4 rounded-lg">
            {grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    w-16 h-16 rounded flex items-center justify-center
                    font-bold text-lg border-2 transition-all duration-200
                    ${getTileColor(cell)}
                  `}
                >
                  {cell || ''}
                </div>
              ))
            )}
          </div>

          {/* Touch Controls */}
          <div className="mt-6 grid grid-cols-3 gap-2 max-w-48 mx-auto">
            <div></div>
            <button 
              onClick={() => moveTiles('up')}
              className="game-button-secondary p-3 text-2xl"
              disabled={gameState !== 'playing'}
            >
              ⬆️
            </button>
            <div></div>
            
            <button 
              onClick={() => moveTiles('left')}
              className="game-button-secondary p-3 text-2xl"
              disabled={gameState !== 'playing'}
            >
              ⬅️
            </button>
            <div></div>
            <button 
              onClick={() => moveTiles('right')}
              className="game-button-secondary p-3 text-2xl"
              disabled={gameState !== 'playing'}
            >
              ➡️
            </button>
            
            <div></div>
            <button 
              onClick={() => moveTiles('down')}
              className="game-button-secondary p-3 text-2xl"
              disabled={gameState !== 'playing'}
            >
              ⬇️
            </button>
            <div></div>
          </div>
        </div>

        {gameState === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <div className="text-center">
              <div className="text-4xl mb-4">🎲</div>
              <h3 className="text-xl font-bold mb-2">Ready for 2048?</h3>
              <p className="text-muted-foreground">Merge tiles to reach 2048!</p>
            </div>
          </div>
        )}

        {gameState === 'gameOver' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 rounded-lg">
            <div className="text-center space-y-4">
              <div className="text-4xl">🎯</div>
              <h3 className="text-xl font-bold">
                {grid.some(row => row.some(cell => cell === 2048)) ? 'You Win!' : 'Game Over!'}
              </h3>
              <p className="text-muted-foreground">Final Score: {score}</p>
              
              {!showNameInput && score > 0 && (
                <button 
                  onClick={() => setShowNameInput(true)}
                  className="game-button"
                >
                  🏆 Save High Score
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Score Submission */}
      {showNameInput && (
        <div className="game-container">
          <form onSubmit={async (e) => {
            e.preventDefault()
            if (!playerName.trim() || score === 0) return

            setIsSubmitting(true)
            try {
              await submitScore('2048', playerName.trim(), score)
              setShowNameInput(false)
              setGameState('idle')
            } catch (error) {
              console.error('Failed to submit score:', error)
            } finally {
              setIsSubmitting(false)
            }
          }} className="space-y-4">
            <h3 className="text-xl font-bold text-center">🏆 Save Your Score!</h3>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-border rounded-md bg-background"
              maxLength={20}
              required
              autoFocus
            />
            
            <div className="flex gap-3">
              <button 
                type="submit" 
                disabled={!playerName.trim() || isSubmitting}
                className="game-button flex-1 disabled:opacity-50"
              >
                {isSubmitting ? '💾 Saving...' : '💾 Save Score'}
              </button>
              <button 
                type="button"
                onClick={() => setShowNameInput(false)}
                className="game-button-secondary"
              >
                Skip
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}