'use client'

import { useState, useEffect } from 'react'
import type { Board, Player, GameState } from '@/types'

const INITIAL_BOARD: Board = Array(9).fill(null)

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6] // Diagonals
]

export default function TicTacToe() {
  const [board, setBoard] = useState<Board>(INITIAL_BOARD)
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X')
  const [gameState, setGameState] = useState<GameState>('playing')
  const [winner, setWinner] = useState<Player | null>(null)
  const [winningCombination, setWinningCombination] = useState<number[] | null>(null)
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 })

  // Check for winner
  const checkWinner = (currentBoard: Board): { winner: Player | null; combination: number[] | null } => {
    for (const combination of WINNING_COMBINATIONS) {
      const [a, b, c] = combination
      
      // Safely access board positions with validation
      if (a !== undefined && b !== undefined && c !== undefined &&
          currentBoard[a] && 
          currentBoard[a] === currentBoard[b] && 
          currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a] as Player, combination }
      }
    }
    
    return { winner: null, combination: null }
  }

  // Check for draw
  const checkDraw = (currentBoard: Board): boolean => {
    return currentBoard.every(cell => cell !== null)
  }

  // Handle cell click
  const handleCellClick = (cellIndex: number) => {
    if (gameState !== 'playing' || board[cellIndex] || winner) return

    const newBoard = [...board]
    newBoard[cellIndex] = currentPlayer
    setBoard(newBoard)

    const { winner: gameWinner, combination } = checkWinner(newBoard)
    
    if (gameWinner) {
      setWinner(gameWinner)
      setWinningCombination(combination)
      setGameState('gameOver')
      setScores(prev => ({ ...prev, [gameWinner]: prev[gameWinner] + 1 }))
    } else if (checkDraw(newBoard)) {
      setGameState('gameOver')
      setScores(prev => ({ ...prev, draws: prev.draws + 1 }))
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X')
    }
  }

  // Reset game
  const resetGame = () => {
    setBoard(INITIAL_BOARD)
    setCurrentPlayer('X')
    setGameState('playing')
    setWinner(null)
    setWinningCombination(null)
  }

  // Reset scores
  const resetScores = () => {
    setScores({ X: 0, O: 0, draws: 0 })
  }

  // Get cell class names
  const getCellClassName = (index: number): string => {
    let className = 'tic-tac-toe-cell game-cell'
    
    if (winningCombination?.includes(index)) {
      className += ' bg-accent text-accent-foreground neon-glow-green'
    } else if (board[index]) {
      className += ' bg-card'
    } else {
      className += ' hover:bg-muted/50'
    }
    
    return className
  }

  // Get player color
  const getPlayerColor = (player: Player): string => {
    return player === 'X' ? 'text-primary' : 'text-destructive'
  }

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">⭕ Tic-Tac-Toe</h2>
        <p className="text-muted-foreground">
          Get three in a row to win!
        </p>
      </div>

      {/* Score Display */}
      <div className="flex justify-center gap-4">
        <div className="score-display text-center">
          <div className="text-sm text-muted-foreground">Player X</div>
          <div className="text-2xl font-bold text-primary">{scores.X}</div>
        </div>
        
        <div className="score-display text-center">
          <div className="text-sm text-muted-foreground">Draws</div>
          <div className="text-2xl font-bold text-muted-foreground">{scores.draws}</div>
        </div>
        
        <div className="score-display text-center">
          <div className="text-sm text-muted-foreground">Player O</div>
          <div className="text-2xl font-bold text-destructive">{scores.O}</div>
        </div>
      </div>

      {/* Current Player Indicator */}
      {gameState === 'playing' && (
        <div className="text-center">
          <p className="text-lg">
            Current Player: 
            <span className={`font-bold ml-2 ${getPlayerColor(currentPlayer)}`}>
              {currentPlayer}
            </span>
          </p>
        </div>
      )}

      {/* Game Grid */}
      <div className="flex justify-center">
        <div className="grid grid-cols-3 gap-2 p-4 bg-card border border-border rounded-lg">
          {board.map((cell, index) => (
            <button
              key={index}
              className={getCellClassName(index)}
              onClick={() => handleCellClick(index)}
              disabled={gameState !== 'playing' || !!cell}
            >
              {cell && (
                <span className={getPlayerColor(cell)}>
                  {cell}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Game Controls */}
      <div className="flex justify-center gap-4">
        <button onClick={resetGame} className="game-button">
          🔄 New Game
        </button>
        <button onClick={resetScores} className="game-button-secondary">
          📊 Reset Scores
        </button>
      </div>

      {/* Game Over Message */}
      {gameState === 'gameOver' && (
        <div className="text-center space-y-4 p-6 bg-accent/10 border border-accent rounded-lg">
          {winner ? (
            <>
              <div className="text-4xl">🎉</div>
              <h3 className="text-2xl font-bold text-accent">
                Player <span className={getPlayerColor(winner)}>{winner}</span> Wins!
              </h3>
            </>
          ) : (
            <>
              <div className="text-4xl">🤝</div>
              <h3 className="text-2xl font-bold text-muted-foreground">It's a Draw!</h3>
            </>
          )}
          
          <div className="flex justify-center gap-4">
            <button onClick={resetGame} className="game-button">
              🎮 Play Again
            </button>
          </div>
        </div>
      )}

      {/* Game Instructions */}
      <div className="text-center text-sm text-muted-foreground max-w-md mx-auto">
        <p>
          Take turns placing X's and O's. The first player to get three marks in a row 
          (horizontally, vertically, or diagonally) wins the game!
        </p>
      </div>
    </div>
  )
}