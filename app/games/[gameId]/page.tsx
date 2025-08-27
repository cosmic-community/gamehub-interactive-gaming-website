// app/games/[gameId]/page.tsx
import { notFound } from 'next/navigation'
import GameContainer from '@/components/GameContainer'

const games = {
  'tic-tac-toe': {
    name: 'Tic-Tac-Toe',
    description: 'Classic X\'s and O\'s game. Try to get three in a row!',
    icon: '⭕'
  },
  'snake': {
    name: 'Snake Game', 
    description: 'Control the snake to eat food and grow longer.',
    icon: '🐍'
  },
  'memory-match': {
    name: 'Memory Match',
    description: 'Flip cards to find matching pairs.',
    icon: '🧠'
  },
  'number-puzzle': {
    name: 'Number Puzzle',
    description: 'Slide tiles to arrange numbers in order.',
    icon: '🔢'
  },
  'whack-a-mole': {
    name: 'Whack-a-Mole',
    description: 'Hit the moles as they pop up!',
    icon: '🔨'
  },
  'breakout': {
    name: 'Breakout',
    description: 'Break all the bricks with your paddle and ball.',
    icon: '🎯'
  },
  '2048': {
    name: '2048',
    description: 'Merge tiles to reach 2048!',
    icon: '🎲'
  },
  'asteroids': {
    name: 'Asteroids',
    description: 'Navigate space and destroy asteroids.',
    icon: '🚀'
  },
  'tetris': {
    name: 'Tetris',
    description: 'Arrange falling blocks to complete lines.',
    icon: '🟦'
  }
}

interface GamePageProps {
  params: Promise<{ gameId: string }>
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameId } = await params
  
  const game = games[gameId as keyof typeof games]
  
  if (!game) {
    notFound()
  }

  return (
    <div className="space-y-8">
      {/* Game Header */}
      <div className="text-center space-y-4">
        <div className="text-6xl">{game.icon}</div>
        <h1 className="text-4xl md:text-5xl font-bold">
          {game.name}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {game.description}
        </p>
      </div>

      {/* Game Container */}
      <GameContainer gameId={gameId} />
    </div>
  )
}

export async function generateStaticParams() {
  return Object.keys(games).map((gameId) => ({
    gameId: gameId
  }))
}