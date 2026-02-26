import { AdminLayout } from '@/components/layout/AdminLayout'
import { AuthProvider } from '@/contexts/AuthContext'

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <AdminLayout>{children}</AdminLayout>
    </AuthProvider>
  )
}
