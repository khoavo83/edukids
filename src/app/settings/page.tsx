"use client"

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { Save, School, Palette, Image as ImageIcon, Globe, Trash2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getDirectImageUrl } from '@/lib/utils'
import { Label } from '@/components/ui/label'

export default function SettingsPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState<any>({
    school_name: 'Trường Mầm Non EduKids',
    theme_color: '#ff6b6b',
    logo_url: '',
    favicon_url: ''
  })
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('school_settings')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()
    
    // Nếu có dữ liệu thì load, ngược lại giữ nguyên default state nhưng sẽ không có id
    if (!error && data) {
      setSettings(data)
    }
    setLoading(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    let errorMsg = null

    if (settings.id) {
      // Cập nhật record hiện tại
      const { error } = await supabase
        .from('school_settings')
        .update({
          school_name: settings.school_name,
          theme_color: settings.theme_color,
          logo_url: settings.logo_url,
          favicon_url: settings.favicon_url
        })
        .eq('id', settings.id)
      errorMsg = error
    } else {
      // Tạo mới nếu chưa có cài đặt nào
      const { data, error } = await supabase
        .from('school_settings')
        .insert([{
          school_name: settings.school_name,
          theme_color: settings.theme_color,
          logo_url: settings.logo_url,
          favicon_url: settings.favicon_url
        }])
        .select()
        .single()
      
      if (data) setSettings(data) // cập nhật lại để có id
      errorMsg = error
    }
    
    setIsSaving(false)
    if (!errorMsg) {
      alert('Cài đặt đã được lưu thành công!')
      window.location.reload() // Cập nhật lại toàn trang để áp dụng
    } else {
      alert('Lỗi lưu cấu hình: ' + errorMsg.message)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'favicon_url') => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Cảnh báo: Kích thước file lớn hơn 2MB có thể quá nặng để lưu. Vui lòng chọn ảnh nhỏ hơn.')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setSettings({ ...settings, [field]: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  if (loading) return <MainLayout><div className="pt-20 text-center">Đang tải cấu hình...</div></MainLayout>

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cấu hình Hệ thống</h1>
        <p className="text-gray-500">Tùy biến thương hiệu và thông tin cơ bản của trường.</p>
      </div>

      <div className="max-w-3xl space-y-6">
        <div className="glass-card rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <School size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Thương hiệu Trường</h2>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="school_name">Tên trường hiển thị *</Label>
              <Input 
                id="school_name" 
                value={settings.school_name || ''}
                onChange={(e) => setSettings({...settings, school_name: e.target.value})}
                className="rounded-xl h-12"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Màu chủ đạo (Theme Color)</Label>
                <div className="flex gap-3 items-center">
                  <input 
                    type="color" 
                    value={settings.theme_color || '#3b82f6'}
                    onChange={(e) => setSettings({...settings, theme_color: e.target.value})}
                    className="w-12 h-12 rounded-lg cursor-pointer border-none p-1 bg-gray-50 ring-2 ring-transparent focus:ring-primary/20"
                  />
                  <code className="text-sm font-mono text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    {settings.theme_color || '#3b82f6'}
                  </code>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ngôn ngữ mặc định</Label>
                <div className="flex items-center gap-2 h-12 px-4 rounded-xl bg-gray-50 text-gray-500 italic text-sm border border-gray-100">
                  <Globe size={16} /> Tiếng Việt
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-3">
                <Label>Logo trường</Label>
                <label className="relative cursor-pointer h-48 border-2 border-dashed border-primary/20 rounded-3xl flex flex-col items-center justify-center text-primary gap-3 bg-primary/5 hover:bg-primary/10 transition-colors overflow-hidden group">
                  <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={(e) => handleFileUpload(e, 'logo_url')} />
                  {settings.logo_url ? (
                    <>
                      <img src={getDirectImageUrl(settings.logo_url)} alt="Logo preview" className="absolute inset-0 w-full h-full object-contain p-6" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-bold bg-black/30 px-4 py-2 rounded-xl backdrop-blur-md">Thay đổi ảnh</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <ImageIcon size={24} />
                      </div>
                      <span className="text-xs font-bold px-4 text-center">Tải lên Logo ngang<br/>(.png, .jpg)</span>
                    </>
                  )}
                </label>
                {settings.logo_url && (
                  <button onClick={() => setSettings({...settings, logo_url: ''})} className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 justify-center w-full mt-2">
                    <Trash2 size={12}/> Xóa ảnh
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <Label>Biểu tượng thu nhỏ (Favicon)</Label>
                <label className="relative cursor-pointer h-48 border-2 border-dashed border-primary/20 rounded-3xl flex flex-col items-center justify-center text-primary gap-3 bg-primary/5 hover:bg-primary/10 transition-colors overflow-hidden group">
                  <input type="file" accept="image/png, image/x-icon, image/ico, image/jpeg" className="hidden" onChange={(e) => handleFileUpload(e, 'favicon_url')} />
                  {settings.favicon_url ? (
                    <>
                      <img src={getDirectImageUrl(settings.favicon_url)} alt="Favicon preview" className="absolute inset-0 w-full h-full object-contain p-8" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-bold bg-black/30 px-4 py-2 rounded-xl backdrop-blur-md">Thay đổi ảnh</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <ImageIcon size={24} />
                      </div>
                      <span className="text-xs font-bold px-4 text-center">Tải lên Biểu tượng vuông<br/>(.ico, .png)</span>
                    </>
                  )}
                </label>
                {settings.favicon_url && (
                  <button onClick={() => setSettings({...settings, favicon_url: ''})} className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1 justify-center w-full mt-2">
                    <Trash2 size={12}/> Xóa ảnh
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pt-8">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="w-full rounded-2xl h-14 font-extrabold text-lg gap-3 shadow-xl shadow-primary/20"
            >
              {isSaving ? <span className="animate-spin">⏳</span> : <Save size={20} />}
              {isSaving ? 'Đang cập nhật...' : 'Lưu lại thay đổi'}
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
