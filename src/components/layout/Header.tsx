"use client"

import { useState, useEffect, useCallback } from 'react'
import { Bell, Search, User, LogOut, Settings as SettingsIcon, FileText, CheckCircle, XCircle, Info, Check } from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

// Hàm tính thời gian tương đối
function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return 'Vừa xong'
  if (diffMin < 60) return `${diffMin} phút trước`
  if (diffHour < 24) return `${diffHour} giờ trước`
  if (diffDay < 7) return `${diffDay} ngày trước`
  return date.toLocaleDateString('vi-VN')
}

// Icon theo loại thông báo
function NotifIcon({ type }: { type: string }) {
  switch (type) {
    case 'new_lesson': return <FileText size={16} className="text-blue-500" />
    case 'approved': return <CheckCircle size={16} className="text-green-500" />
    case 'rejected': return <XCircle size={16} className="text-red-500" />
    default: return <Info size={16} className="text-gray-400" />
  }
}

export default function Header() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [userName, setUserName] = useState('Người dùng')
  const [userRole, setUserRole] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  // Lấy thông tin user + notifications ban đầu
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      // Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setUserName(profile.full_name || user.email || 'Người dùng')
        setUserRole(profile.role === 'admin' ? 'Quản trị viên' : 
                    profile.role === 'teacher' ? 'Giáo viên' : 'Phụ huynh')
      } else {
        setUserName(user.email || 'Người dùng')
      }

      // Fetch notifications
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (notifs) {
        setNotifications(notifs)
        setUnreadCount(notifs.filter((n: any) => !n.is_read).length)
      }
    }
    init()
  }, [])

  // Realtime subscription
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const newNotif = payload.new
          setNotifications(prev => [newNotif, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // Đánh dấu 1 thông báo đã đọc
  const markAsRead = async (notifId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId)
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  // Đánh dấu tất cả đã đọc
  const markAllAsRead = async () => {
    if (!userId) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  // Click thông báo → navigate
  const handleNotifClick = (notif: any) => {
    if (!notif.is_read) markAsRead(notif.id)
    if (notif.link) router.push(notif.link)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-20 bg-white/40 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Tìm nhanh..." 
            className="w-full pl-11 pr-4 py-2 bg-gray-100/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all outline-none text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* === THÔNG BÁO REALTIME === */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white relative">
              <Bell size={20} className="text-gray-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-lg shadow-red-500/30 animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0 rounded-3xl glass-card mr-4 max-h-[70vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-50 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm">Thông báo</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] text-primary font-bold hover:underline flex items-center gap-1"
                >
                  <Check size={12} /> Đọc tất cả
                </button>
              )}
            </div>

            {/* Danh sách */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-sm">
                  <Bell size={32} className="mx-auto mb-3 opacity-30" />
                  Chưa có thông báo nào
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`px-4 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-none flex gap-3 items-start ${
                      !notif.is_read ? 'bg-primary/[0.03]' : ''
                    }`}
                    onClick={() => handleNotifClick(notif)}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      notif.type === 'new_lesson' ? 'bg-blue-50' :
                      notif.type === 'approved' ? 'bg-green-50' :
                      notif.type === 'rejected' ? 'bg-red-50' : 'bg-gray-50'
                    }`}>
                      <NotifIcon type={notif.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${!notif.is_read ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <span className="text-[10px] text-gray-400 mt-1 block">{timeAgo(notif.created_at)}</span>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />
                    )}
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-8 w-px bg-gray-100 mx-2" />

        {/* === USER MENU === */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{userName}</div>
                <div className="text-[10px] text-gray-400 font-medium">{userRole}</div>
              </div>
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold shadow-sm shadow-primary/10">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 rounded-2xl glass-card mr-4" align="end">
            <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
              <User size={16} /> Hồ sơ cá nhân
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
              <SettingsIcon size={16} /> Cài đặt thiết bị
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="rounded-lg gap-2 text-red-500 hover:bg-red-50 focus:text-red-600 focus:bg-red-50 cursor-pointer font-bold"
              onClick={handleLogout}
            >
              <LogOut size={16} /> Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
