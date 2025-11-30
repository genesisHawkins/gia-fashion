'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { LogOut, User, Sparkles, ChevronRight } from 'lucide-react'
import AuthGuard from '@/components/AuthGuard'
import Link from 'next/link'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [hasDiagnosis, setHasDiagnosis] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Check if user has a diagnosis
      if (user) {
        const { data } = await supabase
          .from('style_diagnosis')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        setHasDiagnosis(!!data)
      }
    }
    getUser()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <AuthGuard>
      <main className="min-h-screen px-4 sm:px-6 py-6 sm:py-8 pb-24 relative">
        {/* Decorative background */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#C9A961]/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-md mx-auto relative z-10">
          <div className="text-center mb-8 sm:mb-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[#C9A961] to-[#E8DCC4] rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center shadow-xl">
              <User size={40} className="text-white sm:hidden" strokeWidth={1.5} />
              <User size={48} className="text-white hidden sm:block" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-light text-[#2B2B2B] mb-2 tracking-tight">My Profile</h1>
            <p className="text-sm sm:text-base text-[#6B6B6B] font-light truncate px-4">{user?.email}</p>
            <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#C9A961] to-transparent mx-auto mt-3 sm:mt-4"></div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* Style Diagnosis Card */}
            {hasDiagnosis ? (
              <div className="glass p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-[#C9A961]/30">
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg flex-shrink-0">
                    <Sparkles size={20} className="text-white sm:hidden" />
                    <Sparkles size={24} className="text-white hidden sm:block" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#2B2B2B] mb-0.5 sm:mb-1 text-sm sm:text-base">My Style Diagnosis</h3>
                    <p className="text-xs sm:text-sm text-[#6B6B6B]">Your style profile is ready</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link
                    href="/diagnosis/results"
                    className="flex-1 bg-gradient-to-r from-[#C9A961] to-[#E8DCC4] text-white py-2.5 sm:py-3 rounded-xl font-medium hover:shadow-lg transition-all text-center text-sm sm:text-base"
                  >
                    View My Profile
                  </Link>
                  <Link
                    href="/diagnosis"
                    className="flex-1 glass border border-[#C9A961]/30 text-[#2B2B2B] py-2.5 sm:py-3 rounded-xl font-medium hover:shadow-lg transition-all text-center text-sm sm:text-base"
                  >
                    Re-analyze
                  </Link>
                </div>
              </div>
            ) : (
              <Link
                href="/diagnosis"
                className="block glass p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-[#C9A961]/30 hover:border-[#C9A961] transition-all hover:shadow-2xl group"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                    <Sparkles size={20} className="text-white sm:hidden" />
                    <Sparkles size={24} className="text-white hidden sm:block" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#2B2B2B] mb-0.5 sm:mb-1 text-sm sm:text-base">My Style Diagnosis</h3>
                    <p className="text-xs sm:text-sm text-[#6B6B6B]">Discover your body type, face shape & colors</p>
                  </div>
                  <ChevronRight className="text-[#C9A961] group-hover:translate-x-1 transition-transform flex-shrink-0" size={20} />
                </div>
              </Link>
            )}

            <div className="glass p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/20">
              <h3 className="font-medium text-[#2B2B2B] mb-3 sm:mb-4 text-base sm:text-lg">Account Information</h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs sm:text-sm text-[#6B6B6B] font-light">Email</span>
                  <span className="text-xs sm:text-sm text-[#2B2B2B] font-medium truncate max-w-[60%]">{user?.email}</span>
                </div>
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#C9A961]/20 to-transparent"></div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-xs sm:text-sm text-[#6B6B6B] font-light">User ID</span>
                  <span className="text-xs sm:text-sm text-[#2B2B2B] font-mono">{user?.id?.slice(0, 8)}...</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-medium hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] text-sm sm:text-base"
            >
              <LogOut size={18} className="sm:hidden" />
              <LogOut size={20} className="hidden sm:block" />
              <span className="tracking-wide">Sign Out</span>
            </button>
          </div>
        </div>
      </main>
    </AuthGuard>
  )
}
