'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { TetrisPiece, TetrisGrid, GameState } from '@/types'

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20

// Tetris pieces
const PIECES = {
  I: { shape: [[1, 1, 1, 1]], color: '#00f0f0' },
  O: { shape: [[1, 1], [1, 1]], color: '#f0f000' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#a000f0' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#00f000' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#f00000' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#0000f0' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#f0a000' }
}

export default function Tetris({ onGameEnd }: { onGameEnd: (score: number) => void }) {
  const [board, setBoard] = useState<TetrisGrid>([])
  const [currentPiece, setCurrentPiece] = useState<TetrisPiece | null>(null)
  const [nextPiece, setNextPiece] = useState<TetrisPiece | null>(null)
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lines, setLines] = useState(0)
  const [dropTime, setDropTime] = useState(1000)
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)

  // Create empty board
  const createBoard = (): TetrisGrid => {
    return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(''))
  }

  // Create random piece
  const createPiece = useCallback((): TetrisPiece => {
    const pieces = Object.keys(PIECES) as (keyof typeof PIECES)[]
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)]
    const template = PIECES[randomPiece]
    
    if (!template) { // Fix: Check if template exists
      return createPiece() // Recursively try again if undefined
    }
    
    return {
      shape: template.shape,
      x: Math.floor(BOARD_WIDTH / 2) - Math.floor((template.shape[0]?.length || 1) / 2), // Fix: Handle undefined
      y: 0,
      color: template.color
    }
  }, [])

  // Check if piece can be placed at position
  const isValidPosition = useCallback((piece: TetrisPiece, board: TetrisGrid, dx = 0, dy = 0): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      const row = piece.shape[y]
      if (!row) continue // Fix: Skip undefined rows
      
      for (let x = 0; x < row.length; x++) {
        if (row[x]) {
          const newX = piece.x + x + dx
          const newY = piece.y + y + dy
          
          if (
            newX < 0 || 
            newX >= BOARD_WIDTH || 
            newY >= BOARD_HEIGHT ||
            (newY >= 0 && board[newY]?.[newX]) // Fix: Check if row exists
          ) {
            return false
          }
        }
      }
    }
    return true
  }, [])

  // Rotate piece
  const rotatePiece = useCallback((piece: TetrisPiece): TetrisPiece => {
    const rotated = piece.shape[0]?.map((_, index) => // Fix: Check if first row exists
      piece.shape.map(row => row?.[index] || 0).reverse() // Fix: Handle undefined rows
    ) || [] // Fix: Provide fallback

    return { ...piece, shape: rotated }
  }, [])

  // Place piece on board
  const placePiece = useCallback((piece: TetrisPiece, board: TetrisGrid): TetrisGrid => {
    const newBoard = board.map(row => [...row])
    
    for (let y = 0; y < piece.shape.length; y++) {
      const row = piece.shape[y]
      if (!row) continue // Fix: Skip undefined rows
      
      for (let x = 0; x < row.length; x++) {
        if (row[x]) {
          const boardY = piece.y + y
          const boardX = piece.x + x
          const boardRow = newBoard[boardY]
          if (boardRow && boardY >= 0 && boardX >= 0 && boardX < BOARD_WIDTH) { // Fix: Check if row exists
            boardRow[boardX] = piece.color
          }
        }
      }
    }
    
    return newBoard
  }, [])

  // Clear completed lines
  const clearLines = useCallback((board: TetrisGrid): { newBoard: TetrisGrid; linesCleared: number } => {
    let linesCleared = 0
    const newBoard = board.filter(row => {
      if (row && row.every(cell => cell !== '')) { // Fix: Check if row exists
        linesCleared++
        return false
      }
      return true
    })

    // Add empty rows at top
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(''))
    }

    return { newBoard, linesCleared }
  }, [])

  // Move piece
  const movePiece = useCallback((dx: number, dy: number) => {
    if (!currentPiece || gameState !== 'playing') return

    if (isValidPosition(currentPiece, board, dx, dy)) {
      setCurrentPiece(prev => prev ? { ...prev, x: prev.x + dx, y: prev.y + dy } : null) // Fix: Check if prev exists
    } else if (dy > 0) {
      // Piece hit bottom, place it
      const newBoard = placePiece(currentPiece, board)
      const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard)
      
      setBoard(clearedBoard)
      setLines(prev => prev + linesCleared)
      setScore(prev => prev + linesCleared * 100 * level)
      
      // Check if next piece can be placed (game over)
      const newPiece = nextPiece || createPiece()
      if (!isValidPosition(newPiece, clearedBoard)) {
        setGameState('gameOver')
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current)
        }
        onGameEnd(score)
        return
      }
      
      setCurrentPiece(newPiece)
      setNextPiece(createPiece())
    }
  }, [currentPiece, board, gameState, isValidPosition, placePiece, clearLines, nextPiece, createPiece, level, score, onGameEnd])

  // Rotate current piece
  const rotatePieceAction = useCallback(() => {
    if (!currentPiece || gameState !== 'playing') return

    const rotated = rotatePiece(currentPiece)
    if (isValidPosition(rotated, board)) {
      setCurrentPiece(rotated)
    }
  }, [currentPiece, gameState, rotatePiece, isValidPosition, board])

  // Drop piece to bottom
  const hardDrop = useCallback(() => {
    if (!currentPiece || gameState !== 'playing') return

    let dropDistance = 0
    while (isValidPosition(currentPiece, board, 0, dropDistance + 1)) {
      dropDistance++
    }
    
    movePiece(0, dropDistance)
  }, [currentPiece, gameState, isValidPosition, board, movePiece])

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(() => {
        movePiece(0, 1)
      }, dropTime)
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [gameState, dropTime, movePiece])

  // Update level and speed based on lines cleared
  useEffect(() => {
    const newLevel = Math.floor(lines / 10) + 1
    setLevel(newLevel)
    setDropTime(Math.max(50, 1000 - (newLevel - 1) * 100))
  }, [lines])

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          movePiece(-1, 0)
          break
        case 'ArrowRight':
          e.preventDefault()
          movePiece(1, 0)
          break
        case 'ArrowDown':
          e.preventDefault()
          movePiece(0, 1)
          break
        case 'ArrowUp':
          e.preventDefault()
          rotatePieceAction()
          break
        case ' ':
          e.preventDefault()
          hardDrop()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameState, movePiece, rotatePieceAction, hardDrop])

  // Initialize game
  const startGame = useCallback(() => {
    const newBoard = createBoard()
    const firstPiece = createPiece()
    const secondPiece = createPiece()
    
    setBoard(newBoard)
    setCurrentPiece(firstPiece)
    setNextPiece(secondPiece)
    setScore(0)
    setLevel(1)
    setLines(0)
    setDropTime(1000)
    setGameState('playing')
  }, [createPiece])

  // Render board with current piece
  const renderBoard = () => {
    let displayBoard = board.map(row => [...row])
    
    // Add current piece to display
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        const row = currentPiece.shape[y]
        if (!row) continue // Fix: Skip undefined rows
        
        for (let x = 0; x < row.length; x++) {
          if (row[x]) {
            const boardY = currentPiece.y + y
            const boardX = currentPiece.x + x
            const displayRow = displayBoard[boardY]
            if (displayRow && boardY >= 0 && boardX >= 0 && boardX < BOARD_WIDTH) { // Fix: Check if row exists
              displayRow[boardX] = currentPiece.color
            }
          }
        }
      }
    }

    return displayBoard
  }

  // Render next piece preview
  const renderNextPiece = () => {
    if (!nextPiece) return null

    return (
      <div className="tetris-piece-preview">
        <h4 className="text-sm font-semibold mb-2">Next:</h4>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${nextPiece.shape[0]?.length || 4}, 1fr)` }}> {/* Fix: Handle undefined */}
          {nextPiece.shape.map((row, y) =>
            row?.map((cell, x) => ( // Fix: Check if row exists
              <div
                key={`${y}-${x}`}
                className="w-4 h-4 border border-gray-600"
                style={{ backgroundColor: cell ? nextPiece.color : 'transparent' }}
              />
            )) || [] // Fix: Provide fallback for undefined rows
          )}
        </div>
      </div>
    )
  }

  const pauseGame = () => {
    setGameState('paused')
  }

  const resumeGame = () => {
    setGameState('playing')
  }

  return (
    <div className="tetris-game space-y-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Game Board */}
        <div className="flex-1">
          <div className="tetris-grid mx-auto" style={{ width: 'fit-content' }}>
            <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)` }}>
              {renderBoard().map((row, y) =>
                row.map((cell, x) => (
                  <div
                    key={`${y}-${x}`}
                    className="tetris-cell w-6 h-6"
                    style={{ backgroundColor: cell || '#000' }}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Game Info */}
        <div className="w-full lg:w-48 space-y-4">
          {/* Score */}
          <div className="score-display">
            <div className="text-sm text-muted-foreground">Score</div>
            <div className="text-xl font-bold">{score.toLocaleString()}</div>
          </div>

          {/* Level */}
          <div className="score-display">
            <div className="text-sm text-muted-foreground">Level</div>
            <div className="text-xl font-bold">{level}</div>
          </div>

          {/* Lines */}
          <div className="score-display">
            <div className="text-sm text-muted-foreground">Lines</div>
            <div className="text-xl font-bold">{lines}</div>
          </div>

          {/* Next Piece */}
          {renderNextPiece()}
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
          <button onClick={pauseGame} className="game-button-secondary">
            ⏸️ Pause
          </button>
        )}
        
        {gameState === 'paused' && (
          <>
            <button onClick={resumeGame} className="game-button">
              ▶️ Resume
            </button>
            <button onClick={startGame} className="game-button-secondary">
              🔄 Restart
            </button>
          </>
        )}
        
        {gameState === 'gameOver' && (
          <button onClick={startGame} className="game-button">
            🔄 Play Again
          </button>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="grid grid-cols-4 gap-2 max-w-80 mx-auto md:hidden">
        <button
          onClick={() => movePiece(-1, 0)}
          disabled={gameState !== 'playing'}
          className="game-button text-xl p-2"
        >
          ⬅️
        </button>
        <button
          onClick={rotatePieceAction}
          disabled={gameState !== 'playing'}
          className="game-button text-xl p-2"
        >
          🔄
        </button>
        <button
          onClick={() => movePiece(1, 0)}
          disabled={gameState !== 'playing'}
          className="game-button text-xl p-2"
        >
          ➡️
        </button>
        <button
          onClick={hardDrop}
          disabled={gameState !== 'playing'}
          className="game-button text-xl p-2"
        >
          ⬇️
        </button>
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>Arrow keys: Move • Up: Rotate • Space: Hard drop</p>
        <p>Clear horizontal lines to score points!</p>
      </div>
    </div>
  )
}