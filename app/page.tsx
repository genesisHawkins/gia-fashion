'use client'

import { Camera, Sparkles } from 'lucide-react'
import Link from 'next/link'
import GiaAvatar from '@/components/GiaAvatar'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth')
      } else {
        setUser(session.user)
      }
    }
    checkUser()
  }, [])
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pb-24 sm:pb-20 relative">
      <div className="text-center max-w-lg w-full relative z-10 animate-fade-in-up">
        <div className="mb-8 sm:mb-12">
          {/* Gia Avatar */}
          <div className="inline-block mb-4 sm:mb-6">
            <GiaAvatar size="lg" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold gradient-text mb-3 sm:mb-4">
            Gia
          </h1>
          <p className="text-gray-600 text-lg sm:text-xl font-medium">
            Your BFF Fashion Stylist 💅✨
          </p>
          <div className="flex items-center justify-center gap-2 mt-3 sm:mt-4">
            <span className="text-xl sm:text-2xl">👗</span>
            <span className="text-xl sm:text-2xl">💄</span>
            <span className="text-xl sm:text-2xl">👠</span>
            <span className="text-xl sm:text-2xl">💖</span>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-12">
          <div className="card-y2k p-4 sm:p-6 text-left hover:shadow-2xl hover:shadow-purple-200/50 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Camera size={20} className="text-white sm:hidden" />
                <Camera size={24} className="text-white hidden sm:block" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 mb-1 text-base sm:text-lg">Chat with Gia 💬</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Send pics, get instant style advice like texting your bestie!
                </p>
              </div>
            </div>
          </div>
          
          <div className="card-y2k p-4 sm:p-6 text-left hover:shadow-2xl hover:shadow-pink-200/50 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-2xl sm:text-3xl">👗</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 mb-1 text-base sm:text-lg">Your Digital Closet 🎀</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Save your fave fits & get personalized outfit inspo
                </p>
              </div>
            </div>
          </div>
          
          <div className="card-y2k p-4 sm:p-6 text-left hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-300 transform hover:scale-[1.02]">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-2xl sm:text-3xl">✨</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 mb-1 text-base sm:text-lg">Color & Body Magic 🌈</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Discover what colors & cuts make you look 🔥
                </p>
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/analyze"
          className="btn-primary inline-flex items-center justify-center gap-2 sm:gap-3 text-base sm:text-lg shadow-2xl shadow-purple-300/50 w-full sm:w-auto"
        >
          <Camera size={20} className="sm:hidden" />
          <Camera size={24} className="hidden sm:block" />
          <span>Chat with Gia Now!</span>
          <span className="text-xl sm:text-2xl">💅</span>
        </Link>
      </div>
    </main>
  )
}
