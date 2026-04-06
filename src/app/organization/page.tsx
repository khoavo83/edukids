"use client"

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { Plus, Edit2, Archive, Trash2, MoreVertical, BookOpen, Users, GraduationCap, Layout, Save, X } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const GRADE_LEVELS = ['Khối Nhà trẻ', 'Khối Mầm', 'Khối Chồi', 'Khối Lá']

export default function OrganizationPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects' | 'teachers'>('classes')
  
  // Data States
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // CREATE States & Dialogs
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false)
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false)
  const [newClass, setNewClass] = useState({ name: '', grade_level: 'Khối Mầm', teacher_id: '' })
  const [newSubject, setNewSubject] = useState({ title: '', description: '', icon: 'BookOpen' })

  // EDIT States & Dialogs
  const [editClassDialog, setEditClassDialog] = useState(false)
  const [editSubjectDialog, setEditSubjectDialog] = useState(false)
  const [editProfileDialog, setEditProfileDialog] = useState(false)
  
  const [editingClass, setEditingClass] = useState<any>(null)
  const [editingSubject, setEditingSubject] = useState<any>(null)
  const [editingProfile, setEditingProfile] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: subjectData } = await supabase.from('subjects').select('*').order('created_at', { ascending: false })
    if (subjectData) setSubjects(subjectData)

    const { data: profileData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    if (profileData) setProfiles(profileData)

    const { data: classData } = await supabase.from('classes').select('*, profiles:teacher_id(full_name)').order('grade_level', { ascending: true })
    if (classData) setClasses(classData)

    setLoading(false)
  }

  // --- HANDLERS LỚP HỌC ---
  const handleAddClass = async () => {
    if (!newClass.name) return alert('Tên lớp không được để trống')
    const payload = { name: newClass.name, grade_level: newClass.grade_level, teacher_id: newClass.teacher_id || null }
    const { data, error } = await supabase.from('classes').insert([payload]).select('*, profiles:teacher_id(full_name)')
    if (!error && data) {
      setClasses([...classes, data[0]])
      setIsClassDialogOpen(false)
      setNewClass({ name: '', grade_level: 'Khối Mầm', teacher_id: '' })
    } else alert('Lỗi: ' + error?.message)
  }

  const handleUpdateClass = async () => {
    if (!editingClass.name) return alert('Tên lớp không được mở trống')
    const payload = { name: editingClass.name, grade_level: editingClass.grade_level, teacher_id: editingClass.teacher_id || null }
    const { data, error } = await supabase.from('classes').update(payload).eq('id', editingClass.id).select('*, profiles:teacher_id(full_name)')
    
    if (!error && data) {
      setClasses(classes.map(c => c.id === editingClass.id ? data[0] : c))
      setEditClassDialog(false)
    } else alert('Lỗi: ' + error?.message)
  }

  const handleDeleteClass = async (id: string) => {
    if(!confirm('Bạn có chắc chắn muốn xoá lớp này? Mọi dữ liệu liên quan có thể bị ảnh hưởng.')) return
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
    } else alert('Lỗi: ' + error?.message)
  }

  const handleUpdateSubject = async () => {
    if (!editingSubject.title) return alert('Tên môn không được trống')
    const payload = { title: editingSubject.title, description: editingSubject.description }
    const { data, error } = await supabase.from('subjects').update(payload).eq('id', editingSubject.id).select()
    
    if (!error && data) {
      setSubjects(subjects.map(s => s.id === editingSubject.id ? data[0] : s))
      setEditSubjectDialog(false)
    } else alert('Lỗi: ' + error?.message)
  }

  const handleDeleteSubject = async (id: string) => {
    if(!confirm('Bạn có chắc chắn muốn xoá môn này?')) return
    const { error } = await supabase.from('subjects').delete().eq('id', id)
    if (!error) setSubjects(subjects.filter(s => s.id !== id))
  }

  // --- HANDLERS USER/GIÁO VIÊN ---
  const handleToggleRole = async (profileId: string, currentRole: string) => {
    const newRole = currentRole === 'teacher' ? 'parent' : 'teacher' 
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profileId)
    if (!error) {
      setProfiles(profiles.map(p => p.id === profileId ? { ...p, role: newRole } : p))
    }
  }

  const handleUpdateProfile = async () => {
    if (!editingProfile.full_name) return alert('Tên không được lể trống')
    const { error } = await supabase.from('profiles').update({ full_name: editingProfile.full_name }).eq('id', editingProfile.id)
    if (!error) {
      setProfiles(profiles.map(p => p.id === editingProfile.id ? { ...p, full_name: editingProfile.full_name } : p))
      setEditProfileDialog(false)
    } else alert('Lỗi cập nhật tên: ' + error.message)
  }

  const handleDeleteProfile = async (id: string) => {
    if(!confirm('Cảnh báo nguy hiểm: Xoá tài khoản này sẽ xoá luôn các bình luận và dữ liệu liên quan. Vẫn xoá?')) return
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (!error) setProfiles(profiles.filter(p => p.id !== id))
    else alert('Không thể xoá hồ sơ: Không đủ quyền Auth RLS hoặc vướng khoá ngoại.')
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
                        <Label>Nhóm khối</Label>
                        <select className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm" value={newClass.grade_level} onChange={e => setNewClass({...newClass, grade_level: e.target.value})}>
                          {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Giáo viên đứng lớp (Tuỳ chọn)</Label>
                        <select className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm" value={newClass.teacher_id} onChange={e => setNewClass({...newClass, teacher_id: e.target.value})}>
                          <option value="">-- Chưa phân công --</option>
                          {getTeachersList().map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                        </select>
                      </div>
                      <Button onClick={handleAddClass} className="w-full rounded-xl">Lưu danh sách</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-10">
                {classes.length === 0 ? (
                  <div className="glass-card rounded-3xl p-10 text-center text-gray-500">Chưa thiết lập Lớp học nào.</div>
                ) : (
                  <>
                    {GRADE_LEVELS.map(level => {
                      const levelClasses = classes.filter(c => c.grade_level === level)
                      if (levelClasses.length === 0) return null
                      
                      return (
                        <div key={level} className="space-y-4">
                          <h2 className="text-xl font-black text-gray-800 border-b-2 border-primary/20 pb-2 inline-block px-1">🏫 {level}</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {levelClasses.map(c => (
                              <div key={c.id} className="glass-card rounded-3xl p-6 group transition-all duration-200 border-t-4 border-t-primary hover:shadow-xl hover:shadow-primary/10 bg-white/70">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{c.grade_level}</span>
                                  <div className="flex gap-2">
                                    <button onClick={() => { setEditingClass(c); setEditClassDialog(true); }} className="text-gray-300 hover:text-blue-500 transition-colors">
                                      <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteClass(c.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">{c.name}</h3>
                                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                                  <Users size={16} className="text-primary" />
                                  <span className="text-sm text-gray-600 font-medium">Giáo viên: {c.profiles?.full_name || 'Chưa phân công'}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}

                    {/* DỮ LIỆU CŨ LỆCH CHUẨN */}
                    {classes.filter(c => !GRADE_LEVELS.includes(c.grade_level)).length > 0 && (
                      <div className="space-y-4 mt-12 p-6 bg-red-50/50 rounded-3xl border border-red-100 border-dashed">
                        <h2 className="text-xl font-black text-red-600 pb-2 inline-block px-1">⚠️ Dữ liệu cũ (Cần cập nhật danh mục)</h2>
                        <p className="text-sm text-gray-500 mb-4">Các lớp này được lưu bằng chuẩn phân loại cũ, vui lòng bấm Sửa và chọn lại nhóm Khối mới.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {classes.filter(c => !GRADE_LEVELS.includes(c.grade_level)).map(c => (
                            <div key={c.id} className="glass-card rounded-3xl p-6 group transition-all duration-200 border-t-4 border-t-red-400 hover:shadow-xl hover:shadow-red-500/10 bg-white/70">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-red-400 uppercase tracking-widest">{c.grade_level}</span>
                                <div className="flex gap-2">
                                  <button onClick={() => { setEditingClass(c); setEditClassDialog(true); }} className="text-gray-300 hover:text-blue-500 transition-colors">
                                    <Edit2 size={16} />
                                  </button>
                                  <button onClick={() => handleDeleteClass(c.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 mb-4">{c.name}</h3>
                              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                                <Users size={16} className="text-primary" />
                                <span className="text-sm text-gray-600 font-medium">Giáo viên: {c.profiles?.full_name || 'Chưa phân'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Edit Class */}
              <Dialog open={editClassDialog} onOpenChange={setEditClassDialog}>
                <DialogContent className="rounded-3xl glass-card">
                  <DialogHeader><DialogTitle>Cập nhật thông tin Lớp</DialogTitle></DialogHeader>
                  {editingClass && (
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Tên lớp</Label>
                        <Input value={editingClass.name} onChange={e => setEditingClass({...editingClass, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Nhóm khối</Label>
                        <select className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm" value={editingClass.grade_level} onChange={e => setEditingClass({...editingClass, grade_level: e.target.value})}>
                          {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Giáo viên đứng lớp</Label>
                        <select className="w-full h-10 px-3 rounded-md border border-input bg-transparent text-sm" value={editingClass.teacher_id || ''} onChange={e => setEditingClass({...editingClass, teacher_id: e.target.value})}>
                          <option value="">-- Chưa phân công --</option>
                          {getTeachersList().map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                        </select>
                      </div>
                      <Button onClick={handleUpdateClass} className="w-full rounded-xl gap-2"><Save size={16}/> Lưu thay đổi</Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
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
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingSubject(s); setEditSubjectDialog(true); }} className="text-gray-300 hover:text-blue-500 transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDeleteSubject(s.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{s.description || 'Không mô tả'}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Edit Subject */}
              <Dialog open={editSubjectDialog} onOpenChange={setEditSubjectDialog}>
                <DialogContent className="rounded-3xl glass-card">
                  <DialogHeader><DialogTitle>Cập nhật Lĩnh vực chuyên môn</DialogTitle></DialogHeader>
                  {editingSubject && (
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Tên bộ môn</Label>
                        <Input value={editingSubject.title} onChange={e => setEditingSubject({...editingSubject, title: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Mô tả ngắn</Label>
                        <Input value={editingSubject.description || ''} onChange={e => setEditingSubject({...editingSubject, description: e.target.value})} />
                      </div>
                      <Button onClick={handleUpdateSubject} className="w-full rounded-xl bg-secondary hover:bg-secondary/90 gap-2"><Save size={16}/> Cập nhật</Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* TAB 3: NGƯỜI DÙNG & TÀI KHOẢN */}
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
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                          {p.full_name}
                          <button onClick={() => { setEditingProfile(p); setEditProfileDialog(true); }} className="text-gray-300 hover:text-blue-500">
                            <Edit2 size={14} />
                          </button>
                        </h4>
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
                    
                    <div className="flex items-center gap-3">
                      {p.role !== 'admin' && (
                        <>
                          <Button 
                            variant={p.role === 'teacher' ? 'outline' : 'default'}
                            size="sm"
                            className={`rounded-xl gap-2 font-bold ${p.role === 'teacher' ? 'border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600' : 'shadow-md shadow-primary/20'}`}
                            onClick={() => handleToggleRole(p.id, p.role)}
                          >
                            {p.role === 'teacher' ? 'Huỷ cấp Giáo viên' : 'Phân làm Giáo viên'}
                          </Button>
                          <button onClick={() => handleDeleteProfile(p.id)} className="w-9 h-9 flex items-center justify-center bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Edit Profile */}
              <Dialog open={editProfileDialog} onOpenChange={setEditProfileDialog}>
                <DialogContent className="rounded-3xl glass-card">
                  <DialogHeader><DialogTitle>Chỉnh sửa Hồ sơ Thành viên</DialogTitle></DialogHeader>
                  {editingProfile && (
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Tên hiển thị (Tên đầy đủ)</Label>
                        <Input value={editingProfile.full_name} onChange={e => setEditingProfile({...editingProfile, full_name: e.target.value})} />
                        <p className="text-xs text-gray-400 mt-1">Admin có thể thay đổi họ tên của thành viên cho chính xác.</p>
                      </div>
                      <Button onClick={handleUpdateProfile} className="w-full rounded-xl gap-2"><Save size={16}/> Lưu thay đổi</Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          )}
        </>
      )}
    </MainLayout>
  )
}
