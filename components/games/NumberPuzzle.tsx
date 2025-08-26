'use client'

import { useState, useEffect } from 'react'
import type { PuzzleTile } from '@/types'

const GRID_SIZE = 4
const EMPTY_VALUE = 16

export default function NumberPuzzle() {
  const [tiles, setTiles] = useState<PuzzleTile[]>([])
  const [isComplete, setIsComplete] = useState(false)
  const [moveCount, setMoveCount] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [gameTime, setGameTime] = useState(0)

  // Initialize the puzzle
  useEffect(() => {
    initializePuzzle()
  }, [])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (startTime && !isComplete) {
      interval = setInterval(() => {
        setGameTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [startTime, isComplete])

  const initializePuzzle = () => {
    const initialTiles: PuzzleTile[] = []
    
    // Create solved state first
    for (let i = 1; i <= GRID_SIZE * GRID_SIZE; i++) {
      initialTiles.push({
        value: i,
        position: i - 1
      })
    }
    
    // Shuffle the tiles (excluding the empty tile)
    const shuffledTiles = [...initialTiles]
    for (let i = 0; i < 1000; i++) {
      const validMoves = getValidMoves(shuffledTiles)
      if (validMoves.length > 0) {
        const randomMoveIndex = Math.floor(Math.random() * validMoves.length)
        const randomMove = validMoves[randomMoveIndex]
        if (randomMove !== undefined) {
          moveTile(shuffledTiles, randomMove.position)
        }
      }
    }
    
    setTiles(shuffledTiles)
    setIsComplete(false)
    setMoveCount(0)
    setStartTime(null)
    setGameTime(0)
  }

  const getValidMoves = (currentTiles: PuzzleTile[]): PuzzleTile[] => {
    const emptyTile = currentTiles.find(tile => tile.value === EMPTY_VALUE)
    if (!emptyTile) return []
    
    const emptyRow = Math.floor(emptyTile.position / GRID_SIZE)
    const emptyCol = emptyTile.position % GRID_SIZE
    const validMoves: PuzzleTile[] = []

    // Check adjacent positions
    const directions = [
      { row: -1, col: 0 }, // Up
      { row: 1, col: 0 },  // Down
      { row: 0, col: -1 }, // Left
      { row: 0, col: 1 }   // Right
    ]

    directions.forEach(dir => {
      const newRow = emptyRow + dir.row
      const newCol = emptyCol + dir.col
      
      if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
        const adjacentPosition = newRow * GRID_SIZE + newCol
        const adjacentTile = currentTiles.find(tile => tile.position === adjacentPosition)
        if (adjacentTile) {
          validMoves.push(adjacentTile)
        }
      }
    })

    return validMoves
  }

  const moveTile = (tilesArray: PuzzleTile[], tilePosition: number) => {
    const emptyTile = tilesArray.find(tile => tile.value === EMPTY_VALUE)
    const targetTile = tilesArray.find(tile => tile.position === tilePosition)
    
    if (emptyTile && targetTile) {
      // Swap positions
      const tempPosition = emptyTile.position
      emptyTile.position = targetTile.position
      targetTile.position = tempPosition
    }
  }

  const handleTileClick = (clickedPosition: number) => {
    if (isComplete) return

    // Start timer on first move
    if (!startTime) {
      setStartTime(Date.now())
    }

    const validMoves = getValidMoves(tiles)
    const isValidMove = validMoves.some(tile => tile.position === clickedPosition)
    
    if (isValidMove) {
      const newTiles = [...tiles]
      moveTile(newTiles, clickedPosition)
      setTiles(newTiles)
      setMoveCount(prev => prev + 1)
      
      // Check if puzzle is complete
      const isSolved = newTiles.every(tile => 
        tile.value === EMPTY_VALUE || tile.value === tile.position + 1
      )
      
      if (isSolved) {
        setIsComplete(true)
      }
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTileAtPosition = (position: number): PuzzleTile | undefined => {
    return tiles.find(tile => tile.position === position)
  }

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">🔢 Number Puzzle</h2>
        <p className="text-muted-foreground">
          Slide tiles to arrange numbers 1-15 in order
        </p>
      </div>

      {/* Game Stats */}
      <div className="flex justify-center gap-6">
        <div className="score-display">
          <div className="text-sm text-muted-foreground">Moves</div>
          <div className="text-xl font-bold">{moveCount}</div>
        </div>
        
        <div className="score-display">
          <div className="text-sm text-muted-foreground">Time</div>
          <div className="text-xl font-bold">{formatTime(gameTime)}</div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="flex justify-center">
        <div className="grid grid-cols-4 gap-2 p-4 bg-card border border-border rounded-lg">
          {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, position) => {
            const tile = getTileAtPosition(position)
            const isEmpty = tile?.value === EMPTY_VALUE
            
            return (
              <div
                key={position}
                className={`puzzle-tile ${isEmpty ? 'empty' : ''}`}
                onClick={() => !isEmpty && handleTileClick(position)}
              >
                {!isEmpty && tile?.value}
              </div>
            )
          })}
        </div>
      </div>

      {/* Game Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={initializePuzzle}
          className="game-button"
        >
          🔄 New Game
        </button>
      </div>

      {/* Victory Message */}
      {isComplete && (
        <div className="text-center space-y-4 p-6 bg-accent/10 border border-accent rounded-lg">
          <div className="text-4xl">🎉</div>
          <h3 className="text-2xl font-bold text-accent">Puzzle Complete!</h3>
          <p className="text-muted-foreground">
            Completed in {moveCount} moves and {formatTime(gameTime)}
          </p>
          <button
            onClick={initializePuzzle}
            className="game-button"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}