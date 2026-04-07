"use client"

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { createClient } from '@/utils/supabase/client'
import { useAuth, ROLE_LABELS } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  UserCircle, Save, Mail, Phone, Calendar, Shield, 
  CreditCard, Heart, MapPin, AlertTriangle, Briefcase
} from 'lucide-react'

// Tabs
const TABS = [
  { id: 'basic', label: 'Thông tin cơ bản', icon: UserCircle },
  { id: 'hr', label: 'Hồ sơ nhân sự', icon: CreditCard },
  { id: 'contact', label: 'Liên hệ & Khẩn cấp', icon: AlertTriangle },
]

export default function ProfilePage() {
  const supabase = createClient()
  const { user, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState('basic')

  const [form, setForm] = useState({
    // Cơ bản
    full_name: '', nickname: '', gender: '', dob: '', phone: '', email: '',
    // Nhân sự
    cccd_number: '', cccd_issued_date: '', cccd_issued_place: '',
    social_insurance_code: '', health_insurance_code: '',
    tax_code: '', position: '', start_date: '',
    // Địa chỉ & Khẩn cấp
    permanent_address: '', temporary_address: '',
    emergency_contact_name: '', emergency_contact_phone: '',
  })

  useEffect(() => {
    if (!user) return

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select(`
          full_name, nickname, gender, dob, phone,
          cccd_number, cccd_issued_date, cccd_issued_place,
          social_insurance_code, health_insurance_code,
          tax_code, position, start_date,
          permanent_address, temporary_address,
          emergency_contact_name, emergency_contact_phone
        `)
        .eq('id', user.id)
        .single()

      if (data) {
        setForm({
          full_name: data.full_name || '',
          nickname: data.nickname || '',
          gender: data.gender || '',
          dob: data.dob || '',
          phone: data.phone || '',
          email: user.email || '',
          cccd_number: data.cccd_number || '',
          cccd_issued_date: data.cccd_issued_date || '',
          cccd_issued_place: data.cccd_issued_place || '',
          social_insurance_code: data.social_insurance_code || '',
          health_insurance_code: data.health_insurance_code || '',
          tax_code: data.tax_code || '',
          position: data.position || '',
          start_date: data.start_date || '',
          permanent_address: data.permanent_address || '',
          temporary_address: data.temporary_address || '',
          emergency_contact_name: data.emergency_contact_name || '',
          emergency_contact_phone: data.emergency_contact_phone || '',
        })
      }
      setLoading(false)
    }
    fetchProfile()
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setMsg({ type: '', text: '' })

    const { email, ...updateData } = form
    // Chuyển chuỗi rỗng thành null cho các trường date
    const cleanData = {
      ...updateData,
      dob: updateData.dob || null,
      cccd_issued_date: updateData.cccd_issued_date || null,
      start_date: updateData.start_date || null,
    }

    const { error } = await supabase
      .from('profiles')
      .update(cleanData)
      .eq('id', user.id)

    setSaving(false)
    if (error) {
      setMsg({ type: 'error', text: 'Lỗi cập nhật: ' + error.message })
    } else {
      setMsg({ type: 'success', text: 'Cập nhật hồ sơ thành công!' })
      refreshProfile()
      setTimeout(() => setMsg({ type: '', text: '' }), 3000)
    }
  }

  // Helper tạo input field
  const Field = ({ label, name, type = 'text', placeholder = '', disabled = false, icon: Icon }: any) => (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5 text-gray-600">
        {Icon && <Icon size={14} className="text-gray-400" />}
        {label}
      </Label>
      {type === 'select-gender' ? (
        <select
          value={(form as any)[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-primary/10 outline-none"
        >
          <option value="">-- Chọn --</option>
          <option value="Nam">Nam</option>
          <option value="Nữ">Nữ</option>
        </select>
      ) : (
        <Input
          type={type}
          value={(form as any)[name]}
          onChange={(e) => setForm({ ...form, [name]: e.target.value })}
          className="rounded-xl h-11"
          placeholder={placeholder}
          disabled={disabled}
        />
      )}
    </div>
  )

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-32">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <UserCircle className="text-primary" size={28} />
          Hồ sơ cá nhân
        </h1>
        <p className="text-gray-500 mt-1">Xem và cập nhật đầy đủ thông tin cá nhân - nhân sự.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Cột trái: Avatar + Tổng quan */}
        <div className="glass-card rounded-3xl p-8 text-center flex flex-col items-center gap-4 h-fit">
          <div className="w-24 h-24 bg-primary/10 text-primary rounded-2xl flex items-center justify-center text-4xl font-black shadow-lg shadow-primary/10 overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} className="w-full h-full object-cover" alt="avatar" />
            ) : (
              form.full_name?.charAt(0)?.toUpperCase() || '?'
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{form.full_name || 'Chưa có tên'}</h2>
            {form.nickname && <p className="text-sm text-gray-400 mt-0.5">"{form.nickname}"</p>}
          </div>
          <Badge className="rounded-full px-4 py-1.5 font-bold text-xs" variant="secondary">
            <Shield size={12} className="mr-1.5" />
            {ROLE_LABELS[user?.role || 'parent']}
          </Badge>

          {user?.managedGradeLevel && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-2 w-full">
              <span className="font-semibold text-primary">Phụ trách:</span> {user.managedGradeLevel}
            </div>
          )}

          <div className="w-full mt-4 space-y-3 text-left text-sm text-gray-500">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-gray-400 shrink-0" />
              <span className="truncate">{form.email}</span>
            </div>
            {form.phone && (
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-gray-400 shrink-0" />
                <span>{form.phone}</span>
              </div>
            )}
            {form.dob && (
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-gray-400 shrink-0" />
                <span>{new Date(form.dob).toLocaleDateString('vi-VN')}</span>
              </div>
            )}
            {form.position && (
              <div className="flex items-center gap-3">
                <Briefcase size={16} className="text-gray-400 shrink-0" />
                <span>{form.position}</span>
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: Tabs + Form */}
        <div className="lg:col-span-3 glass-card rounded-3xl p-8">
          {/* Tab Navigation */}
          <div className="flex gap-1 mb-8 bg-gray-50 rounded-2xl p-1.5">
            {TABS.map((tab) => {
              // Ẩn tab HR nếu là phụ huynh
              if (tab.id === 'hr' && user?.role === 'parent') return null
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content: Thông tin cơ bản */}
          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Họ và tên *" name="full_name" placeholder="Nguyễn Văn A" />
              <Field label="Biệt danh" name="nickname" placeholder="VD: Cô Lan" />
              <Field label="Giới tính" name="gender" type="select-gender" />
              <Field label="Ngày sinh" name="dob" type="date" icon={Calendar} />
              <Field label="Số điện thoại" name="phone" placeholder="0901 234 567" icon={Phone} />
              <Field label="Email (không đổi)" name="email" disabled icon={Mail} />
            </div>
          )}

          {/* Tab Content: Hồ sơ nhân sự */}
          {activeTab === 'hr' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <CreditCard size={16} className="text-primary" />
                  Giấy tờ tùy thân
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Field label="Số CCCD / CMND" name="cccd_number" placeholder="012345678901" />
                  <Field label="Ngày cấp" name="cccd_issued_date" type="date" />
                  <Field label="Nơi cấp" name="cccd_issued_place" placeholder="Cục CS QLHC..." />
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <Heart size={16} className="text-pink-500" />
                  Bảo hiểm & Thuế
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Field label="Mã BHXH" name="social_insurance_code" placeholder="0123456789" />
                  <Field label="Mã BHYT" name="health_insurance_code" placeholder="DN1234567890" />
                  <Field label="Mã số thuế" name="tax_code" placeholder="0123456789" />
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <Briefcase size={16} className="text-blue-500" />
                  Công tác
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Chức vụ / Vị trí" name="position" placeholder="Giáo viên chủ nhiệm" />
                  <Field label="Ngày bắt đầu công tác" name="start_date" type="date" />
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Liên hệ & Khẩn cấp */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <MapPin size={16} className="text-green-500" />
                  Địa chỉ
                </h4>
                <div className="grid grid-cols-1 gap-5">
                  <Field label="Địa chỉ thường trú" name="permanent_address" placeholder="123 Đường ABC, Phường XYZ..." />
                  <Field label="Địa chỉ tạm trú" name="temporary_address" placeholder="(Bỏ trống nếu giống thường trú)" />
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-orange-500" />
                  Liên hệ khẩn cấp
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Người liên hệ khẩn cấp" name="emergency_contact_name" placeholder="Nguyễn Văn B (Chồng)" />
                  <Field label="SĐT khẩn cấp" name="emergency_contact_phone" placeholder="0901 234 567" icon={Phone} />
                </div>
              </div>
            </div>
          )}

          {/* Message + Save */}
          {msg.text && (
            <div className={`mt-5 px-4 py-3 rounded-xl text-sm font-medium ${
              msg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
            }`}>
              {msg.text}
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving || !form.full_name}
            className="mt-6 rounded-xl h-12 px-8 font-bold gap-2 shadow-lg shadow-primary/20"
          >
            {saving ? <span className="animate-spin">⏳</span> : <Save size={18} />}
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
