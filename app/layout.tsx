import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import CosmicBadge from '@/components/CosmicBadge'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GameHub - Interactive Gaming Website',
  description: 'Play multiple built-in games including Tic-Tac-Toe, Snake, Memory Match, Number Puzzle, and Whack-a-Mole. Track your high scores and compete with other players.',
  keywords: 'games, gaming, arcade, tic-tac-toe, snake, memory game, puzzle, whack-a-mole, high scores, leaderboard',
  authors: [{ name: 'GameHub' }],
  creator: 'GameHub',
  publisher: 'GameHub',
  robots: 'index, follow',
  openGraph: {
    title: 'GameHub - Interactive Gaming Website',
    description: 'Play multiple built-in games and track your high scores',
    type: 'website',
    locale: 'en_US',
    siteName: 'GameHub'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GameHub - Interactive Gaming Website',
    description: 'Play multiple built-in games and track your high scores'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const bucketSlug = process.env.COSMIC_BUCKET_SLUG as string

  return (
    <html lang="en">
      <head>
        {/* Console capture script for dashboard debugging */}
        <script src="/dashboard-console-capture.js" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background`}>
        <Header />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <CosmicBadge bucketSlug={bucketSlug} />
      </body>
    </html>
  )
}