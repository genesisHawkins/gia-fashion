'use client'

import { Home, Camera, Archive, User, Clock } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()
  
  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/analyze', icon: Camera, label: 'Analyze' },
    { href: '/history', icon: Clock, label: 'History' },
    { href: '/wardrobe', icon: Archive, label: 'Wardrobe' },
    { href: '/profile', icon: User, label: 'Profile' },
  ]
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/20 z-50 backdrop-blur-xl">
      <div className="flex justify-around items-center h-20 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 relative group ${
                isActive ? 'text-[#2B2B2B]' : 'text-[#6B6B6B]'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-[#C9A961] to-[#E8DCC4] rounded-full"></div>
              )}
              <div className={`p-2 rounded-xl transition-all duration-300 ${
                isActive ? 'bg-[#C9A961]/10' : 'group-hover:bg-gray-100'
              }`}>
                <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
              </div>
              <span className={`text-xs mt-1 font-medium tracking-wide ${
                isActive ? 'text-[#2B2B2B]' : 'text-[#6B6B6B]'
              }`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
