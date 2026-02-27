import { AdminLayout } from '@/components/layout/AdminLayout'
import { AdminLoadingGate } from '@/components/layout/AdminLoadingGate'
import { AuthProvider } from '@/contexts/AuthContext'
import { EventProvider } from '@/contexts/EventContext'
import { EventPicker } from '@/components/events/EventPicker'

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <EventProvider>
        <EventPicker />
        <AdminLoadingGate>
          <AdminLayout>{children}</AdminLayout>
        </AdminLoadingGate>
      </EventProvider>
    </AuthProvider>
  )
}
