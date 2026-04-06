"use client"

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { Plus, Edit2, Archive, Trash2, MoreVertical, BookOpen, Users, GraduationCap, Layout } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const GRADE_LEVELS = ['Nhà trẻ', 'Lớp Mầm', 'Lớp Chồi', 'Lớp Lá']

export default function OrganizationPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects' | 'teachers'>('classes')
  
  // Data States
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog States
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false)
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false)

  // Form States
  const [newClass, setNewClass] = useState({ name: '', grade_level: 'Lớp Mầm', teacher_id: '' })
  const [newSubject, setNewSubject] = useState({ title: '', description: '', icon: 'BookOpen' })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    // Lấy môn học
    const { data: subjectData } = await supabase.from('subjects').select('*').order('created_at', { ascending: false })
    if (subjectData) setSubjects(subjectData)

    // Lấy hồ sơ (tất cả người dùng để dễ thăng cấp)
    const { data: profileData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (profileData) setProfiles(profileData)

    // Lấy lớp học (join với hồ sơ để lấy tên GVCN)
    const { data: classData } = await supabase.from('classes').select('*, profiles:teacher_id(full_name)').order('grade_level', { ascending: true })
    if (classData) setClasses(classData)

    setLoading(false)
  }

  // --- HANDLERS LỚP HỌC ---
  const handleAddClass = async () => {
    if (!newClass.name) return alert('Tên lớp không được để trống')
    const payload = {
      name: newClass.name,
      grade_level: newClass.grade_level,
      teacher_id: newClass.teacher_id || null
    }

    const { data, error } = await supabase.from('classes').insert([payload]).select('*, profiles:teacher_id(full_name)')
    if (!error && data) {
      setClasses([...classes, data[0]])
      setIsClassDialogOpen(false)
      setNewClass({ name: '', grade_level: 'Lớp Mầm', teacher_id: '' })
    } else {
      alert('Lỗi: ' + error?.message)
    }
  }

  const handleDeleteClass = async (id: string) => {
    if(!confirm('Bạn có chắc chắn muốn xoá lớp này?')) return
    const { error } = await supabase.from('classes').delete().eq('id', id)
    if (!error) setClasses(classes.filter(c => c.id !== id))
  }

  // --- HANDLERS BỘ MÔN ---
  const handleAddSubject = async () => {
    if (!newSubject.title) return alert('Tên môn không được trống')
    const { data, error } = await supabase.from('subjects').insert([newSubject]).select()
    if (!error && data) {
      setSubjects([data[0], ...subjects])
      setIsSubjectDialogOpen(false)
      setNewSubject({ title: '', description: '', icon: 'BookOpen' })
    } else {
      alert('Lỗi: ' + error?.message)
    }
  }

  const handleDeleteSubject = async (id: string) => {
    if(!confirm('Bạn có chắc chắn muốn xoá môn này?')) return
    const { error } = await supabase.from('subjects').delete().eq('id', id)
    if (!error) setSubjects(subjects.filter(s => s.id !== id))
  }

  // --- HANDLERS GIÁO VIÊN ---
  const handleToggleRole = async (profileId: string, currentRole: string) => {
    const newRole = currentRole === 'teacher' ? 'parent' : 'teacher' // Đảo ngược giữa phụ huynh và giáo viên
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profileId)
    if (!error) {
      setProfiles(profiles.map(p => p.id === profileId ? { ...p, role: newRole } : p))
    }
  }

  const getTeachersList = () => profiles.filter(p => p.role === 'teacher' || p.role === 'admin')

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tổ Chức Trường Học</h1>
        <p className="text-gray-500">Hệ thống quản lý thông tin Danh mục lớp, Môn học và Giáo viên.</p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 mb-8 bg-gray-50 p-1.5 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'classes' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <Layout size={18} /> Danh sách Lớp
        </button>
        <button 
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'subjects' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <BookOpen size={18} /> Bộ môn
        </button>
        <button 
          onClick={() => setActiveTab('teachers')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'teachers' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <GraduationCap size={18} /> Cấp quyền Giáo viên
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-gray-400">Đang đồng bộ dữ liệu...</div>
      ) : (
        <>
          {/* TAB 1: DANH SÁCH LỚP HỌC */}
          {activeTab === 'classes' && (
            <div>
              <div className="flex justify-end mb-6">
                <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl gap-2 font-semibold shadow-lg shadow-primary/20">
                      <Plus size={20} /> Tạo lớp học mới
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-3xl glass-card">
                    <DialogHeader>
                      <DialogTitle>Mở lớp học mới</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Tên lớp</Label>
                        <Input placeholder="Ví dụ: Lớp Mầm 1" value={newClass.name} onChange={e => setNewClass({...newClass, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Nhóm khối (Level)</Label>
                        <select 
                          className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
                          value={newClass.grade_level} 
                          onChange={e => setNewClass({...newClass, grade_level: e.target.value})}
                        >
                          {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Giáo viên đứng lớp (Tuỳ chọn)</Label>
                        <select 
                          className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm"
                          value={newClass.teacher_id} 
                          onChange={e => setNewClass({...newClass, teacher_id: e.target.value})}
                        >
                          <option value="">-- Chưa phân công --</option>
                          {getTeachersList().map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                        </select>
                      </div>
                      <Button onClick={handleAddClass} className="w-full rounded-xl">Lưu danh sách</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.length === 0 ? (
                  <div className="col-span-full glass-card rounded-3xl p-10 text-center text-gray-500">Chưa thiết lập Lớp học nào.</div>
                ) : (
                  classes.map(c => (
                    <div key={c.id} className="glass-card rounded-3xl p-6 group transition-all duration-200 border-t-4 border-t-primary">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{c.grade_level}</span>
                        <button onClick={() => handleDeleteClass(c.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">{c.name}</h3>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                        <Users size={16} className="text-primary" />
                        <span className="text-sm text-gray-600 font-medium">Giáo viên: {c.profiles?.full_name || 'Chưa phân công'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: QUẢN LÝ BỘ MÔN */}
          {activeTab === 'subjects' && (
            <div>
              <div className="flex justify-end mb-6">
                <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl gap-2 font-semibold shadow-lg shadow-primary/20 bg-secondary hover:bg-secondary/90">
                      <Plus size={20} /> Tạo bộ môn
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-3xl glass-card">
                    <DialogHeader>
                      <DialogTitle>Thêm Bộ môn Mới</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Tên bộ môn</Label>
                        <Input placeholder="Ví dụ: Toán tư duy" value={newSubject.title} onChange={e => setNewSubject({...newSubject, title: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Mô tả ngắn</Label>
                        <Input placeholder="Mô tả về nội dung môn" value={newSubject.description} onChange={e => setNewSubject({...newSubject, description: e.target.value})} />
                      </div>
                      <Button onClick={handleAddSubject} className="w-full rounded-xl bg-secondary hover:bg-secondary/90">Lưu bộ môn</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.length === 0 ? (
                  <div className="col-span-full glass-card rounded-3xl p-10 text-center text-gray-500">Chưa có bộ môn nào được tạo.</div>
                ) : (
                  subjects.map(s => (
                    <div key={s.id} className="glass-card rounded-3xl p-6 group transition-all duration-200">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center">
                          <BookOpen size={24} />
                        </div>
                        <button onClick={() => handleDeleteSubject(s.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{s.description || 'Không mô tả'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CẤP QUYỀN GIÁO VIÊN */}
          {activeTab === 'teachers' && (
            <div className="glass-card rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-white/50">
                <h3 className="font-bold text-gray-900">Danh sách Tài khoản & Phân quyền</h3>
                <p className="text-sm text-gray-500 mt-1">Hệ thống có {profiles.length} người dùng khởi tạo.</p>
              </div>
              <div className="divide-y divide-gray-50">
                {profiles.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-6 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-lg">
                        {p.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{p.full_name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md ${
                            p.role === 'admin' ? 'bg-red-100 text-red-600' : 
                            p.role === 'teacher' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {p.role === 'admin' ? 'Quản trị viên' : p.role === 'teacher' ? 'Giáo viên' : 'Phụ huynh'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {p.role !== 'admin' && (
                      <Button 
                        variant={p.role === 'teacher' ? 'outline' : 'default'}
                        className={`rounded-xl gap-2 font-bold ${p.role === 'teacher' ? 'border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600' : 'shadow-md shadow-primary/20'}`}
                        onClick={() => handleToggleRole(p.id, p.role)}
                      >
                        {p.role === 'teacher' ? 'Huỷ cấp Giáo viên' : 'Phân làm Giáo viên'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </MainLayout>
  )
}
