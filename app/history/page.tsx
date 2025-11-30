'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AuthGuard from '@/components/AuthGuard'
import { Calendar, TrendingUp, Sparkles, Camera, Trash2 } from 'lucide-react'
import Link from 'next/link'
/* eslint-disable @next/next/no-img-element */

type OutfitLog = {
  id: string
  outfit_image_url: string
  occasion: string
  ai_score: number
  ai_critique: string
  body_type_analysis: string
  created_at: string
}

export default function HistoryPage() {
  const [logs, setLogs] = useState<OutfitLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('outfit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleDelete = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this outfit analysis?')) {
      return
    }

    setDeletingId(logId)
    try {
      const { error } = await supabase
        .from('outfit_logs')
        .delete()
        .eq('id', logId)

      if (error) throw error

      // Remove from local state
      setLogs(logs.filter(log => log.id !== logId))
      showToast('Outfit deleted successfully', 'success')
    } catch (error) {
      console.error('Error deleting outfit:', error)
      showToast('Failed to delete outfit', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'from-green-500 to-emerald-600'
    if (score >= 6) return 'from-yellow-500 to-amber-600'
    return 'from-orange-500 to-red-600'
  }

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.occasion === filter)

  const occasions = ['all', 'casual', 'work', 'date', 'party', 'gym']
  const occasionLabels: Record<string, string> = {
    all: 'All',
    casual: 'Casual',
    work: 'Work',
    date: 'Date',
    party: 'Party',
    gym: 'Gym'
  }

  const averageScore = logs.length > 0
    ? (logs.reduce((sum, log) => sum + log.ai_score, 0) / logs.length).toFixed(1)
    : '0'

  return (
    <AuthGuard>
      <main className="min-h-screen px-6 py-8 pb-24 relative">
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl animate-slide-in glass ${
            toast.type === 'success' 
              ? 'border-l-4 border-green-500' 
              : 'border-l-4 border-red-500'
          }`}>
            <p className="text-[#2B2B2B] font-medium">{toast.message}</p>
          </div>
        )}

        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C9A961]/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="mb-10">
            <h1 className="text-5xl font-light text-[#2B2B2B] mb-2 tracking-tight">Style History</h1>
            <p className="text-[#6B6B6B] font-light">Your fashion journey</p>
            <div className="w-24 h-[1px] bg-gradient-to-r from-[#C9A961] to-transparent mt-4"></div>
          </div>

          {/* Stats */}
          {logs.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="glass p-6 rounded-3xl border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9A961] to-[#E8DCC4] flex items-center justify-center">
                    <TrendingUp size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-light text-[#2B2B2B]">{averageScore}</p>
                    <p className="text-xs text-[#6B6B6B] font-light">Avg Score</p>
                  </div>
                </div>
              </div>

              <div className="glass p-6 rounded-3xl border border-white/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2B2B2B] to-[#1A1A1A] flex items-center justify-center">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-light text-[#2B2B2B]">{logs.length}</p>
                    <p className="text-xs text-[#6B6B6B] font-light">Analyses</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="glass p-4 rounded-3xl mb-8 border border-white/20">
            <div className="flex gap-2 overflow-x-auto">
              {occasions.map((occ) => (
                <button
                  key={occ}
                  onClick={() => setFilter(occ)}
                  className={`px-4 py-2 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    filter === occ
                      ? 'bg-gradient-to-r from-[#2B2B2B] to-[#1A1A1A] text-white shadow-lg'
                      : 'bg-white/50 text-[#6B6B6B] hover:bg-white'
                  }`}
                >
                  {occasionLabels[occ]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-12 h-12 border-4 border-[#C9A961]/20 border-t-[#C9A961] rounded-full animate-spin"></div>
              <p className="text-[#6B6B6B] mt-4 font-light">Loading your history...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-20 glass p-12 rounded-3xl">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C9A961]/20 to-[#E8DCC4]/20 flex items-center justify-center mx-auto mb-6">
                <Calendar className="text-[#C9A961]" size={32} />
              </div>
              <p className="text-[#2B2B2B] text-xl mb-2 font-light">No analyses yet</p>
              <p className="text-[#6B6B6B] font-light mb-6">
                Start analyzing your outfits to build your style history
              </p>
              <Link
                href="/analyze"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2B2B2B] to-[#1A1A1A] text-white px-6 py-3 rounded-2xl font-medium hover:shadow-xl transition-all"
              >
                <Sparkles size={18} />
                Analyze Outfit
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredLogs.map((log) => {
                const isExpanded = expandedId === log.id
                return (
                  <div 
                    key={log.id} 
                    className={`glass p-6 rounded-3xl border transition-all duration-300 ${
                      isExpanded 
                        ? 'border-[#C9A961] shadow-2xl bg-white/80' 
                        : 'border-white/20 hover:shadow-2xl'
                    }`}
                  >
                    <div className="flex gap-3 sm:gap-6">
                      <div className="relative w-24 h-32 sm:w-32 sm:h-40 flex-shrink-0 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                        {log.outfit_image_url ? (
                          <img
                            src={log.outfit_image_url}
                            alt="Outfit"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback if image fails to load
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent) {
                                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg></div>'
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#6B6B6B]">
                            <Camera size={32} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-[#C9A961]/10 to-[#E8DCC4]/10 text-[#2B2B2B] text-[10px] sm:text-xs rounded-full font-medium capitalize inline-block w-fit">
                                {log.occasion}
                              </span>
                              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-[#6B6B6B]">
                                <Calendar size={10} className="sm:hidden" />
                                <Calendar size={12} className="hidden sm:block" />
                                <span className="truncate">{formatDate(log.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(log.id)
                              }}
                              disabled={deletingId === log.id}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete outfit"
                            >
                              {deletingId === log.id ? (
                                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 size={14} className="sm:hidden" />
                              )}
                              {deletingId !== log.id && <Trash2 size={16} className="hidden sm:block" />}
                            </button>
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${getScoreColor(log.ai_score)} flex items-center justify-center shadow-lg`}>
                              <span className="text-white font-bold text-base sm:text-lg">{log.ai_score}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          {/* Main critique */}
                          <div className={`mb-2 sm:mb-3 ${!isExpanded ? 'max-h-10 sm:max-h-12 overflow-hidden' : ''}`}>
                            <p className="text-xs sm:text-sm text-[#2B2B2B] font-light leading-relaxed">
                              {log.ai_critique || 'No analysis available'}
                            </p>
                          </div>

                          {/* Body analysis - only show when expanded */}
                          {isExpanded && log.body_type_analysis && (
                            <div className="mb-3 bg-gradient-to-r from-[#C9A961]/10 to-transparent p-4 rounded-lg border-l-4 border-[#C9A961] animate-fade-in">
                              <p className="text-xs text-[#6B6B6B] font-light">
                                <span className="font-bold text-[#2B2B2B] block mb-1">💡 Body Analysis:</span>
                                {log.body_type_analysis}
                              </p>
                            </div>
                          )}

                          {/* Additional info when expanded */}
                          {isExpanded && (
                            <div className="mb-3 p-3 bg-white/60 rounded-lg animate-fade-in">
                              <p className="text-xs text-[#6B6B6B]">
                                <span className="font-semibold text-[#2B2B2B]">Full Analysis:</span> This outfit received a score of <span className="font-bold text-[#C9A961]">{log.ai_score}/10</span> for {log.occasion} occasions.
                              </p>
                            </div>
                          )}
                          
                          <button 
                            type="button"
                            className={`text-xs font-medium hover:underline inline-flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-full transition-all ${
                              isExpanded 
                                ? 'bg-[#C9A961] text-white shadow-md' 
                                : 'bg-white/50 text-[#C9A961]'
                            }`}
                            onClick={() => {
                              setExpandedId(isExpanded ? null : log.id)
                            }}
                          >
                            {isExpanded ? (
                              <>
                                <span>▲</span>
                                <span>Show less</span>
                              </>
                            ) : (
                              <>
                                <span>▼</span>
                                <span>Read full analysis</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  )
}
