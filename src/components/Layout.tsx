'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, Users, Calendar, Settings, Menu, X } from 'lucide-react'

const navigation = [
  { name: 'Leaderboard', href: '/', icon: Trophy },
  { name: 'Players', href: '/players', icon: Users },
  { name: 'History', href: '/history', icon: Calendar },
  { name: 'Admin', href: '/admin', icon: Settings },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen">
      {/* Mobile menu */}
      <div className={`fixed inset-0 z-50 lg:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        <div className="fixed left-0 top-0 bottom-0 w-72 poker-card-premium border-r-0 rounded-r-3xl">
          <div className="flex items-center justify-between p-6 border-b border-poker-gold-400/20">
            <h1 className="text-xl font-bold bg-poker-gold bg-clip-text text-transparent flex items-center">
              <div className="w-8 h-8 rounded-full bg-poker-gold mr-3 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-poker-black-900" />
              </div>
              Poker Night Master
            </h1>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-poker-felt-400 hover:text-poker-gold-400 transition-colors rounded-lg hover:bg-poker-black-700/50"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="p-6">
            <ul className="space-y-3">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-poker-gold text-poker-black-900 shadow-poker-glow'
                          : 'text-poker-felt-300 hover:bg-poker-black-700/50 hover:text-poker-gold-400'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow poker-card-premium border-r border-poker-gold-400/20 rounded-r-3xl">
          <div className="flex items-center h-20 px-6 border-b border-poker-gold-400/20">
            <div className="w-10 h-10 rounded-full bg-poker-gold mr-4 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-poker-black-900" />
            </div>
            <h1 className="text-2xl font-bold bg-poker-gold bg-clip-text text-transparent">
              Poker Night Master
            </h1>
          </div>
          <nav className="flex-1 px-6 py-8">
            <ul className="space-y-4">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-4 py-4 rounded-xl text-base font-semibold transition-all duration-200 group ${
                        isActive
                          ? 'bg-poker-gold text-poker-black-900 shadow-poker-glow transform scale-105'
                          : 'text-poker-felt-300 hover:bg-poker-black-700/50 hover:text-poker-gold-400 hover:transform hover:scale-102'
                      }`}
                    >
                      <Icon className={`h-6 w-6 mr-4 transition-transform duration-200 ${
                        isActive ? 'animate-chip-stack' : 'group-hover:scale-110'
                      }`} />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 poker-card-premium border-b border-poker-gold-400/20 rounded-none">
          <button 
            onClick={() => setMobileMenuOpen(true)} 
            aria-label="Open menu"
            className="p-2 rounded-lg hover:bg-poker-black-700/50 transition-colors"
          >
            <Menu className="h-6 w-6 text-poker-gold-400" />
          </button>
          <h1 className="text-lg font-bold bg-poker-gold bg-clip-text text-transparent">Poker Night Master</h1>
          <div className="w-10" />
        </div>

        {/* Page content */}
        <main className="p-6 lg:p-12">
          <div className="animate-card-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
