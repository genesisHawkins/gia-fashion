'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import AuthGuard from '@/components/AuthGuard'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DiagnosisPage() {
  const router = useRouter()
  const [step, setStep] = useState<'form' | 'uploading' | 'analyzing'>('form')
  
  // Form data
  const [height, setHeight] = useState('')
  const [bust, setBust] = useState('')
  const [waist, setWaist] = useState('')
  const [hip, setHip] = useState('')
  const [weight, setWeight] = useState('')
  
  // Photos
  const [photoFront, setPhotoFront] = useState<File | null>(null)
  const [photoFrontPreview, setPhotoFrontPreview] = useState<string | null>(null)
  const [photoSide, setPhotoSide] = useState<File | null>(null)
  const [photoSidePreview, setPhotoSidePreview] = useState<string | null>(null)
  const [photoFace, setPhotoFace] = useState<File | null>(null)
  const [photoFacePreview, setPhotoFacePreview] = useState<string | null>(null)
  
  const [error, setError] = useState<string | null>(null)
  
  const frontInputRef = useRef<HTMLInputElement>(null)
  const sideInputRef = useRef<HTMLInputElement>(null)
  const faceInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'front' | 'side' | 'face'
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const preview = reader.result as string
        if (type === 'front') {
          setPhotoFront(file)
          setPhotoFrontPreview(preview)
        } else if (type === 'side') {
          setPhotoSide(file)
          setPhotoSidePreview(preview)
        } else {
          setPhotoFace(file)
          setPhotoFacePreview(preview)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!height || !bust || !waist || !hip) {
      setError('Please fill in all required measurements')
      return
    }
    
    if (!photoFront || !photoSide || !photoFace) {
      setError('Please upload all 3 required photos')
      return
    }

    setError(null)
    setStep('uploading')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload photos to Supabase Storage
      const uploadPhoto = async (file: File, type: string) => {
        const fileName = `${user.id}/${type}-${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('diagnosis-photos')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('diagnosis-photos')
          .getPublicUrl(fileName)

        return publicUrl
      }

      const photoFrontUrl = await uploadPhoto(photoFront, 'front')
      const photoSideUrl = await uploadPhoto(photoSide, 'side')
      const photoFaceUrl = await uploadPhoto(photoFace, 'face')

      setStep('analyzing')

      // Call AI analysis API
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/style-diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          height_cm: parseInt(height),
          bust_cm: parseInt(bust),
          waist_cm: parseInt(waist),
          hip_cm: parseInt(hip),
          weight_kg: weight ? parseInt(weight) : null,
          photo_front_url: photoFrontUrl,
          photo_side_url: photoSideUrl,
          photo_face_url: photoFaceUrl,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analysis failed')
      }

      // Redirect to results page
      router.push('/diagnosis/results')
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('form')
    }
  }

  if (step === 'uploading') {
    return (
      <AuthGuard>
        <main className="min-h-screen flex items-center justify-center px-6">
          <div className="text-center">
            <div className="inline-block w-16 h-16 border-4 border-[#C9A961]/20 border-t-[#C9A961] rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-light text-[#2B2B2B] mb-2">Uploading photos...</h2>
            <p className="text-[#6B6B6B]">Please wait</p>
          </div>
        </main>
      </AuthGuard>
    )
  }

  if (step === 'analyzing') {
    return (
      <AuthGuard>
        <main className="min-h-screen flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="inline-block w-16 h-16 border-4 border-[#C9A961]/20 border-t-[#C9A961] rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-light text-[#2B2B2B] mb-2">Analyzing your style...</h2>
            <p className="text-[#6B6B6B] mb-4">Our AI is analyzing your body type, face shape, and color palette</p>
            <p className="text-sm text-[#C9A961]">This may take 30-60 seconds</p>
          </div>
        </main>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <main className="min-h-screen px-6 py-8 pb-24">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-light text-[#2B2B2B] mb-2">My Style Diagnosis</h1>
            <p className="text-[#6B6B6B]">Get your personalized style analysis</p>
            <div className="w-24 h-[1px] bg-gradient-to-r from-[#C9A961] to-transparent mt-4"></div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="glass p-6 rounded-3xl mb-8 border border-[#C9A961]/20">
            <h3 className="font-semibold text-[#2B2B2B] mb-3 flex items-center gap-2">
              <Camera size={20} className="text-[#C9A961]" />
              Photo Instructions
            </h3>
            <p className="text-sm text-[#6B6B6B] leading-relaxed">
              For accurate results, wear <span className="font-semibold text-[#2B2B2B]">tight-fitting clothing</span> (preferably black leggings and a fitted top) that shows your real silhouette. Stand straight with good posture.
            </p>
          </div>

          {/* Measurements Section */}
          <div className="glass p-6 rounded-3xl mb-6 border border-white/20">
            <h3 className="font-semibold text-[#2B2B2B] mb-4">Your Measurements</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#6B6B6B] mb-2">Height (cm) *</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="165"
                  className="w-full px-4 py-3 rounded-xl bg-white/80 border border-[#C9A961]/20 focus:outline-none focus:ring-2 focus:ring-[#C9A961] text-[#2B2B2B]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#6B6B6B] mb-2">Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="60"
                  className="w-full px-4 py-3 rounded-xl bg-white/80 border border-[#C9A961]/20 focus:outline-none focus:ring-2 focus:ring-[#C9A961] text-[#2B2B2B]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#6B6B6B] mb-2">Bust (cm) *</label>
                <input
                  type="number"
                  value={bust}
                  onChange={(e) => setBust(e.target.value)}
                  placeholder="90"
                  className="w-full px-4 py-3 rounded-xl bg-white/80 border border-[#C9A961]/20 focus:outline-none focus:ring-2 focus:ring-[#C9A961] text-[#2B2B2B]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#6B6B6B] mb-2">Waist (cm) *</label>
                <input
                  type="number"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  placeholder="70"
                  className="w-full px-4 py-3 rounded-xl bg-white/80 border border-[#C9A961]/20 focus:outline-none focus:ring-2 focus:ring-[#C9A961] text-[#2B2B2B]"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-[#6B6B6B] mb-2">Hip (cm) *</label>
                <input
                  type="number"
                  value={hip}
                  onChange={(e) => setHip(e.target.value)}
                  placeholder="95"
                  className="w-full px-4 py-3 rounded-xl bg-white/80 border border-[#C9A961]/20 focus:outline-none focus:ring-2 focus:ring-[#C9A961] text-[#2B2B2B]"
                />
              </div>
            </div>
          </div>

          {/* Photos Section */}
          <div className="space-y-4 mb-8">
            {/* Photo 1: Front */}
            <div className="glass p-6 rounded-3xl border border-white/20">
              <h4 className="font-semibold text-[#2B2B2B] mb-2">Photo 1: Full Body (Front) *</h4>
              <p className="text-sm text-[#6B6B6B] mb-4">Stand straight facing the camera, full body visible</p>
              
              {photoFrontPreview ? (
                <div className="relative w-full h-64 rounded-xl overflow-hidden mb-4">
                  <Image src={photoFrontPreview} alt="Front" fill className="object-contain bg-gray-50" />
                  <button
                    onClick={() => {
                      setPhotoFront(null)
                      setPhotoFrontPreview(null)
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => frontInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-[#C9A961]/30 rounded-xl hover:border-[#C9A961] transition-all flex items-center justify-center gap-2 text-[#6B6B6B] hover:text-[#C9A961]"
                >
                  <Upload size={20} />
                  <span>Upload Photo</span>
                </button>
              )}
              <input
                ref={frontInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoChange(e, 'front')}
                className="hidden"
              />
            </div>

            {/* Photo 2: Side */}
            <div className="glass p-6 rounded-3xl border border-white/20">
              <h4 className="font-semibold text-[#2B2B2B] mb-2">Photo 2: Full Body (Side Profile) *</h4>
              <p className="text-sm text-[#6B6B6B] mb-4">Stand sideways to the camera, full body visible</p>
              
              {photoSidePreview ? (
                <div className="relative w-full h-64 rounded-xl overflow-hidden mb-4">
                  <Image src={photoSidePreview} alt="Side" fill className="object-contain bg-gray-50" />
                  <button
                    onClick={() => {
                      setPhotoSide(null)
                      setPhotoSidePreview(null)
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => sideInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-[#C9A961]/30 rounded-xl hover:border-[#C9A961] transition-all flex items-center justify-center gap-2 text-[#6B6B6B] hover:text-[#C9A961]"
                >
                  <Upload size={20} />
                  <span>Upload Photo</span>
                </button>
              )}
              <input
                ref={sideInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoChange(e, 'side')}
                className="hidden"
              />
            </div>

            {/* Photo 3: Face */}
            <div className="glass p-6 rounded-3xl border border-white/20">
              <h4 className="font-semibold text-[#2B2B2B] mb-2">Photo 3: Face (No Makeup) *</h4>
              <p className="text-sm text-[#6B6B6B] mb-4">Selfie with natural light, no makeup, hair pulled back</p>
              
              {photoFacePreview ? (
                <div className="relative w-full h-64 rounded-xl overflow-hidden mb-4">
                  <Image src={photoFacePreview} alt="Face" fill className="object-contain bg-gray-50" />
                  <button
                    onClick={() => {
                      setPhotoFace(null)
                      setPhotoFacePreview(null)
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => faceInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-[#C9A961]/30 rounded-xl hover:border-[#C9A961] transition-all flex items-center justify-center gap-2 text-[#6B6B6B] hover:text-[#C9A961]"
                >
                  <Upload size={20} />
                  <span>Upload Photo</span>
                </button>
              )}
              <input
                ref={faceInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoChange(e, 'face')}
                className="hidden"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!height || !bust || !waist || !hip || !photoFront || !photoSide || !photoFace}
            className="w-full bg-gradient-to-r from-[#2B2B2B] to-[#1A1A1A] text-white py-4 rounded-2xl font-medium hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <Sparkles size={20} />
            <span>Analyze My Style</span>
          </button>
        </div>
      </main>
    </AuthGuard>
  )
}
