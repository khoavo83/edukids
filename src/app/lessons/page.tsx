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

const gradeLevels = ['Nhà trẻ', 'Mầm', 'Chồi', 'Lá']

export default function LessonsPage() {
  const supabase = createClient()
  const [lessons, setLessons] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
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
    const { data } = await supabase
      .from('lessons')
      .select('*, subjects(title)')
      .order('created_at', { ascending: false })
    if (data) setLessons(data)
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

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8">
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
                      {gradeLevels.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
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

      {/* Grid bài giảng */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-400">Chưa có bài giảng nào.</div>
        ) : (
          lessons.map((lesson) => (
            <div key={lesson.id} className="glass-card rounded-3xl p-6 relative overflow-hidden group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600">
                  {lesson.file_type === 'mp4' ? <Play size={20} /> : <FileText size={20} />}
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1
                  ${lesson.status === 'approved' ? 'bg-green-100 text-green-600' : 
                    lesson.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                  {lesson.status === 'approved' && <CheckCircle size={10} />}
                  {lesson.status === 'pending' && <Clock size={10} />}
                  {lesson.status === 'rejected' && <XCircle size={10} />}
                  {lesson.status}
                </div>
              </div>
              
              <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{lesson.title}</h3>
              <div className="mt-2 flex gap-4 text-xs text-gray-400 font-medium">
                <span>{lesson.subjects?.title}</span>
                <span>•</span>
                <span>{lesson.grade_level}</span>
              </div>
              
              <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 transition-opacity">
                {lesson.file_type === 'mp4' ? <Play size={80} /> : <FileText size={80} />}
              </div>
            </div>
          ))
        )}
      </div>
    </MainLayout>
  )
}
