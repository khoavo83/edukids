"use client"

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { createClient } from '@/utils/supabase/client'
import { getDirectImageUrl } from '@/lib/utils'
import { Plus, CalendarDays, Trash2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

export default function EventsPage() {
  const supabase = createClient()
  const { hasRoleAbove } = useAuth()
  const isAdmin = hasRoleAbove('bgh')
  
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', image: '', desc: '' })

  useEffect(() => { fetchEvents() }, [])

  const fetchEvents = async () => {
    setLoading(true)
    const { data } = await supabase.from('events').select('*').order('event_date', { ascending: false })
    if (data) setEvents(data)
    setLoading(false)
  }

  const handleSave = async () => {
    if (!form.title || !form.date) return
    await supabase.from('events').insert({
      title: form.title,
      event_date: form.date,
      cover_image: form.image || 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=400',
      description: form.desc
    })
    setIsOpen(false)
    setForm({ title: '', date: '', image: '', desc: '' })
    fetchEvents()
  }

  const handleDelete = async (id: string) => {
    if(!confirm('Xóa sự kiện này?')) return
    await supabase.from('events').delete().eq('id', id)
    fetchEvents()
  }

  return (
    <MainLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3"><CalendarDays className="text-blue-500" /> Quản lý Sự kiện</h1>
          <p className="text-gray-500 mt-1">Lên lịch các sự kiện ngoại khóa, lễ hội cho bé.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsOpen(true)} className="rounded-xl gap-2 font-bold bg-blue-600 hover:bg-blue-700">
            <Plus size={18} /> Thêm sự kiện
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array(4).fill(0).map((_, i) => <div key={i} className="h-64 glass-card rounded-2xl animate-pulse" />)
        ) : events.length === 0 ? (
          <div className="col-span-full py-10 text-center text-gray-400 glass-card">Không có sự kiện nào.</div>
        ) : (
          events.map((e: any) => (
            <div key={e.id} className="glass-card rounded-2xl overflow-hidden group relative">
              <div className="h-32 bg-gray-200 uppercase flex items-center justify-center text-xs overflow-hidden">
                {e.cover_image ? <img src={getDirectImageUrl(e.cover_image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : 'Chưa có ảnh'}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 line-clamp-1">{e.title}</h3>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Clock size={12}/> {new Date(e.event_date).toLocaleDateString('vi-VN')}</p>
              </div>
              {isAdmin && (
                <button onClick={() => handleDelete(e.id)} className="absolute top-2 right-2 p-2 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50">
                  <Trash2 size={16}/>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="rounded-3xl glass-card">
          <DialogHeader><DialogTitle>Thêm Sự Kiện Mới</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Tên sự kiện *</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="rounded-xl" /></div>
            <div className="space-y-2"><Label>Ngày tổ chức *</Label><Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="rounded-xl" /></div>
            <div className="space-y-2"><Label>Link ảnh bìa</Label><Input value={form.image} onChange={e => setForm({...form, image: e.target.value})} className="rounded-xl" placeholder="https://..." /></div>
            <Button onClick={handleSave} className="w-full rounded-xl mt-4">Lưu sự kiện</Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
