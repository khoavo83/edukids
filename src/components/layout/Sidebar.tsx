"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  Home, 
  Library, 
  Users, 
  Settings, 
  CheckCircle,
  Archive,
  LogOut,
  Layout,
  Globe,
  UserCircle,
  UtensilsCrossed,
  Camera,
  CalendarDays,
  ContactRound
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'

// Định nghĩa menu items với phân quyền tối thiểu
const sidebarItems = [
  { name: 'Bảng điều khiển', icon: Home, href: '/dashboard', minRole: 'teacher' },
  { name: 'Thư viện bài học', icon: Library, href: '/lessons', minRole: 'teacher' },
  { name: 'Hồ sơ Bé / Học sinh', icon: ContactRound, href: '/students', minRole: 'teacher' },
  { name: 'Tổ chức Trường', icon: Archive, href: '/organization', minRole: 'bgh' },
  { name: 'Thực đơn', icon: UtensilsCrossed, href: '/menus', minRole: 'bgh' },
  { name: 'Sự kiện', icon: CalendarDays, href: '/events', minRole: 'bgh' },
  { name: 'Thư viện Ảnh', icon: Camera, href: '/gallery', minRole: 'bgh' },
  { name: 'Phê duyệt bài', icon: CheckCircle, href: '/review', minRole: 'to_truong' },
  { name: 'Người dùng', icon: Users, href: '/users', minRole: 'admin' },
  { name: 'Hồ sơ cá nhân', icon: UserCircle, href: '/profile', minRole: 'teacher' },
  { name: 'Cài đặt trường', icon: Settings, href: '/settings', minRole: 'admin' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { user, hasRoleAbove } = useAuth()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Lọc menu dựa trên phân quyền
  const visibleItems = sidebarItems.filter(item => hasRoleAbove(item.minRole))

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
          <Layout size={24} />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          EduKids
        </span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary font-semibold" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon size={20} className={cn(
                "transition-transform duration-200 group-hover:scale-110",
                isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-600"
              )} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-50 space-y-1">
        <a 
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 hover:bg-primary/5 hover:text-primary rounded-xl transition-colors"
        >
          <Globe size={20} />
          <span>Xem Trang chủ</span>
        </a>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  )
}

