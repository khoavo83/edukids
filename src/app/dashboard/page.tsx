"use client"

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import LessonCard from '@/components/lessons/LessonCard'
import LessonDetail from '@/components/lessons/LessonDetail'
import TeacherStats from '@/components/dashboard/TeacherStats'
import { Search, Filter, Edit, Trash2, MoreVertical } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'

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

    // Realtime listener
    const channel = supabase
      .channel('dashboard-lessons-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lessons' },
        () => {
          fetchData(true) // Silent reload không nháy màn hình
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    const { data: subjectsData } = await supabase.from('subjects').select('*')
    if (subjectsData) setSubjects(subjectsData)

    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase
      .from('lessons')
      .select('*, subjects(title), profiles(full_name, avatar_url)')
      .order('created_at', { ascending: false })

    if (user) {
      query = query.or(`status.eq.approved,teacher_id.eq.${user.id}`)
    } else {
      query = query.eq('status', 'approved')
    }

    const { data: lessonsData, error } = await query
    
    if (error) console.error(error)
    if (lessonsData) setLessons(lessonsData)
    if (!isSilent) setLoading(false)
  }

  // --- HÀNH ĐỘNG CỦA GIÁO VIÊN (Chỉ sửa/xóa bài pending/rejected) ---
  const handleDelete = async (lessonId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy bài giảng này?')) return;
    setLoading(true)
    
    // Xóa file trên Storage trước
    const lessonToDelete = lessons.find((l: any) => l.id === lessonId)
    if (lessonToDelete?.file_url) {
      const urlParts = lessonToDelete.file_url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      if (fileName) {
        await supabase.storage.from('lessons').remove([fileName])
      }
    }
    
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
    if (!error) {
       await fetchData();
    } else {
       alert('Lỗi: ' + error.message);
    }
    setLoading(false)
  }

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editLessonData, setEditLessonData] = useState<any>(null)
  
  const handleOpenEdit = (lesson: any) => {
    setEditLessonData({
      id: lesson.id,
      title: lesson.title,
      subject_id: lesson.subject_id,
      grade_level: lesson.grade_level
    })
    setIsEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editLessonData.title || !editLessonData.subject_id) return alert('Thiếu thông tin');
    setLoading(true)
    const { error } = await supabase.from('lessons').update({
      title: editLessonData.title,
      subject_id: editLessonData.subject_id,
      grade_level: editLessonData.grade_level,
      status: 'pending' // Chuyển status lại thành chờ duyệt nếu vừa bị từ chối
    }).eq('id', editLessonData.id);
    
    if (!error) {
      setIsEditOpen(false)
      fetchData()
    } else {
      alert('Lỗi: ' + error.message)
    }
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

      {/* Bảng Xếp Hạng Đóng Góp Của Giáo Viên */}
      <TeacherStats lessons={lessons} />

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

      {/* Danh sách bài giảng phân theo Group */}
      <div className="space-y-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="glass-card rounded-3xl h-64 animate-pulse bg-gray-100/50" />
            ))}
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="py-20 text-center glass-card rounded-3xl text-gray-400">
            Không tìm thấy bài giảng nào phù hợp.
          </div>
        ) : (
          <>
            {/* Nhóm Bị từ chối */}
            {filteredLessons.filter(l => l.status === 'rejected').length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-red-500 mb-6 flex items-center gap-2">
                  Bài giảng Yêu cầu Sửa / Bị từ chối
                  <span className="text-xs font-normal bg-red-100/50 text-red-500 px-3 py-1 rounded-full">
                    {filteredLessons.filter(l => l.status === 'rejected').length} bài
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 opacity-90">
                  {filteredLessons.filter(l => l.status === 'rejected').map(lesson => (
                    <div key={lesson.id} className="relative transition-transform hover:-translate-y-1 group">
                      <div className="absolute bottom-[calc(100%-12rem+8px)] left-3 z-30 bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider border-2 border-white">Từ chối</div>
                      
                      {/* Menu tác vụ của tác giả */}
                      <div className="absolute top-4 left-4 z-40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-white/90 hover:bg-white shadow border border-gray-100">
                              <MoreVertical size={16} className="text-gray-700" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-2xl glass-card">
                            <DropdownMenuItem className="font-semibold cursor-pointer rounded-xl h-10" onClick={() => handleOpenEdit(lesson)}>
                              <Edit className="mr-2 h-4 w-4 text-blue-500" /> Sửa bài
                            </DropdownMenuItem>
                            <div className="h-px bg-gray-100 my-1" />
                            <DropdownMenuItem className="font-semibold text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer rounded-xl h-10" onClick={() => handleDelete(lesson.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Nghỉ tải / Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <LessonCard lesson={lesson} onClick={() => { setSelectedLesson(lesson); setIsDetailOpen(true) }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nhóm Chờ duyệt */}
            {filteredLessons.filter(l => l.status === 'pending').length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-orange-500 mb-6 flex items-center gap-2">
                  Bài giảng Đang chờ duyệt
                  <span className="text-xs font-normal bg-orange-100/50 text-orange-500 px-3 py-1 rounded-full">
                    {filteredLessons.filter(l => l.status === 'pending').length} bài
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 opacity-90">
                  {filteredLessons.filter(l => l.status === 'pending').map(lesson => (
                    <div key={lesson.id} className="relative transition-transform hover:-translate-y-1 group">
                      <div className="absolute bottom-[calc(100%-12rem+8px)] left-3 z-30 bg-orange-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider border-2 border-white">Chờ duyệt</div>
                      
                      {/* Menu tác vụ của tác giả */}
                      <div className="absolute top-4 left-4 z-40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-white/90 hover:bg-white shadow border border-gray-100">
                              <MoreVertical size={16} className="text-gray-700" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-2xl glass-card">
                            <DropdownMenuItem className="font-semibold cursor-pointer rounded-xl h-10" onClick={() => handleOpenEdit(lesson)}>
                              <Edit className="mr-2 h-4 w-4 text-blue-500" /> Sửa bài
                            </DropdownMenuItem>
                            <div className="h-px bg-gray-100 my-1" />
                            <DropdownMenuItem className="font-semibold text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer rounded-xl h-10" onClick={() => handleDelete(lesson.id)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Hủy bài
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <LessonCard lesson={lesson} onClick={() => { setSelectedLesson(lesson); setIsDetailOpen(true) }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nhóm Đã duyệt (Kho chung) */}
            {filteredLessons.filter(l => l.status === 'approved').length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  Kho tài liệu Chung
                  <span className="text-xs font-normal bg-primary/10 text-primary px-3 py-1 rounded-full">
                    {filteredLessons.filter(l => l.status === 'approved').length} bài đã duyệt
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {filteredLessons.filter(l => l.status === 'approved').map(lesson => (
                    <div key={lesson.id} className="relative transition-transform hover:-translate-y-1">
                      <div className="absolute bottom-[calc(100%-12rem+8px)] left-3 z-30 bg-green-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider border-2 border-white">Đã duyệt</div>
                      <LessonCard lesson={lesson} onClick={() => { setSelectedLesson(lesson); setIsDetailOpen(true) }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <LessonDetail 
        lesson={selectedLesson} 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
      />

      {/* Modal Sửa bài giảng của Tác giả */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-3xl glass-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sửa thông tin Bài giảng</DialogTitle>
          </DialogHeader>
          {editLessonData && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tiêu đề bài học</Label>
                <Input 
                  value={editLessonData.title}
                  onChange={(e) => setEditLessonData({...editLessonData, title: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bộ môn</Label>
                  <Select value={editLessonData.subject_id} onValueChange={(val) => setEditLessonData({...editLessonData, subject_id: val})}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Chọn môn" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Khối lớp</Label>
                  <Select value={editLessonData.grade_level} onValueChange={(val) => setEditLessonData({...editLessonData, grade_level: val})}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Chọn khối" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeLevels.filter(g => g !== 'Tất cả').map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveEdit} className="w-full rounded-xl">
                Cập nhật thông tin & Gửi lại
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
