'use client'

/* eslint-disable @next/next/no-img-element */

type GiaAvatarProps = {
  isThinking?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function GiaAvatar({ isThinking = false, size = 'md' }: GiaAvatarProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
  }

  return (
    <div className={`${sizeClasses[size]} relative flex-shrink-0 mx-auto`}>
      <div className={`w-full h-full rounded-full bg-white p-1 shadow-2xl ${isThinking ? 'pulse-glow' : 'shadow-purple-300/50'} border-4 border-purple-300`}>
        <div className="w-full h-full rounded-full overflow-hidden bg-white">
          <img
            src="/images/gia-avatar.png"
            alt="Gia"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      {isThinking && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-3 border-white animate-pulse shadow-lg"></div>
      )}
    </div>
  )
}
