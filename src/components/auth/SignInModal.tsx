'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Loader2, Mail, Linkedin, Chrome, X } from 'lucide-react'

interface SignInModalProps {
  onClose: () => void
  onSwitchToSignUp: () => void
}

export function SignInModal({ onClose, onSwitchToSignUp }: SignInModalProps) {
  const { signInWithGoogle, signInWithLinkedIn, signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signInWithEmail(email, password)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google')
      setLoading(false)
    }
  }

  const handleLinkedInSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      await signInWithLinkedIn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in with LinkedIn')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-secondary-bg border border-primary-border rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary-border">
          <div>
            <h2 className="text-xl font-display font-medium text-primary-text">Sign In</h2>
            <p className="text-primary-text/60 text-sm mt-1">Welcome back to ATLAS</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-sm transition-colors"
          >
            <X className="w-5 h-5 text-primary-text/60" />
          </button>
        </div>

        <div className="px-6 py-6">
          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-white/10 border border-primary-border rounded-lg text-primary-text hover:bg-white/20 disabled:opacity-50 transition-all duration-200 font-medium"
            >
              <Chrome className="w-4 h-4 mr-3" />
              Continue with Google
            </button>
            
            <button
              onClick={handleLinkedInSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-white/10 border border-primary-border rounded-lg text-primary-text hover:bg-white/20 disabled:opacity-50 transition-all duration-200 font-medium"
            >
              <Linkedin className="w-4 h-4 mr-3" />
              Continue with LinkedIn
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-primary-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-secondary-bg text-primary-text/60">Or continue with email</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary-text mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-secondary-bg/50 border border-primary-border rounded-lg text-primary-text placeholder-primary-text/40 focus:outline-none focus:border-[#AE3813] transition-colors"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-primary-text mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-secondary-bg/50 border border-primary-border rounded-lg text-primary-text placeholder-primary-text/40 focus:outline-none focus:border-[#AE3813] transition-colors"
              />
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] text-white font-medium rounded-lg hover:from-[#AE3813]/80 hover:to-[#D45E3C]/80 disabled:opacity-50 transition-all duration-200 transform hover:scale-[1.02]"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {!loading && <Mail className="w-4 h-4 mr-2" />}
              Sign In
            </button>
          </form>

          <div className="text-center text-sm mt-6">
            <span className="text-primary-text/60">Don't have an account? </span>
            <button
              onClick={onSwitchToSignUp}
              className="text-[#AE3813] hover:text-[#D45E3C] font-medium transition-colors"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 