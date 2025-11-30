'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AuthGuard from '@/components/AuthGuard'
import { Loader2, User, Palette, Sparkles, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

type StyleDiagnosis = {
  body_type: string
  body_type_description: string
  recommended_clothing: string[]
  avoid_clothing: string[]
  face_shape: string
  face_shape_description: string
  recommended_hairstyles: string[]
  recommended_accessories: string[]
  makeup_tips: string
  color_season: string
  color_season_subtype: string
  power_colors: string[]
  avoid_colors: string[]
  created_at: string
}

export default function DiagnosisResultsPage() {
  const [diagnosis, setDiagnosis] = useState<StyleDiagnosis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDiagnosis()
  }, [])

  const loadDiagnosis = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error: dbError } = await supabase
        .from('style_diagnosis')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (dbError) throw dbError
      if (!data) throw new Error('No diagnosis found')

      setDiagnosis(data)
    } catch (err) {
      console.error('Error loading diagnosis:', err)
      setError(err instanceof Error ? err.message : 'Failed to load diagnosis')
    } finally {
      setLoading(false)
    }
  }

  const bodyTypeLabels: Record<string, string> = {
    hourglass: 'Hourglass ⏳',
    pear: 'Pear 🍐',
    apple: 'Apple 🍎',
    rectangle: 'Rectangle 📏',
    inverted_triangle: 'Inverted Triangle 🔺'
  }

  const faceShapeLabels: Record<string, string> = {
    oval: 'Oval',
    round: 'Round',
    square: 'Square',
    heart: 'Heart',
    diamond: 'Diamond'
  }

  if (loading) {
    return (
      <AuthGuard>
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#C9A961] mx-auto mb-4" />
            <p className="text-[#6B6B6B]">Loading your diagnosis...</p>
          </div>
        </main>
      </AuthGuard>
    )
  }

  if (error || !diagnosis) {
    return (
      <AuthGuard>
        <main className="min-h-screen flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="text-red-500" size={32} />
            </div>
            <h2 className="text-2xl font-light text-[#2B2B2B] mb-2">No Diagnosis Found</h2>
            <p className="text-[#6B6B6B] mb-6">{error || 'Please complete the style diagnosis first'}</p>
            <Link
              href="/diagnosis"
              className="inline-block bg-gradient-to-r from-[#2B2B2B] to-[#1A1A1A] text-white px-6 py-3 rounded-2xl font-medium hover:shadow-xl transition-all"
            >
              Start Diagnosis
            </Link>
          </div>
        </main>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <main className="min-h-screen px-4 sm:px-6 py-6 sm:py-8 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#C9A961] to-[#E8DCC4] mb-3 sm:mb-4">
              <Sparkles className="text-white" size={24} />
              <Sparkles className="text-white hidden sm:block" size={28} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-light text-[#2B2B2B] mb-2">Your Style Profile</h1>
            <p className="text-sm sm:text-base text-[#6B6B6B]">Your personalized fashion blueprint</p>
            <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#C9A961] to-transparent mt-3 sm:mt-4 mx-auto"></div>
          </div>

          {/* SECTION A: MORPHOLOGY */}
          <div className="glass p-4 sm:p-8 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 border border-[#C9A961]/20">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                <User className="text-white" size={20} />
                <User className="text-white hidden sm:block" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-semibold text-[#2B2B2B]">Your Body Type</h2>
                <p className="text-xs sm:text-sm text-[#6B6B6B]">Morphology Analysis</p>
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              <div className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-[#C9A961]/20 to-[#E8DCC4]/20 rounded-full mb-3 sm:mb-4">
                <span className="text-lg sm:text-2xl font-bold text-[#2B2B2B]">
                  {bodyTypeLabels[diagnosis.body_type] || diagnosis.body_type}
                </span>
              </div>
              <p className="text-sm sm:text-base text-[#6B6B6B] leading-relaxed">{diagnosis.body_type_description}</p>
            </div>

            {/* Recommended Clothing */}
            <div className="mb-4 sm:mb-6">
              <h3 className="font-semibold text-[#2B2B2B] mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                <CheckCircle className="text-green-500 flex-shrink-0" size={18} />
                <CheckCircle className="text-green-500 hidden sm:block flex-shrink-0" size={20} />
                What to Wear
              </h3>
              <div className="grid gap-1.5 sm:gap-2">
                {diagnosis.recommended_clothing.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-green-50 rounded-lg sm:rounded-xl">
                    <span className="text-green-500 font-bold text-sm sm:text-base flex-shrink-0">✓</span>
                    <span className="text-xs sm:text-sm text-[#2B2B2B]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Avoid Clothing */}
            <div>
              <h3 className="font-semibold text-[#2B2B2B] mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                <XCircle className="text-red-500 flex-shrink-0" size={18} />
                <XCircle className="text-red-500 hidden sm:block flex-shrink-0" size={20} />
                What to Avoid
              </h3>
              <div className="grid gap-1.5 sm:gap-2">
                {diagnosis.avoid_clothing.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-red-50 rounded-lg sm:rounded-xl">
                    <span className="text-red-500 font-bold text-sm sm:text-base flex-shrink-0">✕</span>
                    <span className="text-xs sm:text-sm text-[#2B2B2B]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION B: VISAGISMO */}
          <div className="glass p-8 rounded-3xl mb-6 border border-[#C9A961]/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                <span className="text-2xl">💇‍♀️</span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[#2B2B2B]">Your Face Shape</h2>
                <p className="text-sm text-[#6B6B6B]">Visagismo Analysis</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="inline-block px-6 py-3 bg-gradient-to-r from-[#C9A961]/20 to-[#E8DCC4]/20 rounded-full mb-4">
                <span className="text-2xl font-bold text-[#2B2B2B]">
                  {faceShapeLabels[diagnosis.face_shape] || diagnosis.face_shape}
                </span>
              </div>
              <p className="text-[#6B6B6B] leading-relaxed">{diagnosis.face_shape_description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Hairstyles */}
              <div>
                <h3 className="font-semibold text-[#2B2B2B] mb-3">💇 Recommended Hairstyles</h3>
                <ul className="space-y-2">
                  {diagnosis.recommended_hairstyles.map((style, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-[#6B6B6B]">
                      <span className="text-[#C9A961]">•</span>
                      <span>{style}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Accessories */}
              <div>
                <h3 className="font-semibold text-[#2B2B2B] mb-3">✨ Recommended Accessories</h3>
                <ul className="space-y-2">
                  {diagnosis.recommended_accessories.map((accessory, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-[#6B6B6B]">
                      <span className="text-[#C9A961]">•</span>
                      <span>{accessory}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Makeup Tips */}
            <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
              <h3 className="font-semibold text-[#2B2B2B] mb-2">💄 Makeup Tips</h3>
              <p className="text-sm text-[#6B6B6B] leading-relaxed">{diagnosis.makeup_tips}</p>
            </div>
          </div>

          {/* SECTION C: COLORIMETRY */}
          <div className="glass p-8 rounded-3xl mb-6 border border-[#C9A961]/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center">
                <Palette className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-[#2B2B2B]">Your Color Season</h2>
                <p className="text-sm text-[#6B6B6B]">Colorimetry Analysis</p>
              </div>
            </div>

            <div className="mb-6">
              <div className="inline-block px-6 py-3 bg-gradient-to-r from-[#C9A961]/20 to-[#E8DCC4]/20 rounded-full mb-2">
                <span className="text-2xl font-bold text-[#2B2B2B] capitalize">
                  {diagnosis.color_season}
                </span>
              </div>
              <p className="text-sm text-[#C9A961] font-medium">{diagnosis.color_season_subtype}</p>
            </div>

            {/* Power Colors */}
            <div className="mb-6">
              <h3 className="font-semibold text-[#2B2B2B] mb-3">✨ Your Power Colors</h3>
              <p className="text-sm text-[#6B6B6B] mb-4">These colors make you glow!</p>
              <div className="flex flex-wrap gap-4">
                {diagnosis.power_colors.map((color, idx) => (
                  <div key={idx} className="text-center">
                    <div
                      className="w-16 h-16 rounded-full shadow-lg border-4 border-white"
                      style={{ backgroundColor: color }}
                    ></div>
                    <p className="text-xs text-[#6B6B6B] mt-2 font-mono">{color}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Avoid Colors */}
            <div>
              <h3 className="font-semibold text-[#2B2B2B] mb-3">⚠️ Colors to Avoid</h3>
              <p className="text-sm text-[#6B6B6B] mb-4">These colors wash you out</p>
              <div className="flex flex-wrap gap-4">
                {diagnosis.avoid_colors.map((color, idx) => (
                  <div key={idx} className="text-center opacity-60">
                    <div
                      className="w-16 h-16 rounded-full shadow-lg border-4 border-white relative"
                      style={{ backgroundColor: color }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-3xl font-bold">✕</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#6B6B6B] mt-2 font-mono">{color}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/diagnosis"
              className="flex-1 text-center py-3 sm:py-4 bg-white/80 border-2 border-[#C9A961] text-[#2B2B2B] rounded-xl sm:rounded-2xl font-medium hover:bg-white transition-all text-sm sm:text-base"
            >
              Retake Analysis
            </Link>
            <Link
              href="/wardrobe"
              className="flex-1 text-center py-3 sm:py-4 bg-gradient-to-r from-[#2B2B2B] to-[#1A1A1A] text-white rounded-xl sm:rounded-2xl font-medium hover:shadow-xl transition-all text-sm sm:text-base"
            >
              Build Wardrobe
            </Link>
          </div>
        </div>
      </main>
    </AuthGuard>
  )
}
