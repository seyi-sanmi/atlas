import { SessionDebug } from '@/components/debug/SessionDebug'

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-primary-bg p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary-text mb-8">Debug Session</h1>
        <SessionDebug />
      </div>
    </div>
  )
} 