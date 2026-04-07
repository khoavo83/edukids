"use client"

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { createClient } from '@/utils/supabase/client'
import { Plus, Search, Users, Phone, MapPin, Eye, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

export default function StudentsPage() {
  const supabase = createClient()
  const { hasRoleAbove } = useAuth()
  const isAdmin = hasRoleAbove('bgh')
  
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('students')
      .select('*, profiles(full_name, phone)')
      .order('created_at', { ascending: false })
    
    if (data) setStudents(data)
    setLoading(false)
  }

  const filtered = students.filter(s => s.full_name.toLowerCase().includes(search.toLowerCase()))

  return (
    <MainLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Users className="text-primary" size={28} />
            Hồ sơ Bé / Học sinh
          </h1>
          <p className="text-gray-500 mt-1">Quản lý hồ sơ bé và thông tin phụ huynh.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsOpen(true)} className="rounded-xl gap-2 font-bold">
            <Plus size={18} /> Thêm Hồ sơ
          </Button>
        )}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Tìm tên bé..." 
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-primary/20 outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => <div key={i} className="h-40 glass-card rounded-2xl animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-10 text-center text-gray-400 glass-card">Không có dữ liệu học sinh.</div>
        ) : (
          filtered.map(s => (
            <div key={s.id} className="glass-card rounded-2xl p-6 hover:shadow-md transition-shadow relative group">
              <h3 className="font-bold text-lg text-gray-900">{s.full_name} {s.nickname && <span className="text-sm text-gray-400 font-normal">({s.nickname})</span>}</h3>
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                <Users size={14}/> Phụ huynh: {s.profiles?.full_name || 'Chưa gắn'}
              </p>
              {s.profiles?.phone && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <Phone size={14}/> {s.profiles.phone}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="rounded-3xl glass-card sm:max-w-md">
          <DialogHeader><DialogTitle>Thêm Hồ sơ (Tính năng đang nâng cấp)</DialogTitle></DialogHeader>
          <div className="py-4 text-center text-gray-500">
            Form chi tiết đang được hoàn thiện. Vui lòng quay lại sau!
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
