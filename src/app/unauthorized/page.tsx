'use client'

import { useRouter } from 'next/navigation'
import { Card, CardBody, Button } from '@/components/ui'
import { ShieldX, ArrowLeft } from 'lucide-react'
import { signOut } from '@/lib/api/auth'

export default function UnauthorizedPage() {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <Card>
          <CardBody className="p-8">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <ShieldX size={32} className="text-red-500" />
            </div>

            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
              Access Denied
            </h1>

            <p className="text-[var(--foreground-muted)] mb-6">
              You don't have permission to access the admin panel. This area is
              restricted to administrators only.
            </p>

            <div className="space-y-3">
              <Button onClick={handleSignOut} className="w-full">
                Sign out
              </Button>

              <Button
                variant="ghost"
                onClick={() => router.push('/login')}
                className="w-full"
              >
                <ArrowLeft size={18} className="mr-2" />
                Back to login
              </Button>
            </div>
          </CardBody>
        </Card>

        <p className="text-sm text-[var(--foreground-muted)] mt-4">
          If you believe this is an error, contact your administrator.
        </p>
      </div>
    </div>
  )
}
