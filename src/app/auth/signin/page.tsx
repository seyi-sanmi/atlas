'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '@/lib/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Mail, Linkedin, Chrome, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

function SignInContent() {
  const { signInWithGoogle, signInWithLinkedIn, signInWithEmail, signUpWithEmail, user } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get mode from URL params or default to signin
  useEffect(() => {
    const modeParam = searchParams.get('mode')
    if (modeParam === 'signup') {
      setMode('signup')
    }
  }, [searchParams])

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push('/')
    }
  }, [user, router])

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password)
        router.push('/')
      } else {
        await signUpWithEmail(email, password)
        setSuccess(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${mode === 'signin' ? 'sign in' : 'sign up'}`)
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
      <div className="min-h-screen bg-primary-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-secondary-bg border border-primary-border rounded-lg shadow-2xl overflow-hidden">
          <div className="px-6 py-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 border-2 border-green-500/30 mb-6">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h1 className="text-xl font-display font-medium text-primary-text mb-2">Check your email</h1>
            <p className="text-primary-text/60 mb-6">
              We've sent a confirmation link to <br />
              <strong className="text-primary-text">{email}</strong>
            </p>
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center px-4 py-3 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] text-white font-medium rounded-lg hover:from-[#AE3813]/80 hover:to-[#D45E3C]/80 transition-all duration-200 transform hover:scale-[1.02]"
            >
              Back to ATLAS
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header with back button */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-primary-text/60 hover:text-primary-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to ATLAS
          </Link>
        </div>

        {/* Main auth card */}
        <div className="bg-secondary-bg border border-primary-border rounded-lg shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 py-6 border-b border-primary-border text-center">
            <div className="h-8 w-auto mx-auto mb-4">
              <svg
                id="Layer_1"
                data-name="Layer 1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 293.42 378.67"
                className="h-8 w-auto"
              >
                <defs>
                  <style>
                    {`.cls-1 {
                      fill-rule: evenodd;
                    }
                    .cls-1, .cls-2 {
                      fill: #D45E3C;
                      stroke-width: 0px;
                    }`}
                  </style>
                </defs>
                <path
                  className="cls-2"
                  d="M88.52,152.44c3.83-28.5,28.41-50.49,58.18-50.49,32.42,0,58.69,26.08,58.69,58.26,0,17.07-7.4,32.43-19.19,43.09-2.65,2.39-3.03,6.53-.66,9.19,5.71,6.39,10.91,13.25,15.51,20.52,1.86,2.94,5.87,3.8,8.55,1.57,21.35-17.81,34.92-44.51,34.92-74.36,0-53.62-43.8-97.09-97.82-97.09s-94.61,40.36-97.65,91.27c-.19,3.21,2.45,5.83,5.7,5.83h13.7c3.98,0,6.04,0,11.82.44,5.79.43,7.22-.44,8.26-8.2Z"
                />
                <path
                  className="cls-1"
                  d="M48.87,185.45c0-3.22,2.63-5.83,5.87-5.83h13.7c73.67,0,133.75,57.73,136.83,130.1.14,3.21-2.5,5.83-5.75,5.83h-27.39c-3.24,0-5.85-2.61-6.04-5.83-3.04-50.91-45.59-91.27-97.65-91.27h-13.7c-3.24,0-5.87-2.61-5.87-5.83v-27.19Z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-display font-medium text-primary-text">
              {mode === 'signin' ? 'Welcome back' : 'Join ATLAS'}
            </h1>
            <p className="text-primary-text/60 text-sm mt-1">
              {mode === 'signin' ? 'Sign in to your account' : 'Create your account to get started'}
            </p>
          </div>

          <div className="px-6 py-6">
            {/* Mode toggle */}
            <div className="flex mb-6">
              <button
                onClick={() => setMode('signin')}
                className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                  mode === 'signin'
                    ? 'text-primary-text border-b-2 border-[#AE3813]'
                    : 'text-primary-text/60 hover:text-primary-text'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                  mode === 'signup'
                    ? 'text-primary-text border-b-2 border-[#AE3813]'
                    : 'text-primary-text/60 hover:text-primary-text'
                }`}
              >
                Sign Up
              </button>
            </div>

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
            <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                  placeholder={mode === 'signin' ? 'Enter your password' : 'Create a password (min. 6 characters)'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={mode === 'signup' ? 6 : undefined}
                  className="w-full px-4 py-3 bg-secondary-bg/50 border border-primary-border rounded-lg text-primary-text placeholder-primary-text/40 focus:outline-none focus:border-[#AE3813] transition-colors"
                />
              </div>

              {mode === 'signup' && (
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
              )}

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
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-primary-text">Loading...</span>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
} 