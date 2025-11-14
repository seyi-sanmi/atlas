'use client'

import { useState } from 'react'
import { SignInModal } from './SignInModal'
import { SignUpModal } from './SignUpModal'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultView?: 'signin' | 'signup'
}

export function AuthModal({ isOpen, onClose, defaultView = 'signin' }: AuthModalProps) {
  const [view, setView] = useState<'signin' | 'signup'>(defaultView)

  if (!isOpen) return null

  const handleSwitchToSignUp = () => setView('signup')
  const handleSwitchToSignIn = () => setView('signin')

  return (
    <>
      {view === 'signin' && (
        <SignInModal
          onClose={onClose}
          onSwitchToSignUp={handleSwitchToSignUp}
        />
      )}
      {view === 'signup' && (
        <SignUpModal
          onClose={onClose}
          onSwitchToSignIn={handleSwitchToSignIn}
        />
      )}
    </>
  )
} 