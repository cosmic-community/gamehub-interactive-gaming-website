import { getAllScores } from '@/lib/cosmic'
import Leaderboard from '@/components/Leaderboard'
import GameFilter from '@/components/GameFilter'

export default async function LeaderboardPage() {
  const scores = await getAllScores()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold">
          🏆 Leaderboard
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          See how you rank against other players across all games
        </p>
      </div>

      {/* Game Filter */}
      <GameFilter />

      {/* Leaderboard */}
      <div className="max-w-4xl mx-auto">
        {scores.length > 0 ? (
          <Leaderboard scores={scores} showGameName={true} />
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-2xl font-bold mb-2">No Scores Yet</h2>
            <p className="text-muted-foreground mb-6">
              Be the first to play and set a high score!
            </p>
            <a href="/games" className="game-button">
              Start Playing
            </a>
          </div>
        )}
      </div>

      {/* Stats Section */}
      {scores.length > 0 && (
        <section className="bg-card border border-border rounded-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-6">
            Global Statistics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-primary">
                {scores.length}
              </div>
              <div className="text-muted-foreground">Total Games Played</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-bold text-accent">
                {Math.max(...scores.map(s => s.metadata?.score || 0))}
              </div>
              <div className="text-muted-foreground">Highest Score</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-bold text-destructive">
                {new Set(scores.map(s => s.metadata?.player_name)).size}
              </div>
              <div className="text-muted-foreground">Total Players</div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}