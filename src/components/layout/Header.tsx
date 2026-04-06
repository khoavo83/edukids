"use client"

import { useState, useEffect } from 'react'
import { Bell, Search, User, LogOut, Settings as SettingsIcon } from 'lucide-react'
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

const mockNotifications = [
  { id: 1, text: 'Bài giảng "Bé học đếm" đã được duyệt.', time: '5 phút trước' },
  { id: 2, text: 'Admin đã cập nhật bộ môn mới.', time: '10 phút trước' },
  { id: 3, text: 'Giáo viên Anna vừa tải lên tài liệu mới.', time: '1 giờ trước' },
]

export default function Header() {
  const [hasUnread, setHasUnread] = useState(true)
  const [userName, setUserName] = useState('Người dùng')
  const [userRole, setUserRole] = useState('')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Lấy thông tin profile
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
      }
    }
    fetchUser()
  }, [])

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
        {/* push notifications mockup */}
        <Popover onOpenChange={() => setHasUnread(false)}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white relative">
              <Bell size={20} className="text-gray-500" />
              {hasUnread && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-bounce" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 rounded-3xl glass-card mr-4">
            <div className="p-4 border-b border-gray-50">
              <h3 className="font-bold text-sm">Thông báo</h3>
            </div>
            <div className="py-2">
              {mockNotifications.map((notif) => (
                <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 last:border-none">
                  <p className="text-xs text-gray-800 line-clamp-2">{notif.text}</p>
                  <span className="text-[10px] text-gray-400 mt-1 block">{notif.time}</span>
                </div>
              ))}
            </div>
            <button className="w-full p-3 text-[10px] text-primary font-bold hover:bg-primary/5 transition-colors uppercase tracking-widest">
              Xem tất cả thông báo
            </button>
          </PopoverContent>
        </Popover>

        <div className="h-8 w-px bg-gray-100 mx-2" />

        {/* user avatar and menu */}
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
