import Link from 'next/link'
import { getAllScores } from '@/lib/cosmic'
import GameCard from '@/components/GameCard'
import Leaderboard from '@/components/Leaderboard'

const games = [
  {
    id: 'tic-tac-toe',
    name: 'Tic-Tac-Toe',
    description: 'Classic X\'s and O\'s game. Try to get three in a row!',
    icon: '⭕',
    difficulty: 'Easy',
    players: '1-2 Players'
  },
  {
    id: 'snake',
    name: 'Snake Game',
    description: 'Control the snake to eat food and grow longer. Don\'t hit the walls!',
    icon: '🐍',
    difficulty: 'Medium',
    players: '1 Player'
  },
  {
    id: 'memory-match',
    name: 'Memory Match',
    description: 'Flip cards to find matching pairs. Test your memory!',
    icon: '🧠',
    difficulty: 'Medium',
    players: '1 Player'
  },
  {
    id: 'number-puzzle',
    name: 'Number Puzzle',
    description: 'Slide tiles to arrange numbers in order. Classic sliding puzzle!',
    icon: '🔢',
    difficulty: 'Hard',
    players: '1 Player'
  },
  {
    id: 'whack-a-mole',
    name: 'Whack-a-Mole',
    description: 'Hit the moles as they pop up! Quick reflexes required.',
    icon: '🔨',
    difficulty: 'Medium',
    players: '1 Player'
  }
]

export default async function HomePage() {
  const scores = await getAllScores()
  const topScores = scores.slice(0, 10)

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-destructive bg-clip-text text-transparent">
            GameHub
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Your ultimate destination for classic arcade games. Play, compete, and climb the leaderboards!
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/games" className="game-button text-lg px-8 py-3">
            🎮 Start Playing
          </Link>
          <Link href="/leaderboard" className="game-button-secondary text-lg px-8 py-3">
            🏆 View Leaderboard
          </Link>
        </div>
      </section>

      {/* Featured Games */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Featured Games
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose from our collection of classic arcade games
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

      {/* Quick Leaderboard */}
      {topScores.length > 0 && (
        <section className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              🏆 Top Scores
            </h2>
            <p className="text-lg text-muted-foreground">
              See how you stack up against other players
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Leaderboard scores={topScores.slice(0, 5)} showGameName={true} />
            
            <div className="text-center mt-6">
              <Link href="/leaderboard" className="game-button">
                View Full Leaderboard
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="bg-card border border-border rounded-lg p-8 space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
          Why Choose GameHub?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="text-center space-y-3">
            <div className="text-4xl">🎮</div>
            <h3 className="text-xl font-semibold">Classic Games</h3>
            <p className="text-muted-foreground">
              Enjoy timeless arcade classics with modern web technology
            </p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="text-4xl">🏆</div>
            <h3 className="text-xl font-semibold">High Scores</h3>
            <p className="text-muted-foreground">
              Track your progress and compete with players worldwide
            </p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="text-4xl">📱</div>
            <h3 className="text-xl font-semibold">Mobile Friendly</h3>
            <p className="text-muted-foreground">
              Play anywhere, anytime on any device
            </p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="text-4xl">⚡</div>
            <h3 className="text-xl font-semibold">Fast & Smooth</h3>
            <p className="text-muted-foreground">
              Optimized gameplay with smooth animations
            </p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="text-4xl">🎯</div>
            <h3 className="text-xl font-semibold">Progressive Difficulty</h3>
            <p className="text-muted-foreground">
              Games that adapt to your skill level
            </p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="text-4xl">💾</div>
            <h3 className="text-xl font-semibold">Save Progress</h3>
            <p className="text-muted-foreground">
              Your scores are saved automatically
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}