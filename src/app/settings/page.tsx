"use client"

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { Save, School, Palette, Image as ImageIcon, Globe } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SettingsPage() {
  const supabase = createClient()
  const [settings, setSettings] = useState({
    school_name: 'Trường Mầm Non EduKids',
    theme_color: '#ff6b6b',
    logo_url: '',
    favicon_url: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('school_settings')
      .select('*')
      .single()
    
    if (!error && data) setSettings(data)
    setLoading(false)
  }

  const handleSave = async () => {
    const { error } = await supabase
      .from('school_settings')
      .upsert([settings])
    
    if (!error) {
      alert('Cài đặt đã được lưu thành công!')
    }
  }

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Cấu hình Hệ thống</h1>
        <p className="text-gray-500">Tùy biến thương hiệu và thông tin cơ bản của trường.</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* school branding */}
        <div className="glass-card rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <School size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Thương hiệu Trường</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="school_name">Tên trường hiển thị</Label>
              <Input 
                id="school_name" 
                value={settings.school_name}
                onChange={(e) => setSettings({...settings, school_name: e.target.value})}
                className="rounded-xl h-12"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Màu chủ đạo (Theme)</Label>
                <div className="flex gap-3 items-center">
                  <input 
                    type="color" 
                    value={settings.theme_color}
                    onChange={(e) => setSettings({...settings, theme_color: e.target.value})}
                    className="w-12 h-12 rounded-lg cursor-pointer border-none p-1 bg-gray-50"
                  />
                  <code className="text-sm font-mono text-gray-500">{settings.theme_color}</code>
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
                <div className="h-40 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-gray-400 gap-2 bg-gray-50/50">
                  <ImageIcon size={32} />
                  <span className="text-xs">Tải lên Logo (.png, .jpg)</span>
                </div>
              </div>
              <div className="space-y-3">
                <Label>Biểu tượng (Favicon)</Label>
                <div className="h-40 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-gray-400 gap-2 bg-gray-50/50">
                  <ImageIcon size={24} />
                  <span className="text-xs">Tải lên Favicon (.ico)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Button onClick={handleSave} className="w-full rounded-2xl h-14 font-extrabold text-lg gap-3 shadow-xl shadow-primary/20">
              <Save size={20} />
              Cập nhật cấu hình
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
