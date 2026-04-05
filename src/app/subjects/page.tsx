"use client"

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { Plus, Edit2, Archive, Trash2, Search, MoreVertical, BookOpen } from 'lucide-react'
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

export default function SubjectsPage() {
  const supabase = createClient()
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newSubject, setNewSubject] = useState({ title: '', description: '', icon: 'BookOpen' })

  // Lấy danh sách bộ môn
  const fetchSubjects = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) setSubjects(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  // Thêm mới bộ môn
  const handleAddSubject = async () => {
    const { data, error } = await supabase
      .from('subjects')
      .insert([newSubject])
      .select()

    if (!error) {
      setSubjects([data[0], ...subjects])
      setNewSubject({ title: '', description: '', icon: 'BookOpen' })
      setIsDialogOpen(false)
    }
  }

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Danh mục Bộ môn</h1>
          <p className="text-gray-500">Tùy chỉnh danh sách các môn học trong trường.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2 font-semibold shadow-lg shadow-primary/20">
              <Plus size={20} />
              Tạo bộ môn mới
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl glass-card">
            <DialogHeader>
              <DialogTitle>Thêm Bộ môn Mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tên bộ môn</Label>
                <Input 
                  id="title" 
                  placeholder="Ví dụ: Toán tư duy, Âm nhạc..." 
                  value={newSubject.title}
                  onChange={(e) => setNewSubject({...newSubject, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Mô tả ngắn</Label>
                <Input 
                  id="desc" 
                  placeholder="Mô tả về nội dung môn học" 
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({...newSubject, description: e.target.value})}
                />
              </div>
              <Button onClick={handleAddSubject} className="w-full rounded-xl">Lưu bộ môn</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-20 text-gray-400">Đang tải dữ liệu...</div>
        ) : subjects.length === 0 ? (
          <div className="col-span-full glass-card rounded-3xl p-10 text-center text-gray-500">
            Chưa có bộ môn nào được tạo.
          </div>
        ) : (
          subjects.map((subject) => (
            <div key={subject.id} className="glass-card rounded-3xl p-6 group transition-all duration-200 hover:shadow-xl hover:shadow-primary/5">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center">
                  <BookOpen size={24} />
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreVertical size={20} />
                </button>
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                {subject.title}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                {subject.description || 'Không có mô tả'}
              </p>
              
              <div className="mt-6 pt-4 border-t border-gray-50 flex gap-2">
                <Button variant="ghost" size="sm" className="rounded-lg gap-1 text-gray-500">
                  <Edit2 size={14} /> Sửa
                </Button>
                <Button variant="ghost" size="sm" className="rounded-lg gap-1 text-gray-500 hover:text-orange-500">
                  <Archive size={14} /> Ẩn
                </Button>
                <Button variant="ghost" size="sm" className="rounded-lg gap-1 text-gray-500 hover:text-red-500 ml-auto">
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </MainLayout>
  )
}
