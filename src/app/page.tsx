"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Layout, LogIn, Play, FileText, ImageIcon, Clock, BookOpen, Utensils, Calendar, Camera } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { getDirectImageUrl } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import LessonDetail from '@/components/lessons/LessonDetail'
import LessonCard from '@/components/lessons/LessonCard'

const DAYS = [
  { value: 2, label: 'Thứ 2' },
  { value: 3, label: 'Thứ 3' },
  { value: 4, label: 'Thứ 4' },
  { value: 5, label: 'Thứ 5' },
  { value: 6, label: 'Thứ 6' },
  { value: 7, label: 'Thứ 7' },
]

const MEAL_LABELS: Record<string, string> = {
  sang: 'Sáng',
  trua: 'Trưa',
  xe: 'Xế',
  phu: 'Phụ'
}

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

const MOCK_EVENTS = [
  { id: 1, title: 'Bé vui hội trăng rằm', date: 'Trung thu 2026', image: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?auto=format&fit=crop&q=80&w=400' },
  { id: 2, title: 'Ngày hội thể thao nhí', date: 'Tháng 10/2026', image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=400' },
  { id: 3, title: 'Dã ngoại Thảo Cầm Viên', date: 'Tháng 11/2026', image: 'https://images.unsplash.com/photo-1534008757030-27299b821415?auto=format&fit=crop&q=80&w=400' },
]

const MOCK_GALLERY = [
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1536337005238-94b997371b40?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&q=80&w=400',
]

const gradeLevels = ['Tất cả', 'Nhà trẻ', 'Mầm', 'Chồi', 'Lá']

export default function LandingPage() {
  const supabase = createClient()
  const [lessons, setLessons] = useState<any[]>([])
  const [menus, setMenus] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [gallery, setGallery] = useState<any[]>([])
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [selectedLesson, setSelectedLesson] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [activeGrade, setActiveGrade] = useState('Tất cả')
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    fetchData()
    checkAuth()
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setIsAuthenticated(!!user)
  }

  const fetchData = async () => {
    // Fetch Lessons
    const { data: lessonData } = await supabase
      .from('lessons')
      .select('*, subjects(title), profiles(full_name, avatar_url)')
      .is('deleted_at', null)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (lessonData) setLessons(lessonData)

    // Fetch Menus cho tuần này
    const currentWeekInfo = getWeekStart(new Date())
    const { data: menuData } = await supabase
      .from('menus')
      .select('*')
      .eq('week_start_date', currentWeekInfo)
      .order('day_of_week')
      .order('meal_type')
    
    if (menuData) {
      // Group by day_of_week
      const grouped = DAYS.map(d => ({
        day: d.label,
        meals: menuData.filter((m: any) => m.day_of_week === d.value)
      })).filter(g => g.meals.length > 0)
      setMenus(grouped)
    }

    // Fetch Events
    const { data: eventData } = await supabase.from('events').select('*').order('event_date', { ascending: false }).limit(3)
    if (eventData) setEvents(eventData)

    // Fetch Gallery
    const { data: galleryData } = await supabase.from('gallery').select('*').order('created_at', { ascending: false }).limit(4)
    if (galleryData) setGallery(galleryData)

    // Fetch Settings (Contact footer)
    const { data: settingData } = await supabase.from('school_settings').select('*').single()
    if (settingData) setSettings(settingData)

    setLoading(false)
  }

  const filteredLessons = activeGrade === 'Tất cả' 
    ? lessons 
    : lessons.filter(l => l.grade_level === activeGrade)

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      {/* Navbar Mở */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30">
              <Layout size={24} />
            </div>
            <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              EduKids
            </span>
          </div>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button className="rounded-xl gap-2 font-bold bg-primary text-white hover:bg-primary/90 shadow-sm border-none">
                <Layout size={18} /> Bảng điều khiển
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button className="rounded-xl gap-2 font-bold bg-white text-primary border-2 border-primary/20 hover:bg-primary/10 shadow-sm">
                <LogIn size={18} /> Đăng nhập
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-none text-sm px-4 py-1.5 rounded-full mb-6 font-bold uppercase tracking-widest">
            Trường Mầm Non Tiên Tiến
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-8 leading-tight">
            Ươm mầm <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">tương lai</span>
            <br />cho con yêu của bạn.
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium mb-10 leading-relaxed">
            Hệ thống quản lý học thuật thông minh, cung cấp đầy đủ thông tin hoạt động, thực đơn và tài liệu học tập của bé mỗi ngày.
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Thực đơn & Sự kiện (Cột trái) */}
          <div className="space-y-8">
            {/* Thực đơn */}
            <div className="glass-card rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 text-orange-500 rounded-xl flex items-center justify-center">
                  <Utensils size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Thực đơn tuần này</h2>
              </div>
              <div className="space-y-4">
                {menus.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    Chưa có thực đơn cho tuần này
                  </div>
                ) : (
                  menus.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-start bg-gray-50/50 p-4 rounded-2xl hover:bg-white transition-colors border border-transparent hover:border-gray-100 shadow-sm hover:shadow">
                      <div className="font-bold text-gray-700 w-16 pt-1">{item.day}</div>
                      <div className="flex-1 space-y-2">
                        {item.meals.map((m: any) => (
                          <div key={m.id} className="text-sm border-l-2 border-primary/30 pl-3">
                            <span className="font-bold text-primary mr-1">{MEAL_LABELS[m.meal_type] || m.meal_type}:</span> 
                            <span className="text-gray-600 leading-relaxed break-words">{m.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sự kiện */}
            <div className="glass-card rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 text-blue-500 rounded-xl flex items-center justify-center">
                  <Calendar size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Sự kiện nổi bật</h2>
              </div>
              <div className="space-y-6">
                {events.length === 0 ? (
                   <div className="text-center text-sm text-gray-500 py-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    Chưa có sự kiện nào
                   </div>
                ) : (
                  events.map((event: any) => (
                    <div key={event.id} className="group cursor-pointer">
                      <div className="w-full h-32 rounded-2xl bg-gray-200 mb-3 overflow-hidden">
                        <img src={getDirectImageUrl(event.cover_image)} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <h3 className="font-bold text-gray-800 group-hover:text-primary transition-colors">{event.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Clock size={12}/> {new Date(event.event_date).toLocaleDateString('vi-VN')}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Dữ liệu bài giảng và hình ảnh (Cột phải, rộng hơn) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Gallery Hình ảnh Trường (New) */}
            <div className="glass-card rounded-3xl p-8 border-none bg-gradient-to-br from-white to-primary/5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <Camera size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Không gian trường lớp</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gallery.length === 0 ? (
                  <div className="col-span-full text-center text-sm text-gray-400">Chưa có hình ảnh.</div>
                ) : (
                  gallery.map((img: any) => (
                    <div key={img.id} className="aspect-square rounded-2xl overflow-hidden group relative">
                      <img src={getDirectImageUrl(img.image_url)} alt={img.caption || 'School gallery'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Dữ liệu Bài giảng theo cấp */}
            <div className="glass-card rounded-3xl p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 text-green-500 rounded-xl flex items-center justify-center">
                    <BookOpen size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Tài liệu học tập các cấp</h2>
                </div>
              </div>

              {/* Lọc Khối Lớp */}
              <div className="flex flex-wrap gap-2 mb-8 bg-gray-50 p-2 rounded-2xl">
                {gradeLevels.map(grade => (
                  <button
                    key={grade}
                    onClick={() => setActiveGrade(grade)}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 flex-1 min-w-[100px] ${
                      activeGrade === grade 
                        ? 'bg-white text-primary shadow-sm' 
                        : 'text-gray-500 hover:bg-white/50 hover:text-gray-900'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>

              {/* Lưới bài học */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className="h-64 bg-gray-100 rounded-3xl animate-pulse" />
                  ))
                ) : filteredLessons.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-gray-400 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                    Chưa có bài giảng nào cho cấp bậc này.
                  </div>
                ) : (
                  filteredLessons.map((lesson) => (
                    <div key={lesson.id} className="transition-transform hover:-translate-y-1">
                      <LessonCard 
                        lesson={lesson} 
                        onClick={() => {
                          setSelectedLesson(lesson)
                          setIsDetailOpen(true)
                        }} 
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Layout size={20} />
              </div>
              <h4 className="font-bold text-gray-900 text-lg">{settings.school_name || 'EduKids Hoa Mai'}</h4>
            </div>
            <p className="text-sm text-gray-500">Hệ thống quản lý mầm non thông minh, đồng hành cùng bé phát triển toàn diện.</p>
          </div>
          <div className="text-sm text-gray-500 space-y-2">
            <h4 className="font-bold text-gray-900 text-base mb-4">Liên hệ</h4>
            <p>Hotline: {settings.contact_phone || 'Chưa cập nhật'}</p>
            <p>Email: {settings.contact_email || 'Chưa cập nhật'}</p>
          </div>
          <div className="text-sm text-gray-500 space-y-2">
            <h4 className="font-bold text-gray-900 text-base mb-4">Địa chỉ</h4>
            <p>{settings.contact_address || 'Chưa cập nhật'}</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-8 pt-8 border-t border-gray-100 text-center text-sm text-gray-400">
          © 2026 Bản quyền thuộc về Hệ thống EduKids. Mọi quyền được bảo lưu.
        </div>
      </footer>

      {/* Popup Chi tiết (Đã tích hợp kiểm tra Auth) */}
      <LessonDetail 
        lesson={selectedLesson} 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
      />
    </div>
  )
}
