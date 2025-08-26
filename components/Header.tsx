'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
  const pathname = usePathname()
  
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40 backdrop-blur">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 text-2xl font-bold">
            <span className="text-4xl">🎮</span>
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              GameHub
            </span>
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={`transition-colors ${
                pathname === '/' 
                  ? 'text-primary font-semibold' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Home
            </Link>
            <Link
              href="/games"
              className={`transition-colors ${
                isActive('/games')
                  ? 'text-primary font-semibold' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Games
            </Link>
            <Link
              href="/leaderboard"
              className={`transition-colors ${
                pathname === '/leaderboard'
                  ? 'text-primary font-semibold' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Leaderboard
            </Link>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center space-x-4">
            <Link
              href="/games"
              className="game-button-secondary px-3 py-2 text-sm"
            >
              Games
            </Link>
            <Link
              href="/leaderboard"
              className="game-button px-3 py-2 text-sm"
            >
              Scores
            </Link>
          </div>
        </nav>
      </div>
    </header>
  )
}