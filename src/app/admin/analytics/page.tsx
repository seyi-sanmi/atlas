'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { getAdminUser } from '@/lib/admin'
import { AdminAnalytics } from '@/components/admin/analytics'

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return

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
      } catch (error) {
        console.error('Error checking admin status:', error)
        router.push('/auth/signin?message=Admin access required')
      }
    }

    checkAdmin()
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-gray-600 dark:text-gray-300">Loading analytics...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <AdminAnalytics />
}
