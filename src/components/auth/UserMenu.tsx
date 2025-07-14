'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth'
import { LogOut, User, ChevronDown, Settings } from 'lucide-react'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  if (!user) return null

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsOpen(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getUserInitials = () => {
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user.email?.slice(0, 2).toUpperCase() || 'U'
  }

  const getUserName = () => {
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-secondary-bg/50 transition-all duration-200 text-primary-text"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] text-white rounded-full flex items-center justify-center text-sm font-medium shadow-lg">
          {getUserInitials()}
        </div>
        <span className="hidden sm:block text-sm font-medium">
          {getUserName()}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-secondary-bg border border-primary-border rounded-lg shadow-2xl py-2 z-50 backdrop-blur-lg">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-primary-border">
            <div className="font-medium text-primary-text text-sm">{getUserName()}</div>
            <div className="text-primary-text/60 text-xs mt-1">{user.email}</div>
          </div>
          
          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={() => {
                // TODO: Open profile/settings
                setIsOpen(false)
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-primary-text hover:bg-white/10 transition-colors"
            >
              <Settings className="w-4 h-4 mr-3" />
              Profile Settings
            </button>
            
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-4 py-2 text-sm text-primary-text hover:bg-white/10 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 