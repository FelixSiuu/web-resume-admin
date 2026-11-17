import { Suspense } from 'react'
import { Spin } from 'antd'
import ResetPasswordContent from '@/components/resetPassword/ResetPasswordContent'

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex justify-center items-center">
      <div className="w-full max-w-120 p-4">
        <Suspense
          fallback={
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
              <Spin size="large" />
              <span>Loading...</span>
            </div>
          }
        >
          <ResetPasswordContent />
        </Suspense>
      </div>
    </main>
  )
}
