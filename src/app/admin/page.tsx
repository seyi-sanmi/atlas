'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { getAdminUser } from '@/lib/admin'

export default function AdminPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return // Wait for auth to finish loading
    
    if (!user) {
      router.push('/auth/signin?message=Admin access required')
      return
    }

    async function checkAdmin() {
      try {
        const adminUser = await getAdminUser()
        if (!adminUser) {
          router.push('/auth/signin?message=Admin access required')
          return
        }
        // Redirect to dashboard
        router.push('/admin/dashboard')
      } catch (error) {
        console.error('Error checking admin status:', error)
        router.push('/auth/signin?message=Admin access required')
      }
    }

    checkAdmin()
  }, [user, loading, router])

  // Show loading while checking
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-gray-600 dark:text-gray-300">Checking admin access...</span>
      </div>
    </div>
  )
} 