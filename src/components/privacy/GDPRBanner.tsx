'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { setGDPRConsent, getGDPRConsent } from '@/lib/event-tracking'
import { X } from 'lucide-react'

export function GDPRBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Show banner if consent hasn't been given
    const hasConsent = getGDPRConsent()
    const hasSeenBanner = localStorage.getItem('gdpr_banner_seen') === 'true'
    
    if (!hasConsent && !hasSeenBanner) {
      setShowBanner(true)
    }
  }, [])

  const handleAccept = () => {
    setGDPRConsent(true)
    localStorage.setItem('gdpr_banner_seen', 'true')
    setShowBanner(false)
  }

  const handleDecline = () => {
    setGDPRConsent(false)
    localStorage.setItem('gdpr_banner_seen', 'true')
    setShowBanner(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('gdpr_banner_seen', 'true')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm mb-1.5 text-foreground">
              Your choice regarding cookies on this site.
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3">
              We use cookies to optimise site functionality, give you the best possible experience and analyse our traffic. 
              By clicking "allow all", you consent to our use of cookies (including strictly necessary cookies). 
              For further information read our{' '}
              <button 
                onClick={() => {/* Could link to cookie policy */}}
                className="text-[#AE3813] hover:underline"
              >
                cookie policy
              </button>.
            </p>
            
            {/* Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleAccept}
                size="sm"
                className="bg-gradient-to-r from-[#AE3813] to-[#D45E3C] hover:from-[#AE3813]/80 hover:to-[#D45E3C]/80 text-xs sm:text-sm px-3 py-1.5 h-auto"
              >
                Allow All
              </Button>
              <Button 
                onClick={handleDecline}
                variant="outline"
                size="sm"
                className="text-xs sm:text-sm px-3 py-1.5 h-auto"
              >
                Decline
              </Button>
            </div>
          </div>

          {/* Close button */}
          <Button 
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="p-1.5 h-auto flex-shrink-0 hover:bg-muted"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
