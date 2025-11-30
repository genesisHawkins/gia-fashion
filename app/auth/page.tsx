'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Sparkles } from 'lucide-react'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        alert('Check your email to confirm your account')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C9A961]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#E8DCC4]/20 rounded-full blur-3xl"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-block mb-6">
            <Sparkles className="w-16 h-16 mx-auto text-[#C9A961] mb-4" strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl font-light text-[#2B2B2B] mb-3 tracking-tight">
            {isSignUp ? 'Join Us' : 'Welcome Back'}
          </h1>
          <p className="text-[#6B6B6B] font-light tracking-wide">
            {isSignUp ? 'Begin your style journey' : 'Continue your style journey'}
          </p>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#C9A961] to-transparent mx-auto mt-4"></div>
        </div>

        <form onSubmit={handleAuth} className="glass p-8 rounded-3xl shadow-2xl space-y-6 border border-white/20">
          <div>
            <label className="block text-sm font-medium text-[#2B2B2B] mb-3 tracking-wide">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B]" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/50 border border-white/20 rounded-2xl focus:ring-2 focus:ring-[#C9A961] focus:border-transparent transition-all text-[#2B2B2B]"
                placeholder="you@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2B2B2B] mb-3 tracking-wide">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B]" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/50 border border-white/20 rounded-2xl focus:ring-2 focus:ring-[#C9A961] focus:border-transparent transition-all text-[#2B2B2B]"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50/80 backdrop-blur-sm text-red-700 p-4 rounded-2xl text-sm border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#2B2B2B] to-[#1A1A1A] text-white py-4 rounded-2xl font-medium hover:shadow-2xl transition-all duration-300 disabled:opacity-50 transform hover:scale-[1.02]"
          >
            <span className="tracking-wide">{loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full text-center mt-6 text-[#6B6B6B] hover:text-[#2B2B2B] transition-colors font-light"
        >
          {isSignUp ? 'Already have an account? Sign in' : 'Don\'t have an account? Sign up'}
        </button>
      </div>
    </main>
  )
}
