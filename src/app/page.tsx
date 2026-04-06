"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Layout, LogIn, Play, FileText, ImageIcon, Clock, BookOpen, Utensils, Calendar, Camera } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import LessonDetail from '@/components/lessons/LessonDetail'
import LessonCard from '@/components/lessons/LessonCard'

const MOCK_MENU = [
  { day: 'Thứ 2', meal: 'Cháo sườn non hạt sen, Sữa chua' },
  { day: 'Thứ 3', meal: 'Cơm nát, Thịt bò sốt cà, Canh bí đỏ' },
  { day: 'Thứ 4', meal: 'Súp cua măng tây, Bánh flan' },
  { day: 'Thứ 5', meal: 'Cơm nát, Cá hồi sốt cam, Canh mồng tơi' },
  { day: 'Thứ 6', meal: 'Phở bò mềm, Nước ép dưa hấu' },
]

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
    const { data, error } = await supabase
      .from('lessons')
      .select('*, subjects(title), profiles(full_name, avatar_url)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(20) // Lấy 20 bài mới nhất cho trang công khai
    
    if (data) setLessons(data)
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
                {MOCK_MENU.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center bg-gray-50/50 p-4 rounded-2xl hover:bg-white transition-colors border border-transparent hover:border-gray-100">
                    <div className="font-bold text-gray-700 w-16">{item.day}</div>
                    <div className="flex-1 text-sm text-gray-600 leading-relaxed">{item.meal}</div>
                  </div>
                ))}
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
                {MOCK_EVENTS.map((event) => (
                  <div key={event.id} className="group cursor-pointer">
                    <div className="w-full h-32 rounded-2xl bg-gray-200 mb-3 overflow-hidden">
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <h3 className="font-bold text-gray-800 group-hover:text-primary transition-colors">{event.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Clock size={12}/> {event.date}</p>
                  </div>
                ))}
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
                {MOCK_GALLERY.map((img, idx) => (
                  <div key={idx} className="aspect-square rounded-2xl overflow-hidden group relative">
                    <img src={img} alt="School gallery" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
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
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4">
            <Layout size={20} />
          </div>
          <h4 className="font-bold text-gray-900 mb-2">Hệ thống Quản lý EduKids</h4>
          <p className="text-sm text-gray-500">© 2026 Bản quyền thuộc về EduKids Hoa Mai.</p>
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
