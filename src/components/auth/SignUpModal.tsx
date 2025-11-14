'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth'
import { Loader2, Mail, Linkedin, Chrome, X, CheckCircle } from 'lucide-react'

interface SignUpModalProps {
  onClose: () => void
  onSwitchToSignIn: () => void
}

export function SignUpModal({ onClose, onSwitchToSignIn }: SignUpModalProps) {
  const { signInWithGoogle, signInWithLinkedIn, signUpWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleEmailSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      await signUpWithEmail(email, password)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up')
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

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md mx-4 bg-secondary-bg border border-primary-border rounded-lg shadow-2xl overflow-hidden">
          <div className="px-6 py-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 border-2 border-green-500/30 mb-6">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h2 className="text-xl font-display font-medium text-primary-text mb-2">Check your email</h2>
            <p className="text-primary-text/60 mb-6">
              We've sent a confirmation link to <br />
              <strong className="text-primary-text">{email}</strong>
            </p>
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] text-white font-medium rounded-lg hover:from-[#AE3813]/80 hover:to-[#D45E3C]/80 transition-all duration-200 transform hover:scale-[1.02]"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    )
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
            <h2 className="text-xl font-display font-medium text-primary-text">Create Account</h2>
            <p className="text-primary-text/60 text-sm mt-1">Join the ATLAS community</p>
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
          <form onSubmit={handleEmailSignUp} className="space-y-4">
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
                placeholder="Create a password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-secondary-bg/50 border border-primary-border rounded-lg text-primary-text placeholder-primary-text/40 focus:outline-none focus:border-[#AE3813] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary-text mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              Create Account
            </button>
          </form>

          <div className="text-center text-sm mt-6">
            <span className="text-primary-text/60">Already have an account? </span>
            <button
              onClick={onSwitchToSignIn}
              className="text-[#AE3813] hover:text-[#D45E3C] font-medium transition-colors"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 