'use client'

import { useEffect, useState } from 'react'
import Leaderboard from "@/components/Leaderboard";

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Poker Night Master</h1>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  return <Leaderboard />;
}
