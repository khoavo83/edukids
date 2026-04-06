"use client"

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { User, Shield, GraduationCap, Users as UsersIcon, Trash2, Search, UserPlus, Mail } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const roleMap: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  admin: { label: 'Quản trị viên', icon: Shield, color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' },
  teacher: { label: 'Giáo viên', icon: GraduationCap, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  parent: { label: 'Phụ huynh', icon: UsersIcon, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
}

const getInitials = (name: string) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function UsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteData, setInviteData] = useState({ email: '', password: '', fullName: '', role: 'teacher' })
  const [isInviting, setIsInviting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && profiles) setUsers(profiles)
    setLoading(false)
  }

  const updateRole = async (id: string, newRole: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', id)

    if (!error) {
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u))
    } else {
      alert('Lỗi cập nhật vai trò: ' + error.message)
    }
  }

  const handleDelete = async (profile: any) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${profile.full_name || 'N/A'}"? Hành động này không thể hoàn tác.`)) return
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profile.id)

    if (!error) {
      setUsers(users.filter(u => u.id !== profile.id))
    } else {
      alert('Lỗi xóa: ' + error.message)
    }
  }

  const handleInvite = async () => {
    if (!inviteData.email || !inviteData.password || !inviteData.fullName) {
      return alert('Vui lòng nhập đầy đủ thông tin!')
    }
    setIsInviting(true)

    // Tạo tài khoản qua Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: inviteData.email,
      password: inviteData.password,
      options: {
        data: {
          full_name: inviteData.fullName,
        }
      }
    })

    if (error) {
      alert('Lỗi tạo tài khoản: ' + error.message)
    } else if (data.user) {
      // Cập nhật role trong profiles
      await supabase
        .from('profiles')
        .update({ role: inviteData.role, full_name: inviteData.fullName })
        .eq('id', data.user.id)

      setIsInviteOpen(false)
      setInviteData({ email: '', password: '', fullName: '', role: 'teacher' })
      fetchUsers()
    }
    setIsInviting(false)
  }

  // Lọc theo search + role
  const filteredUsers = users.filter(u => {
    const matchSearch = !searchQuery || 
      (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  // Thống kê
  const stats = {
    total: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    teacher: users.filter(u => u.role === 'teacher').length,
    parent: users.filter(u => u.role === 'parent').length,
  }

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Thành viên</h1>
        <p className="text-gray-500">Phân quyền và quản lý tài khoản người dùng trong hệ thống.</p>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tổng thành viên', value: stats.total, icon: UsersIcon, color: 'from-primary to-blue-600', iconBg: 'bg-primary/10 text-primary' },
          { label: 'Quản trị viên', value: stats.admin, icon: Shield, color: 'from-amber-500 to-orange-500', iconBg: 'bg-amber-50 text-amber-600' },
          { label: 'Giáo viên', value: stats.teacher, icon: GraduationCap, color: 'from-blue-500 to-cyan-500', iconBg: 'bg-blue-50 text-blue-600' },
          { label: 'Phụ huynh', value: stats.parent, icon: UsersIcon, color: 'from-green-500 to-emerald-500', iconBg: 'bg-green-50 text-green-600' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center`}>
              <stat.icon size={22} />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900">{stat.value}</div>
              <div className="text-[11px] font-medium text-gray-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar: Search + Filter + Add */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Tìm theo tên hoặc email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 rounded-xl h-11"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[180px] rounded-xl h-11">
            <SelectValue placeholder="Lọc vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            <SelectItem value="admin">Quản trị viên</SelectItem>
            <SelectItem value="teacher">Giáo viên</SelectItem>
            <SelectItem value="parent">Phụ huynh</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setIsInviteOpen(true)} className="rounded-xl h-11 gap-2 font-bold shadow-lg shadow-primary/20">
          <UserPlus size={18} /> Thêm thành viên
        </Button>
      </div>

      {/* Bảng danh sách */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-sm shadow-primary/5">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="font-bold">Thành viên</TableHead>
              <TableHead className="font-bold">Vai trò</TableHead>
              <TableHead className="font-bold">Ngày tham gia</TableHead>
              <TableHead className="text-right font-bold">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-gray-400">Đang tải danh sách thành viên...</TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 font-medium text-gray-500">
                  {searchQuery || filterRole !== 'all' ? 'Không tìm thấy thành viên phù hợp.' : 'Chưa có thành viên nào.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((profile) => {
                const role = roleMap[profile.role] || roleMap.parent
                const RoleIcon = role.icon

                return (
                  <TableRow key={profile.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs overflow-hidden">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                          ) : (
                            getInitials(profile.full_name || '')
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{profile.full_name || 'Chưa đặt tên'}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Mail size={10} />
                            {profile.email || profile.id.slice(0, 12) + '...'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={profile.role || 'parent'} 
                        onValueChange={(val) => updateRole(profile.id, val)}
                      >
                        <SelectTrigger className={`w-[160px] rounded-xl h-9 text-xs font-bold border ${role.bgColor} ${role.color}`}>
                          <div className="flex items-center gap-2">
                            <RoleIcon size={14} />
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2"><Shield size={14} className="text-amber-500" /> Quản trị viên</div>
                          </SelectItem>
                          <SelectItem value="teacher">
                            <div className="flex items-center gap-2"><GraduationCap size={14} className="text-blue-500" /> Giáo viên</div>
                          </SelectItem>
                          <SelectItem value="parent">
                            <div className="flex items-center gap-2"><UsersIcon size={14} className="text-green-500" /> Phụ huynh</div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(profile.created_at).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:bg-red-50 rounded-lg gap-1"
                        onClick={() => handleDelete(profile)}
                      >
                        <Trash2 size={14} /> Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Thêm thành viên */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="rounded-3xl glass-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus size={20} className="text-primary" /> Thêm thành viên mới
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Họ và tên *</Label>
              <Input 
                placeholder="Nguyễn Văn A"
                value={inviteData.fullName}
                onChange={(e) => setInviteData({...inviteData, fullName: e.target.value})}
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input 
                type="email"
                placeholder="email@example.com"
                value={inviteData.email}
                onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Mật khẩu *</Label>
              <Input 
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={inviteData.password}
                onChange={(e) => setInviteData({...inviteData, password: e.target.value})}
                className="rounded-xl h-11"
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label>Vai trò</Label>
              <Select value={inviteData.role} onValueChange={(val) => setInviteData({...inviteData, role: val})}>
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                  <SelectItem value="teacher">Giáo viên</SelectItem>
                  <SelectItem value="parent">Phụ huynh</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleInvite} 
              disabled={isInviting}
              className="w-full rounded-xl h-12 font-bold gap-2 shadow-lg shadow-primary/20"
            >
              {isInviting ? <span className="animate-spin">⏳</span> : <UserPlus size={18} />}
              {isInviting ? 'Đang tạo...' : 'Tạo tài khoản'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
