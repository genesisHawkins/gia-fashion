'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AuthGuard from '@/components/AuthGuard'
import Image from 'next/image'
import { Trash2, Calendar, Sparkles } from 'lucide-react'

type WardrobeItem = {
  id: string
  image_url: string
  category: string
  color_tags: string[]
  style_tags: string[]
  last_worn_date: string | null
  notes: string | null
  item_description: string | null
  created_at: string
}

export default function WardrobePage() {
  const [items, setItems] = useState<WardrobeItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWardrobe()
  }, [])

  const loadWardrobe = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error loading wardrobe:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item from your wardrobe?')) return

    try {
      const { error } = await supabase
        .from('wardrobe_items')
        .delete()
        .eq('id', id)

      if (error) throw error
      setItems(items.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never worn'
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <AuthGuard>
      <main className="min-h-screen px-6 py-8 pb-24 relative">
        {/* Decorative background */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#C9A961]/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="mb-10">
            <h1 className="text-5xl font-light text-[#2B2B2B] mb-2 tracking-tight">My Wardrobe</h1>
            <p className="text-[#6B6B6B] font-light">Your curated style collection</p>
            <div className="w-24 h-[1px] bg-gradient-to-r from-[#C9A961] to-transparent mt-4"></div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-12 h-12 border-4 border-[#C9A961]/20 border-t-[#C9A961] rounded-full animate-spin"></div>
              <p className="text-[#6B6B6B] mt-4 font-light">Loading your collection...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 glass p-12 rounded-3xl">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C9A961]/20 to-[#E8DCC4]/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="text-[#C9A961]" size={32} />
              </div>
              <p className="text-[#2B2B2B] text-xl mb-2 font-light">Your wardrobe awaits</p>
              <p className="text-[#6B6B6B] font-light">
                Analyze an outfit and save it to start building your collection
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
              {items.map((item, idx) => (
                <div key={item.id} className="glass rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] group">
                  <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-50">
                    <Image
                      src={item.image_url}
                      alt={`Wardrobe item ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-[#2B2B2B] to-[#1A1A1A] text-white text-xs px-3 py-1.5 rounded-full font-medium">
                      ITEM-{String(idx + 1).padStart(3, '0')}
                    </div>
                  </div>
                  
                  <div className="p-3 sm:p-4">
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-[#6B6B6B] mb-2 sm:mb-3">
                      <Calendar size={14} className="text-[#C9A961]" />
                      <span className="font-light">{formatDate(item.last_worn_date)}</span>
                    </div>

                    {item.color_tags && item.color_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-3">
                        {item.color_tags.slice(0, 2).map((color, i) => (
                          <span key={i} className="text-[10px] sm:text-xs bg-gradient-to-r from-[#C9A961]/10 to-[#E8DCC4]/10 text-[#2B2B2B] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium">
                            {color}
                          </span>
                        ))}
                      </div>
                    )}

                    {item.item_description && (
                      <p className="text-[10px] sm:text-xs text-[#2B2B2B] line-clamp-2 sm:line-clamp-3 mb-2 sm:mb-3 font-light leading-relaxed hidden sm:block">
                        {item.item_description}
                      </p>
                    )}

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="w-full flex items-center justify-center gap-1.5 sm:gap-2 text-red-600 hover:bg-red-50 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm transition-all font-medium"
                    >
                      <Trash2 size={16} />
                      <span className="hidden sm:inline">Remove</span>
                      <span className="sm:hidden">Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  )
}
