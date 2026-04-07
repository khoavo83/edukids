"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuth } from '@/hooks/useAuth'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isStaff } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Nếu đã load xong mà user là Phụ huynh → đẩy về trang chủ công khai
    if (!loading && user && !isStaff) {
      router.replace('/')
    }
  }, [loading, user, isStaff, router])

  // Đang load hoặc user không phải staff → hiển thị loading
  if (loading || !user || !isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fc]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400 font-medium">Đang xác thực quyền truy cập...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Header />
        <main className="flex-1 p-8 bg-[#f7f9fc]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

