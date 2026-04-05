"use client"

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { User, Shield, GraduationCap, Users as UsersIcon, Edit, Trash2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function UsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
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
    }
  }

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Thành viên</h1>
        <p className="text-gray-500">Phân quyền và quản lý tài khoản người dùng trong hệ thống.</p>
      </div>

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
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 font-medium text-gray-500">Chưa có thành viên nào.</TableCell>
              </TableRow>
            ) : (
              users.map((profile) => (
                <TableRow key={profile.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <User size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{profile.full_name || 'N/A'}</div>
                        <div className="text-xs text-gray-400">{profile.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {profile.role === 'admin' && <Shield size={14} className="text-amber-500" />}
                      {profile.role === 'teacher' && <GraduationCap size={14} className="text-blue-500" />}
                      {profile.role === 'parent' && <UsersIcon size={14} className="text-green-500" />}
                      <Badge variant="outline" className={`capitalize font-bold text-[10px] 
                        ${profile.role === 'admin' ? 'border-amber-200 text-amber-600 bg-amber-50' : 
                          profile.role === 'teacher' ? 'border-blue-200 text-blue-600 bg-blue-50' : 
                          'border-green-200 text-green-600 bg-green-50'}`}>
                        {profile.role}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:bg-primary/5 rounded-lg"
                        onClick={() => {
                          const roles = ['admin', 'teacher', 'parent']
                          const nextRole = roles[(roles.indexOf(profile.role) + 1) % roles.length]
                          updateRole(profile.id, nextRole)
                        }}
                      >
                        Đổi quyền
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </MainLayout>
  )
}
