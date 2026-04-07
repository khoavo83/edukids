"use client"

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { createClient } from '@/utils/supabase/client'
import { getDirectImageUrl } from '@/lib/utils'
import { Plus, Camera, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

export default function GalleryPage() {
  const supabase = createClient()
  const { hasRoleAbove } = useAuth()
  const isAdmin = hasRoleAbove('bgh')
  
  const [photos, setPhotos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState({ image: '', caption: '' })

  useEffect(() => { fetchPhotos() }, [])

  const fetchPhotos = async () => {
    setLoading(true)
    const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false })
    if (data) setPhotos(data)
    setLoading(false)
  }

  const handleSave = async () => {
    if (!form.image) return
    await supabase.from('gallery').insert({
      image_url: form.image,
      caption: form.caption
    })
    setIsOpen(false)
    setForm({ image: '', caption: '' })
    fetchPhotos()
  }

  const handleDelete = async (id: string) => {
    if(!confirm('Xóa ảnh này?')) return
    await supabase.from('gallery').delete().eq('id', id)
    fetchPhotos()
  }

  return (
    <MainLayout>
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3"><Camera className="text-pink-500" /> Thư viện Ảnh</h1>
          <p className="text-gray-500 mt-1">Lưu giữ khoảnh khắc không gian trường và hoạt động của bé.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsOpen(true)} className="rounded-xl gap-2 font-bold bg-pink-500 hover:bg-pink-600">
            <Plus size={18} /> Thêm ảnh
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {loading ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="aspect-square glass-card rounded-2xl animate-pulse" />)
        ) : photos.length === 0 ? (
          <div className="col-span-full py-10 text-center text-gray-400 glass-card">Thư viện trống.</div>
        ) : (
          photos.map((p: any) => (
            <div key={p.id} className="aspect-square rounded-2xl overflow-hidden group relative bg-gray-100">
              <img src={getDirectImageUrl(p.image_url)} alt={p.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <p className="text-white text-xs line-clamp-2">{p.caption || 'Không có chú thích'}</p>
              </div>
              {isAdmin && (
                <button onClick={() => handleDelete(p.id)} className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50">
                  <Trash2 size={14}/>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="rounded-3xl glass-card sm:max-w-sm">
          <DialogHeader><DialogTitle>Thêm Ảnh Mới</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Link ảnh *</Label><Input value={form.image} onChange={e => setForm({...form, image: e.target.value})} className="rounded-xl" placeholder="https://..." /></div>
            <div className="space-y-2"><Label>Chú thích</Label><Input value={form.caption} onChange={e => setForm({...form, caption: e.target.value})} className="rounded-xl" /></div>
            <Button onClick={handleSave} className="w-full rounded-xl mt-4">Tải lên</Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
