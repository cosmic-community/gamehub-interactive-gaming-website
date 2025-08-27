'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Grid2048, GameState } from '@/types'

export default function Game2048({ onGameEnd }: { onGameEnd: (score: number) => void }) {
  const [grid, setGrid] = useState<Grid2048>([])
  const [score, setScore] = useState(0)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [gameOver, setGameOver] = useState(false)

  // Initialize empty grid
  const createEmptyGrid = (): Grid2048 => {
    return Array(4).fill(null).map(() => Array(4).fill(null))
  }

  // Add random tile
  const addRandomTile = useCallback((currentGrid: Grid2048): Grid2048 => {
    const emptyCells: { row: number; col: number }[] = []
    
    currentGrid.forEach((row, rowIndex) => {
      if (row) { // Fix: Check if row exists
        row.forEach((cell, colIndex) => {
          if (cell === null) {
            emptyCells.push({ row: rowIndex, col: colIndex })
          }
        })
      }
    })

    if (emptyCells.length === 0) return currentGrid

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)]
    if (!randomCell) return currentGrid // Fix: Check if randomCell exists

    const newGrid = currentGrid.map(row => row ? [...row] : Array(4).fill(null)) // Fix: Handle undefined rows
    const gridRow = newGrid[randomCell.row]
    if (gridRow) { // Fix: Check if row exists before accessing
      gridRow[randomCell.col] = Math.random() < 0.9 ? 2 : 4
    }
    
    return newGrid
  }, [])

  // Initialize game
  const initializeGame = useCallback(() => {
    let newGrid = createEmptyGrid()
    newGrid = addRandomTile(newGrid)
    newGrid = addRandomTile(newGrid)
    setGrid(newGrid)
    setScore(0)
    setGameOver(false)
    setGameState('playing')
  }, [addRandomTile])

  // Move tiles in a direction
  const moveTiles = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameState !== 'playing') return

    const rotateGrid = (grid: Grid2048): Grid2048 => {
      const newGrid: Grid2048 = Array(4).fill(null).map(() => Array(4).fill(null))
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const sourceRow = grid[j]
          if (sourceRow) { // Fix: Check if row exists
            newGrid[i]![3 - j] = sourceRow[i] ?? null // Fix: Handle undefined values
          }
        }
      }
      return newGrid
    }

    const moveLeft = (grid: Grid2048): { grid: Grid2048; scoreIncrease: number } => {
      let scoreIncrease = 0
      const newGrid = grid.map(row => {
        if (!row) return Array(4).fill(null) // Fix: Handle undefined rows
        
        // Filter out nulls and move left
        const filteredRow = row.filter(cell => cell !== null) as number[]
        
        // Merge tiles
        const mergedRow: (number | null)[] = []
        let i = 0
        while (i < filteredRow.length) {
          if (i < filteredRow.length - 1 && filteredRow[i] === filteredRow[i + 1]) {
            const mergedValue = (filteredRow[i] ?? 0) * 2 // Fix: Handle potential undefined
            mergedRow.push(mergedValue)
            scoreIncrease += mergedValue
            i += 2
          } else {
            mergedRow.push(filteredRow[i] ?? 0) // Fix: Handle potential undefined
            i++
          }
        }
        
        // Pad with nulls
        while (mergedRow.length < 4) {
          mergedRow.push(null)
        }
        
        return mergedRow
      })
      
      return { grid: newGrid, scoreIncrease }
    }

    let workingGrid = [...grid]
    
    // Rotate grid based on direction
    switch (direction) {
      case 'up':
        workingGrid = rotateGrid(rotateGrid(rotateGrid(workingGrid)))
        break
      case 'right':
        workingGrid = rotateGrid(rotateGrid(workingGrid))
        break
      case 'down':
        workingGrid = rotateGrid(workingGrid)
        break
      // left is default, no rotation needed
    }

    const result = moveLeft(workingGrid)
    let { grid: newGrid, scoreIncrease } = result
    
    // Rotate back
    switch (direction) {
      case 'up':
        newGrid = rotateGrid(newGrid)
        break
      case 'right':
        newGrid = rotateGrid(rotateGrid(newGrid))
        break
      case 'down':
        newGrid = rotateGrid(rotateGrid(rotateGrid(newGrid)))
        break
      // left is default, no rotation needed
    }

    // Check if grid changed
    const gridChanged = JSON.stringify(grid) !== JSON.stringify(newGrid)
    
    if (gridChanged) {
      newGrid = addRandomTile(newGrid)
      setGrid(newGrid)
      setScore(prev => prev + scoreIncrease)
      
      // Check for game over
      if (isGameOver(newGrid)) {
        setGameOver(true)
        setGameState('gameOver')
        onGameEnd(score + scoreIncrease)
      }
    }
  }, [grid, gameState, addRandomTile, score, onGameEnd])

  // Check if game is over
  const isGameOver = (currentGrid: Grid2048): boolean => {
    // Check for empty cells
    for (let row = 0; row < 4; row++) {
      const gridRow = currentGrid[row]
      if (!gridRow) continue // Fix: Skip undefined rows
      
      for (let col = 0; col < 4; col++) {
        if (gridRow[col] === null) return false
      }
    }

    // Check for possible merges
    for (let row = 0; row < 4; row++) {
      const gridRow = currentGrid[row]
      if (!gridRow) continue // Fix: Skip undefined rows
      
      for (let col = 0; col < 4; col++) {
        const current = gridRow[col]
        
        // Check right
        if (col < 3) {
          const rightRow = currentGrid[row]
          if (rightRow && current === rightRow[col + 1]) return false
        }
        
        // Check down
        if (row < 3) {
          const downRow = currentGrid[row + 1]
          if (downRow && current === downRow[col]) return false
        }
      }
    }

    return true
  }

  // Check for win (2048 tile)
  const hasWon = useCallback((currentGrid: Grid2048): boolean => {
    for (let row = 0; row < 4; row++) {
      const gridRow = currentGrid[row]
      if (!gridRow) continue // Fix: Skip undefined rows
      
      for (let col = 0; col < 4; col++) {
        if (gridRow[col] === 2048) return true
      }
    }
    return false
  }, [])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          moveTiles('up')
          break
        case 'ArrowDown':
          e.preventDefault()
          moveTiles('down')
          break
        case 'ArrowLeft':
          e.preventDefault()
          moveTiles('left')
          break
        case 'ArrowRight':
          e.preventDefault()
          moveTiles('right')
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState, moveTiles])

  // Touch controls for mobile
  useEffect(() => {
    let startX = 0
    let startY = 0

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch) {
        startX = touch.clientX
        startY = touch.clientY
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (gameState !== 'playing') return
      
      const touch = e.changedTouches[0]
      if (!touch) return

      const deltaX = touch.clientX - startX
      const deltaY = touch.clientY - startY
      const minSwipeDistance = 30

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
          moveTiles(deltaX > 0 ? 'right' : 'left')
        }
      } else {
        if (Math.abs(deltaY) > minSwipeDistance) {
          moveTiles(deltaY > 0 ? 'down' : 'up')
        }
      }
    }

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [gameState, moveTiles])

  const getTileColor = (value: number | null): string => {
    if (!value) return 'bg-muted'
    
    const colors: Record<number, string> = {
      2: 'bg-gray-200 text-gray-800',
      4: 'bg-gray-300 text-gray-800',
      8: 'bg-orange-300 text-white',
      16: 'bg-orange-400 text-white',
      32: 'bg-orange-500 text-white',
      64: 'bg-red-400 text-white',
      128: 'bg-red-500 text-white text-sm',
      256: 'bg-red-600 text-white text-sm',
      512: 'bg-red-700 text-white text-sm',
      1024: 'bg-yellow-400 text-white text-xs',
      2048: 'bg-yellow-500 text-white text-xs neon-glow',
    }
    
    return colors[value] || 'bg-purple-500 text-white text-xs'
  }

  const startGame = () => {
    initializeGame()
  }

  return (
    <div className="game-2048 space-y-6">
      {/* Game Stats */}
      <div className="flex justify-between items-center">
        <div className="score-display">
          Score: {score.toLocaleString()}
        </div>
        {hasWon(grid) && !gameOver && (
          <div className="text-yellow-500 font-bold text-lg">
            🎉 YOU WON! 🎉
          </div>
        )}
      </div>

      {/* Game Grid */}
      <div className="flex justify-center">
        <div className="grid-2048 w-80 h-80">
          <div className="grid grid-cols-4 gap-2 h-full">
            {grid.map((row, rowIndex) => 
              row?.map((cell, colIndex) => ( // Fix: Handle undefined rows
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`tile-2048 w-full h-full ${getTileColor(cell)} font-bold text-lg`}
                >
                  {cell || ''}
                </div>
              )) || Array(4).fill(null).map((_, colIndex) => ( // Fix: Fallback for undefined rows
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`tile-2048 w-full h-full ${getTileColor(null)} font-bold text-lg`}
                >
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Game Controls */}
      <div className="flex justify-center gap-4">
        {gameState === 'idle' && (
          <button onClick={startGame} className="game-button">
            🎮 Start Game
          </button>
        )}
        
        {(gameState === 'playing' || gameState === 'gameOver') && (
          <button onClick={startGame} className="game-button-secondary">
            🔄 New Game
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>Use arrow keys or swipe to move tiles</p>
        <p>Combine tiles with the same number to reach 2048!</p>
      </div>

      {/* Game Over Modal */}
      {gameOver && (
        <div className="text-center p-4 bg-card border border-border rounded-lg">
          <h3 className="text-xl font-bold mb-2">Game Over!</h3>
          <p className="text-muted-foreground mb-4">Final Score: {score.toLocaleString()}</p>
          <button onClick={startGame} className="game-button">
            🔄 Play Again
          </button>
        </div>
      )}
    </div>
  )
}