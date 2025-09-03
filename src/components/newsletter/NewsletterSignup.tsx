'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { newsletterService, tagSubscriberByInterests } from '@/lib/newsletter-service'
import { setGDPRConsent } from '@/lib/event-tracking'
import { Mail, Check, AlertCircle } from 'lucide-react'

interface NewsletterSignupProps {
  className?: string
  placeholder?: string
  buttonText?: string
  showGDPRNote?: boolean
}

export function NewsletterSignup({ 
  className = '',
  placeholder = 'Enter your email for updates',
  buttonText = 'Subscribe',
  showGDPRNote = true
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [gdprConsent, setGdprConsent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) return
    if (showGDPRNote && !gdprConsent) {
      setStatus('error')
      return
    }

    setIsLoading(true)
    setStatus('idle')

    try {
      // Set GDPR consent in tracking system
      if (gdprConsent) {
        setGDPRConsent(true)
      }

      // Subscribe using the newsletter service
      const result = await newsletterService.subscribe(email.trim(), {
        source: window.location.pathname,
        gdpr_consent: gdprConsent
      })

      if (result.success) {
        // Tag subscriber based on their event interests (async)
        tagSubscriberByInterests(email.trim()).catch(console.error)
        
        setStatus('success')
        setEmail('')
        
        // Reset after 3 seconds
        setTimeout(() => setStatus('idle'), 3000)
      } else {
        throw new Error(result.error || 'Subscription failed')
      }
    } catch (error) {
      console.error('Newsletter signup error:', error)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder={placeholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10"
            disabled={isLoading || status === 'success'}
            required
          />
        </div>
        <Button 
          type="submit" 
          disabled={isLoading || !isValidEmail(email) || status === 'success' || (showGDPRNote && !gdprConsent)}
          className="bg-gradient-to-r from-[#AE3813] to-[#D45E3C] hover:from-[#AE3813]/80 hover:to-[#D45E3C]/80"
        >
          {isLoading ? (
            'Subscribing...'
          ) : status === 'success' ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Subscribed!
            </>
          ) : (
            buttonText
          )}
        </Button>
      </form>

      {showGDPRNote && (
        <div className="space-y-2">
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={gdprConsent}
              onChange={(e) => setGdprConsent(e.target.checked)}
              className="mt-1 accent-[#AE3813]"
              required
            />
            <span>
              I consent to ATLAS tracking my interactions with events for research and analytics purposes. 
              This data helps us understand user interests and improve our platform. 
              You can withdraw consent at any time by contacting us.
            </span>
          </label>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span>
            {showGDPRNote && !gdprConsent 
              ? 'Please accept the consent to continue.' 
              : 'Something went wrong. Please try again.'}
          </span>
        </div>
      )}

      {status === 'success' && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <Check className="h-4 w-4" />
          <span>Thank you! Your email has been added and we'll track your event interests.</span>
        </div>
      )}
    </div>
  )
}
