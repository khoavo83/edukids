"use client"

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { Search, Filter, Play, FileText, ImageIcon, Clock } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import LessonDetail from '@/components/lessons/LessonDetail'
import LessonCard from '@/components/lessons/LessonCard'

const gradeLevels = ['Tất cả', 'Nhà trẻ', 'Mầm', 'Chồi', 'Lá']

export default function HomePage() {
  const supabase = createClient()
  const [lessons, setLessons] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLesson, setSelectedLesson] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  
  const [filters, setFilters] = useState({
    search: '',
    grade: 'Tất cả',
    subject: 'Tất cả'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: subjectsData } = await supabase.from('subjects').select('*')
    if (subjectsData) setSubjects(subjectsData)

    const { data: lessonsData, error } = await supabase
      .from('lessons')
      .select('*, subjects(title), profiles(full_name, avatar_url)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    
    if (error) console.error(error)
    if (lessonsData) setLessons(lessonsData)
    setLoading(false)
  }

  // Logic lọc dữ liệu phía Client (Quick filter)
  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(filters.search.toLowerCase())
    const matchesGrade = filters.grade === 'Tất cả' || lesson.grade_level === filters.grade
    const matchesSubject = filters.subject === 'Tất cả' || lesson.subject_id === filters.subject
    return matchesSearch && matchesGrade && matchesSubject
  })

  return (
    <MainLayout>
      <header className="mb-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
              Chào mừng trở lại! 👋
            </h1>
            <p className="text-gray-500">Khám phá và học hỏi từ các bài giảng đã được kiểm duyệt.</p>
          </div>
          <div className="hidden md:block">
            {/* School Logo Placeholder */}
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary font-black italic text-xl">
              EK
            </div>
          </div>
        </div>
      </header>

      {/* Bộ lọc đa tầng (Multi-level Filter) */}
      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Tìm kiếm bài học..." 
            className="w-full pl-12 pr-4 py-3 rounded-2xl border-none glass-card focus:ring-2 focus:ring-primary/20 outline-none"
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>
        <div className="flex gap-3">
          <Select onValueChange={(val) => setFilters({...filters, grade: val})}>
            <SelectTrigger className="w-[150px] rounded-2xl glass-card border-none h-12 shadow-none text-gray-600">
              <Filter className="mr-2" size={16} />
              <SelectValue placeholder="Khối lớp" />
            </SelectTrigger>
            <SelectContent>
              {gradeLevels.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select onValueChange={(val) => setFilters({...filters, subject: val})}>
            <SelectTrigger className="w-[180px] rounded-2xl glass-card border-none h-12 shadow-none text-gray-600">
              <Filter className="mr-2" size={16} />
              <SelectValue placeholder="Bộ môn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tất cả">Tất cả bộ môn</SelectItem>
              {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Danh sách bài giảng */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          Tài liệu học tập
          {!loading && (
            <span className="text-xs font-normal bg-primary/10 text-primary px-3 py-1 rounded-full">
              {filteredLessons.length} bài đã duyệt
            </span>
          )}
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="glass-card rounded-3xl h-64 animate-pulse bg-gray-100/50" />
          ))
        ) : filteredLessons.length === 0 ? (
          <div className="col-span-full py-20 text-center glass-card rounded-3xl text-gray-400">
            Không tìm thấy bài giảng nào phù hợp.
          </div>
        ) : (
          filteredLessons.map((lesson) => (
            <LessonCard 
              key={lesson.id} 
              lesson={lesson} 
              onClick={() => {
                setSelectedLesson(lesson)
                setIsDetailOpen(true)
              }} 
            />
          ))
        )}
      </div>

      <LessonDetail 
        lesson={selectedLesson} 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
      />
    </MainLayout>
  )
}
