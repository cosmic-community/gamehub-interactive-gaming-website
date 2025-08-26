import { Suspense } from 'react'
import { getAllScores } from '@/lib/cosmic'
import Leaderboard from '@/components/Leaderboard'
import GameFilter from '@/components/GameFilter'

// Create a separate component for the filterable content
function LeaderboardContent() {
  return (
    <div className="space-y-6">
      <GameFilter />
    </div>
  )
}

// Loading component for Suspense
function LeaderboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <div className="h-10 bg-muted animate-pulse rounded-md w-32"></div>
        <div className="h-10 bg-muted animate-pulse rounded-md w-32"></div>
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-md"></div>
        ))}
      </div>
    </div>
  )
}

export default async function LeaderboardPage() {
  const scores = await getAllScores()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold">
          🏆 Leaderboard
        </h1>
        <p className="text-xl text-muted-foreground">
          Top scores across all games
        </p>
      </div>

      {/* Suspense wrapper for client components that use search params */}
      <Suspense fallback={<LeaderboardLoading />}>
        <LeaderboardContent />
      </Suspense>

      {/* Leaderboard */}
      <div className="max-w-4xl mx-auto">
        <Leaderboard scores={scores} showGameName={true} />
      </div>
    </div>
  )
}