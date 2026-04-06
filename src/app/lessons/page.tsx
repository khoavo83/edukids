"use client"

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { 
  Plus, 
  Search, 
  Filter, 
  UploadCloud, 
  CheckCircle, 
  XCircle, 
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  Play
} from 'lucide-react'
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

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
    file: null as File | null,
    link: '' as string
  })

  useEffect(() => {
    fetchLessons()
    fetchSubjects()

    // Realtime listener cho bảng 'lessons'
    const channel = supabase
      .channel('lessons-page-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lessons' },
        () => {
          fetchLessons(true) // Silent reload: cập nhật dữ liệu ngầm
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchLessons = async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    const { data, error } = await supabase
      .from('lessons')
      .select('*, subjects(title), profiles(full_name, avatar_url)')
      .order('created_at', { ascending: false })
      
    if (error) console.error(error)
    if (data) {
      setLessons(data)
      const uniqueTeachers = Array.from(new Set(data.filter((l: any) => l.profiles).map((l: any) => l.profiles.full_name))) as string[]
      setTeachers(uniqueTeachers)
    }
    if (!isSilent) setLoading(false)
  }

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('id, title')
    if (data) setSubjects(data)
  }

  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async () => {
    if ((!uploadData.file && !uploadData.link) || !uploadData.title || !uploadData.subject_id || !uploadData.grade_level) {
      return alert("Vui lòng nhập đủ Tiêu đề, chọn Môn, Khối và File HOẶC Link đính kèm!")
    }
    setIsUploading(true)

    let publicUrl = ''
    let fileExt = 'unknown'

    if (uploadData.link) {
      publicUrl = uploadData.link
      const isYoutube = uploadData.link.includes('youtube.com') || uploadData.link.includes('youtu.be')
      fileExt = isYoutube ? 'youtube' : 'link'
    } else if (uploadData.file) {
      fileExt = uploadData.file.name.split('.').pop() || 'unknown'
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const { data: storageData, error: storageError } = await supabase.storage
        .from('lessons')
        .upload(fileName, uploadData.file)

      if (storageError) {
        setIsUploading(false)
        console.error(storageError)
        return alert('Lỗi tải tệp lên máy chủ: ' + storageError.message + '\n(Có thể Supabase chưa tạo ổ lưu trữ "lessons")')
      }

      const { data } = supabase.storage.from('lessons').getPublicUrl(fileName)
      publicUrl = data.publicUrl
    }

    // 3. Insert into DB
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error: dbError } = await supabase.from('lessons').insert([{
      title: uploadData.title,
      subject_id: uploadData.subject_id,
      grade_level: uploadData.grade_level,
      file_url: publicUrl,
      file_type: fileExt,
      status: 'pending', // Tình trạng sau khi upload là "chờ phê duyệt"
      teacher_id: user?.id || null 
    }])

    setIsUploading(false)
    if (!dbError) {
      setIsUploadOpen(false)
      setUploadData({ title: '', subject_id: '', grade_level: '', file: null, link: '' })
      alert("Tải bài giảng cấp tốc thành công! Vui lòng chờ Ban giám hiệu phê duyệt.")
      fetchLessons()
    } else {
      alert("Tải lên DB thất bại: " + dbError.message)
    }
  }

  // --- HÀNH ĐỘNG CỦA ADMIN ---
  const handleDelete = async (lessonId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài giảng này vĩnh viễn?')) return;
    setLoading(true)
    
    // Tìm bài giảng để lấy file_url và xóa file trên Storage
    const lessonToDelete = lessons.find((l: any) => l.id === lessonId)
    if (lessonToDelete?.file_url) {
      // Lấy tên file từ URL
      const urlParts = lessonToDelete.file_url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      if (fileName) {
        await supabase.storage.from('lessons').remove([fileName])
      }
    }
    
    const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
    if (!error) {
       await fetchLessons();
    } else {
       alert('Lỗi khi xóa: ' + error.message);
    }
    setLoading(false)
  }

  const handleUpdateStatus = async (lessonId: string, status: string) => {
    setLoading(true)
    const { error } = await supabase.from('lessons').update({ status }).eq('id', lessonId);
    if (!error) {
       fetchLessons();
    } else {
       alert('Lỗi cập nhật trạng thái: ' + error.message);
    }
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
    if (!editLessonData.title || !editLessonData.subject_id) return alert('Thiếu thông tin quan trọng');
    setLoading(true)
    const { error } = await supabase.from('lessons').update({
      title: editLessonData.title,
      subject_id: editLessonData.subject_id,
      grade_level: editLessonData.grade_level
    }).eq('id', editLessonData.id);
    
    if (!error) {
      setIsEditOpen(false)
      fetchLessons()
    } else {
      alert('Lỗi lưu thay đổi: ' + error.message)
    }
  }
  // -------------------------

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

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tài liệu đính kèm (chỉ chọn 1 File HOẶC Link)</Label>
                  <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer relative overflow-hidden ${uploadData.link ? 'opacity-50 pointer-events-none border-gray-200' : 'hover:border-primary/50 border-gray-200'}`}>
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => setUploadData({...uploadData, file: e.target.files?.[0] || null})}
                    />
                    <UploadCloud className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-sm text-gray-500">
                      {uploadData.file ? uploadData.file.name : 'Nhấn để chọn file từ máy tính'}
                    </p>
                  </div>
                </div>

                <div className="relative flex items-center p-2">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink-0 px-4 text-xs text-gray-400 font-bold uppercase tracking-widest">Hoặc</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <div className="space-y-2 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <Label>Gắn Link YouTube / Website</Label>
                  <Input 
                    placeholder="Dán link tại đây (vd: youtube.com/watch?v=...)" 
                    value={uploadData.link}
                    onChange={(e) => setUploadData({...uploadData, link: e.target.value})}
                    disabled={!!uploadData.file}
                    className="bg-white"
                  />
                  {uploadData.file && <p className="text-xs text-amber-500 mt-1">Gỡ bỏ file upload để có thể dán link</p>}
                </div>
              </div>

              <Button onClick={handleUpload} className="w-full rounded-xl mt-4" disabled={(!uploadData.file && !uploadData.link) || isUploading}>
                {isUploading ? 'Đang xử lý, vui lòng chờ...' : 'Bắt đầu tải lên'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal Sửa bài giảng */}
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
                  Lưu thay đổi
                </Button>
              </div>
            )}
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
              {/* Badge status tiếng Việt - đặt dưới chân ảnh */}
              <div className={`absolute bottom-[calc(100%-12rem+8px)] left-3 z-30 px-3 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 shadow-lg border-2 border-white
                  ${lesson.status === 'approved' ? 'bg-green-500 text-white' : 
                    lesson.status === 'pending' ? 'bg-orange-500 text-white' : 'bg-red-500 text-white'}`}>
                  {lesson.status === 'approved' && <CheckCircle size={12} />}
                  {lesson.status === 'pending' && <Clock size={12} />}
                  {lesson.status === 'rejected' && <XCircle size={12} />}
                  {lesson.status === 'approved' ? 'Đã duyệt' : lesson.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
              </div>

              {/* Nút tác vụ (Admin) */}
              <div className="absolute top-4 left-4 z-40 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-white/90 hover:bg-white shadow border border-gray-100">
                      <MoreVertical size={16} className="text-gray-700" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 rounded-2xl glass-card">
                    <DropdownMenuItem className="font-semibold cursor-pointer rounded-xl h-10" onClick={() => handleOpenEdit(lesson)}>
                      <Edit className="mr-2 h-4 w-4 text-blue-500" /> Sửa thông tin
                    </DropdownMenuItem>

                    {lesson.status !== 'approved' && (
                      <DropdownMenuItem className="font-semibold cursor-pointer rounded-xl h-10" onClick={() => handleUpdateStatus(lesson.id, 'approved')}>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Phê duyệt
                      </DropdownMenuItem>
                    )}
                    
                    {lesson.status !== 'rejected' && (
                      <DropdownMenuItem className="font-semibold cursor-pointer rounded-xl h-10" onClick={() => handleUpdateStatus(lesson.id, 'rejected')}>
                        <XCircle className="mr-2 h-4 w-4 text-orange-500" /> Yêu cầu sửa / Từ chối
                      </DropdownMenuItem>
                    )}
                    
                    <div className="h-px bg-gray-100 my-1" />
                    <DropdownMenuItem className="font-semibold text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer rounded-xl h-10" onClick={() => handleDelete(lesson.id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Xóa bài giảng
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
