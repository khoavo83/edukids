"use client"

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { Plus, Filter, FileText, Play, CheckCircle, Clock, XCircle, Search, UploadCloud } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import LessonCard from '@/components/lessons/LessonCard'
import LessonDetail from '@/components/lessons/LessonDetail'
import { Badge } from '@/components/ui/badge'

const gradeLevels = ['Tất cả', 'Nhà trẻ', 'Mầm', 'Chồi', 'Lá']

export default function LessonsPage() {
  const supabase = createClient()
  const [lessons, setLessons] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [teachers, setTeachers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  
  const [filters, setFilters] = useState({
    search: '',
    grade: 'Tất cả',
    teacher: 'Tất cả'
  })
  const [uploadData, setUploadData] = useState({
    title: '',
    subject_id: '',
    grade_level: '',
    file: null as File | null
  })

  useEffect(() => {
    fetchLessons()
    fetchSubjects()
  }, [])

  const fetchLessons = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('lessons')
      .select('*, subjects(title), profiles:teacher_id(full_name, avatar_url)')
      .order('created_at', { ascending: false })
      
    if (data) {
      setLessons(data)
      const uniqueTeachers = Array.from(new Set(data.filter((l: any) => l.profiles).map((l: any) => l.profiles.full_name))) as string[]
      setTeachers(uniqueTeachers)
    }
    setLoading(false)
  }

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('id, title')
    if (data) setSubjects(data)
  }

  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.subject_id || !uploadData.grade_level) {
      return alert("Vui lòng nhập đủ Tiêu đề, chọn Môn, Khối và File đính kèm!")
    }
    setIsUploading(true)

    // 1. Upload to Storage
    const fileExt = uploadData.file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const { data: storageData, error: storageError } = await supabase.storage
      .from('lessons')
      .upload(fileName, uploadData.file)

    if (storageError) {
      setIsUploading(false)
      console.error(storageError)
      return alert('Lỗi tải tệp lên máy chủ: ' + storageError.message + '\n(Có thể Supabase chưa tạo ổ lưu trữ "lessons")')
    }

    // 2. Save public URL
    const { data: { publicUrl } } = supabase.storage.from('lessons').getPublicUrl(fileName)

    // 3. Insert into DB
    const { error: dbError } = await supabase.from('lessons').insert([{
      title: uploadData.title,
      subject_id: uploadData.subject_id,
      grade_level: uploadData.grade_level,
      file_url: publicUrl,
      file_type: fileExt,
      status: 'pending' // Tình trạng sau khi upload là "chờ phê duyệt"
    }])

    setIsUploading(false)
    if (!dbError) {
      setIsUploadOpen(false)
      setUploadData({ title: '', subject_id: '', grade_level: '', file: null })
      alert("Tải bài giảng cấp tốc thành công! Vui lòng chờ Ban giám hiệu phê duyệt.")
      fetchLessons()
    } else {
      alert("Tải lên DB thất bại: " + dbError.message)
    }
  }

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = lesson.title.toLowerCase().includes(filters.search.toLowerCase())
    const matchesGrade = filters.grade === 'Tất cả' || lesson.grade_level === filters.grade
    const matchesTeacher = filters.teacher === 'Tất cả' || lesson.profiles?.full_name === filters.teacher
    return matchesSearch && matchesGrade && matchesTeacher
  })

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kho bài giảng</h1>
          <p className="text-gray-500">Quản lý và theo dõi trạng thái các bài giảng của giáo viên.</p>
        </div>
        
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2 font-semibold">
              <UploadCloud size={20} />
              Tải bài giảng mới
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl glass-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tải Bài giảng Lên Hệ thống</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tiêu đề bài học</Label>
                <Input 
                  placeholder="Ví dụ: Bé tập vẽ con mèo..." 
                  value={uploadData.title}
                  onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bộ môn</Label>
                  <Select onValueChange={(val) => setUploadData({...uploadData, subject_id: val})}>
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
                  <Select onValueChange={(val) => setUploadData({...uploadData, grade_level: val})}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Chọn khối" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeLevels.filter(g => g !== 'Tất cả').map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tài liệu (Video, PDF, Hình ảnh...)</Label>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer relative overflow-hidden">
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => setUploadData({...uploadData, file: e.target.files?.[0] || null})}
                  />
                  <UploadCloud className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-sm text-gray-500">
                    {uploadData.file ? uploadData.file.name : 'Nhấn để chọn file hoặc kéo thả vào đây'}
                  </p>
                </div>
              </div>

              <Button onClick={handleUpload} className="w-full rounded-xl" disabled={!uploadData.file || isUploading}>
                {isUploading ? 'Đang xử lý, vui lòng chờ...' : 'Bắt đầu tải lên'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bộ lọc đa tầng (Multi-level Filter) */}
      <div className="flex flex-col md:flex-row gap-4 mb-10 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Tìm kiếm bài giảng..." 
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-primary/20 outline-none"
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>
        <div className="flex gap-3">
          <Select onValueChange={(val) => setFilters({...filters, grade: val})}>
            <SelectTrigger className="w-[150px] rounded-2xl bg-white border-gray-100 h-12 shadow-sm text-gray-600">
              <Filter className="mr-2" size={16} />
              <SelectValue placeholder="Khối lớp" />
            </SelectTrigger>
            <SelectContent>
              {gradeLevels.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select onValueChange={(val) => setFilters({...filters, teacher: val})}>
            <SelectTrigger className="w-[180px] rounded-2xl bg-white border-gray-100 h-12 shadow-sm text-gray-600">
              <Filter className="mr-2" size={16} />
              <SelectValue placeholder="Giáo viên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tất cả">Tất cả giáo viên</SelectItem>
              {teachers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid bài giảng */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="glass-card rounded-3xl h-64 animate-pulse bg-gray-100/50" />
          ))
        ) : filteredLessons.length === 0 ? (
          <div className="col-span-full py-20 text-center glass-card rounded-3xl text-gray-400">
            Không tìm thấy bài giảng nào.
          </div>
        ) : (
          filteredLessons.map((lesson) => (
            <div key={lesson.id} className="relative group hover:-translate-y-1 transition-transform">
              {/* Badge status nổi bật */}
              <div className={`absolute -top-3 -right-3 z-20 px-3 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 shadow-lg ring-4 ring-white
                  ${lesson.status === 'approved' ? 'bg-green-500 text-white' : 
                    lesson.status === 'pending' ? 'bg-orange-500 text-white' : 'bg-red-500 text-white'}`}>
                  {lesson.status === 'approved' && <CheckCircle size={12} />}
                  {lesson.status === 'pending' && <Clock size={12} />}
                  {lesson.status === 'rejected' && <XCircle size={12} />}
                  {lesson.status}
              </div>
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

      <LessonDetail 
        lesson={selectedLesson} 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
      />
    </MainLayout>
  )
}
