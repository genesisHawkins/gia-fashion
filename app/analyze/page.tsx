'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Send, Loader2, Sparkles, Heart, ShoppingBag } from 'lucide-react'
import AuthGuard from '@/components/AuthGuard'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import GiaAvatar from '@/components/GiaAvatar'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  image_url?: string
  created_at: string
  score?: number // Score for initial analysis
  shopping_query?: string // Amazon search query for recommendations
}

type AnalysisResult = {
  score: number
  chat_response?: string
  shopping_query?: string
}

const SUGGESTION_CHIPS = [
  { emoji: '💄', text: 'Rate my makeup' },
  { emoji: '💇‍♀️', text: 'How\'s my hair?' },
  { emoji: '👠', text: 'What shoes do you recommend?' },
  { emoji: '🎉', text: 'Good for a wedding?' },
]

export default function AnalyzePage() {
  const [sessionId] = useState(() => crypto.randomUUID())
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [occasion, setOccasion] = useState('casual')
  const [loading, setLoading] = useState(false)
  const [initialScore, setInitialScore] = useState<number | null>(null)
  const [showOccasionSelector, setShowOccasionSelector] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [newImage, setNewImage] = useState<string | null>(null)
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatImageInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const occasions = [
    { value: 'casual', label: 'Casual', emoji: '👕' },
    { value: 'work', label: 'Work', emoji: '💼' },
    { value: 'date', label: 'Date', emoji: '💕' },
    { value: 'party', label: 'Party', emoji: '🎉' },
    { value: 'gym', label: 'Gym', emoji: '💪' },
  ]

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 100)
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleNewAnalysis = () => {
    setImage(null)
    setImageFile(null)
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Hey! 👋 I\'m Gia, your fashion editor. Upload a photo of your outfit and I\'ll give you my honest opinion. No filters, no lies.',
      created_at: new Date().toISOString(),
    }])
    setInitialScore(null)
    setShowOccasionSelector(true)
    setOccasion('casual')
  }

  const handleSaveToWardrobe = async () => {
    if (!imageFile || !image) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        showToast('Please sign in to save to wardrobe', 'error')
        return
      }

      // Generate detailed description of the item
      const descriptionResponse = await fetch('/api/describe-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: image }),
      })

      let itemDescription = ''
      if (descriptionResponse.ok) {
        const descData = await descriptionResponse.json()
        itemDescription = descData.description
      }

      // Upload image to Supabase Storage
      const fileName = `${user.id}/${Date.now()}-${imageFile.name}`
      const { error: uploadError } = await supabase.storage
        .from('wardrobe-images')
        .upload(fileName, imageFile)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('wardrobe-images')
        .getPublicUrl(fileName)

      // Extract color and style info from messages
      const analysisMessage = messages.find(msg => msg.role === 'assistant' && msg.score)
      const colorTags: string[] = []
      const styleTags = [occasion]

      // Save to wardrobe_items with today's date as last_worn_date
      const { error: dbError } = await supabase
        .from('wardrobe_items')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          category: 'outfit',
          color_tags: colorTags,
          style_tags: styleTags,
          last_worn_date: new Date().toISOString().split('T')[0],
          notes: `Score: ${initialScore || 'N/A'}/10 - ${analysisMessage?.content.substring(0, 200) || 'Analyzed outfit'}`,
          item_description: itemDescription,
        })

      if (dbError) throw dbError

      showToast('Saved to wardrobe successfully!', 'success')
    } catch (error) {
      console.error('Error saving to wardrobe:', error)
      showToast('Failed to save to wardrobe', 'error')
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          // Show welcome message if not logged in
          const welcomeMessage: Message = {
            id: 'welcome',
            role: 'assistant',
            content: 'Hey! 👋 I\'m Gia, your fashion editor. Upload a photo of your outfit and I\'ll give you my honest opinion. No filters, no lies.',
            created_at: new Date().toISOString(),
          }
          setMessages([welcomeMessage])
          return
        }

        // Load previous messages for this session
        const { data: chatHistory, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('Error loading chat history:', error)
          // Show welcome message on error
          const welcomeMessage: Message = {
            id: 'welcome',
            role: 'assistant',
            content: 'Hey! 👋 I\'m Gia, your fashion editor. Upload a photo of your outfit and I\'ll give you my honest opinion. No filters, no lies.',
            created_at: new Date().toISOString(),
          }
          setMessages([welcomeMessage])
          return
        }

        if (chatHistory && chatHistory.length > 0) {
          // Convert database messages to UI messages
          const loadedMessages: Message[] = chatHistory.map(msg => {
            // Extract score from content if present
            const scoreMatch = msg.content.match(/(?:Score:\s*)?(\d+)\/10/i)
            const extractedScore = scoreMatch ? parseInt(scoreMatch[1]) : undefined
            
            return {
              id: msg.id,
              role: msg.role,
              content: msg.content,
              image_url: msg.image_url,
              created_at: msg.created_at,
              score: extractedScore,
            }
          })
          
          setMessages(loadedMessages)
          
          // If there's an image in the history, set it as current image
          const lastImageMessage = loadedMessages.reverse().find(msg => msg.image_url)
          if (lastImageMessage?.image_url) {
            setImage(lastImageMessage.image_url)
            setShowOccasionSelector(false)
          }
        } else {
          // No history, show welcome message
          const welcomeMessage: Message = {
            id: 'welcome',
            role: 'assistant',
            content: 'Hey! 👋 I\'m Gia, your fashion editor. Upload a photo of your outfit and I\'ll give you my honest opinion. No filters, no lies.',
            created_at: new Date().toISOString(),
          }
          setMessages([welcomeMessage])
        }
      } catch (error) {
        console.error('Error in loadChatHistory:', error)
        // Show welcome message on error
        const welcomeMessage: Message = {
          id: 'welcome',
          role: 'assistant',
          content: 'Hey! 👋 I\'m Gia, your fashion editor. Upload a photo of your outfit and I\'ll give you my honest opinion. No filters, no lies.',
          created_at: new Date().toISOString(),
        }
        setMessages([welcomeMessage])
      }
    }

    loadChatHistory()
  }, [sessionId])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInitialAnalysis = async () => {
    if (!imageFile || !image) return

    setLoading(true)
    setShowOccasionSelector(false)

    try {
      // Add user's image message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: `My outfit for ${occasion}`,
        image_url: image,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, userMessage])

      // Get user's wardrobe context
      const { data: { user } } = await supabase.auth.getUser()
      let wardrobeContext = ''
      
      if (user) {
        const { data: wardrobeItems } = await supabase
          .from('wardrobe_items')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (wardrobeItems && wardrobeItems.length > 0) {
          wardrobeContext = wardrobeItems.map((item, idx) => {
            const itemId = `ITEM-${String(idx + 1).padStart(3, '0')}`
            const colors = item.color_tags?.join(', ') || 'unspecified colors'
            const styles = item.style_tags?.join(', ') || 'casual'
            const description = item.item_description || 'No detailed description'
            return `${itemId}: ${description}\n   Colors: ${colors} | Style: ${styles}`
          }).join('\n\n')
        }
      }

      const formData = new FormData()
      formData.append('image', imageFile)
      formData.append('occasion', occasion)
      if (wardrobeContext) {
        formData.append('wardrobeContext', wardrobeContext)
      }

      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: session?.access_token ? {
          'Authorization': `Bearer ${session.access_token}`
        } : {},
        body: formData,
      })

      if (!response.ok) throw new Error('Analysis failed')

      const data = await response.json()
      const analysis: AnalysisResult = data.analysis

      // Save to chat_messages
      if (user && session?.access_token) {
        await supabase.from('chat_messages').insert([
          {
            session_id: sessionId,
            user_id: user.id,
            role: 'user',
            content: userMessage.content,
            image_url: image,
          },
          {
            session_id: sessionId,
            user_id: user.id,
            role: 'assistant',
            content: analysis.chat_response || 'Analysis completed',
          }
        ])
      }

      // Add Gia's response with score and shopping query
      const giaMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: analysis.chat_response || 'Analysis completed',
        score: analysis.score, // Include score in the message
        shopping_query: analysis.shopping_query, // Include shopping query
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, giaMessage])
      setInitialScore(analysis.score)

    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Oops, something went wrong. Can you try again?',
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleChatImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSendMessage = async (text: string) => {
    if ((!text.trim() && !newImage) || loading) return

    setLoading(true)
    const messageText = text || 'What do you think about this?'
    setInputText('')

    try {
      // Add user message with optional new image
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText,
        image_url: newImage || undefined,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, userMessage])
      
      // Clear new image after sending
      const imageToSend = newImage
      setNewImage(null)
      setNewImageFile(null)

      // Call chat API
      const { data: { session } } = await supabase.auth.getSession()
      
      console.log('Sending chat request:', { sessionId, message: text, hasImage: !!image })
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          sessionId,
          message: messageText,
          imageDataUrl: image, // Include original image for context
          newImageDataUrl: imageToSend, // Include new image if attached
          occasion: occasion, // Include occasion for context persistence
        }),
      })

      console.log('Chat response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Chat API error:', errorData)
        throw new Error(`Chat failed: ${errorData.error || 'Unknown error'}`)
      }

      const data = await response.json()
      console.log('Chat response data:', data)

      // Determine if this is a context where score should be shown
      // Score should ONLY appear for:
      // 1. Initial image analysis (already handled separately)
      // 2. Explicit rating requests ("rate my makeup", "what's my score")
      const isRatingRequest = /rate|score|grade|judge|evaluate/i.test(text.toLowerCase())
      
      // Extract score if present in response (e.g., "Score: 8/10" or "8/10")
      const scoreMatch = data.response.match(/(?:Score:\s*)?(\d+)\/10/i)
      const extractedScore = scoreMatch ? parseInt(scoreMatch[1]) : undefined
      
      // Only include score if this is a rating request
      const shouldShowScore = isRatingRequest && extractedScore
      
      console.log('Extracted score:', extractedScore, 'Should show:', shouldShowScore, 'Is rating request:', isRatingRequest)
      console.log('Shopping query:', data.shopping_query)
      
      const giaMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        score: shouldShowScore ? extractedScore : undefined,
        shopping_query: data.shopping_query,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, giaMessage])

    } catch (error) {
      console.error('Chat error details:', error)
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Oops, something went wrong. Can you try again?',
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleChipClick = (chipText: string) => {
    handleSendMessage(chipText)
  }

  return (
    <AuthGuard>
      <main className="min-h-screen flex flex-col bg-gradient-to-br from-[#F5F5F5] to-[#E8DCC4]/20">
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-4 left-4 right-4 sm:top-6 sm:left-auto sm:right-6 sm:max-w-sm z-50 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-2xl animate-slide-in glass ${
            toast.type === 'success' 
              ? 'border-l-4 border-green-500' 
              : 'border-l-4 border-red-500'
          }`}>
            <p className="text-[#2B2B2B] font-medium text-sm sm:text-base">{toast.message}</p>
          </div>
        )}

        {/* Header */}
        <div className="glass border-b border-white/20 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <GiaAvatar size="sm" />
            <div>
              <h1 className="text-base sm:text-lg font-semibold text-[#2B2B2B]">Gia</h1>
              <p className="text-xs text-[#6B6B6B]">Fashion Editor</p>
            </div>
          </div>
          
          {/* Action Buttons - Only show after initial analysis */}
          {!showOccasionSelector && image && (
            <div className="flex gap-2">
              <button
                onClick={handleSaveToWardrobe}
                disabled={saving}
                className="px-4 py-2 bg-gradient-to-r from-[#C9A961] to-[#E8DCC4] text-white rounded-full text-sm font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Heart size={16} />
                <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                onClick={handleNewAnalysis}
                className="px-4 py-2 glass text-[#2B2B2B] rounded-full text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2 border border-white/20"
              >
                <Camera size={16} />
                <span className="hidden sm:inline">New</span>
              </button>
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-3 sm:space-y-4 pb-32 sm:pb-40 max-h-[calc(100vh-180px)]"
        >
          {messages.map((msg, idx) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <GiaAvatar size="sm" isThinking={loading && idx === messages.length - 1} />
              )}
              
              <div className={`max-w-[85%] sm:max-w-[75%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                {msg.image_url && (
                  <div className="mb-2 relative w-36 h-48 sm:w-48 sm:h-64 rounded-2xl overflow-hidden shadow-lg">
                    <Image
                      src={msg.image_url}
                      alt="Outfit"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div
                  className={`px-4 py-3 rounded-2xl shadow-md ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-[#2B2B2B] to-[#1A1A1A] text-white rounded-br-sm'
                      : 'glass text-[#2B2B2B] rounded-bl-sm'
                  }`}
                >
                  {msg.role === 'assistant' && msg.score && (
                    <div className="mb-3 inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full shadow-lg text-base font-bold">
                      <Sparkles size={18} className="animate-pulse" />
                      <span>Score: {msg.score}/10</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                </div>
                
                {/* Discrete Shopping Button */}
                {msg.role === 'assistant' && msg.shopping_query && (
                  <button
                    onClick={() => {
                      const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(msg.shopping_query!)}&tag=hackathon-demo-20`
                      window.open(amazonUrl, '_blank')
                    }}
                    className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 hover:bg-white border border-[#C9A961]/30 hover:border-[#C9A961] rounded-full text-xs font-medium text-[#2B2B2B] transition-all shadow-sm hover:shadow-md"
                  >
                    <ShoppingBag size={14} className="text-[#C9A961]" />
                    <span>View recommendation</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {loading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-3 justify-start">
              <GiaAvatar size="sm" isThinking={true} />
              <div className="glass px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-[#C9A961] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-[#C9A961] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-[#C9A961] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="fixed bottom-0 left-0 right-0 glass border-t border-white/20 pb-20">
          {/* Initial Upload State */}
          {!image && (
            <div className="p-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gradient-to-r from-[#C9A961] to-[#E8DCC4] text-white py-4 rounded-2xl font-medium hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3"
              >
                <Camera size={22} />
                <span>Upload outfit photo</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          )}

          {/* Occasion Selector */}
          {image && showOccasionSelector && (
            <div className="p-4 space-y-4">
              <div className="relative w-32 h-40 mx-auto rounded-xl overflow-hidden shadow-lg">
                <Image src={image} alt="Preview" fill className="object-cover" />
              </div>
              <p className="text-center text-sm text-[#6B6B6B]">What's the occasion?</p>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {occasions.map((occ) => (
                  <button
                    key={occ.value}
                    onClick={() => setOccasion(occ.value)}
                    className={`p-2 sm:p-3 rounded-xl transition-all ${
                      occasion === occ.value
                        ? 'bg-gradient-to-br from-[#2B2B2B] to-[#1A1A1A] text-white scale-105'
                        : 'bg-white/50'
                    }`}
                  >
                    <div className="text-lg sm:text-xl mb-0.5 sm:mb-1">{occ.emoji}</div>
                    <div className="text-[10px] sm:text-xs font-medium">{occ.label}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={handleInitialAnalysis}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#2B2B2B] to-[#1A1A1A] text-white py-4 rounded-2xl font-medium hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span>Analyze outfit</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Chat Input */}
          {image && !showOccasionSelector && (
            <div className="p-4 space-y-3">
              {/* Suggestion Chips */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {SUGGESTION_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipClick(chip.text)}
                    disabled={loading}
                    className="flex-shrink-0 px-4 py-2 bg-white/80 hover:bg-white rounded-full text-sm font-medium text-[#2B2B2B] shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 border border-[#C9A961]/20"
                  >
                    <span>{chip.emoji}</span>
                    <span>{chip.text}</span>
                  </button>
                ))}
              </div>

              {/* New Image Preview */}
              {newImage && (
                <div className="relative w-32 h-40 rounded-xl overflow-hidden shadow-lg">
                  <Image src={newImage} alt="New photo" fill className="object-cover" />
                  <button
                    onClick={() => {
                      setNewImage(null)
                      setNewImageFile(null)
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Text Input */}
              <div className="flex gap-2">
                <button
                  onClick={() => chatImageInputRef.current?.click()}
                  disabled={loading}
                  className="w-12 h-12 rounded-full glass border border-[#C9A961]/20 text-[#C9A961] flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50"
                  title="Attach photo"
                >
                  <Camera size={20} />
                </button>
                <input
                  ref={chatImageInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleChatImageChange}
                  className="hidden"
                />
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage(inputText)}
                  placeholder="Ask Gia anything..."
                  disabled={loading}
                  className="flex-1 px-4 py-3 rounded-full bg-white/80 border border-[#C9A961]/20 focus:outline-none focus:ring-2 focus:ring-[#C9A961] text-[#2B2B2B] placeholder-[#6B6B6B] disabled:opacity-50"
                />
                <button
                  onClick={() => handleSendMessage(inputText)}
                  disabled={loading || (!inputText.trim() && !newImage)}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C9A961] to-[#E8DCC4] text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </AuthGuard>
  )
}
