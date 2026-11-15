import { Suspense } from 'react'
import { Spin } from 'antd'
import VerifyEmailContent from '@/components/verifyEmail/VerifyEmailContent'

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
            <Spin size="large" />
            <span>Loading...</span>
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </main>
  )
}
