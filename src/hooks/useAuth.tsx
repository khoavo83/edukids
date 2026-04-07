"use client"

import { useState, useEffect, createContext, useContext } from 'react'
import { createClient } from '@/utils/supabase/client'
import { getDirectImageUrl } from '@/lib/utils'

// Định nghĩa thứ tự phân cấp: Giá trị cao hơn = quyền cao hơn
const ROLE_HIERARCHY: Record<string, number> = {
  admin: 4,
  bgh: 3,
  to_truong: 2,
  teacher: 1,
  parent: 0,
}

// Nhãn tiếng Việt cho các vai trò
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị viên',
  bgh: 'Ban Giám hiệu',
  to_truong: 'Tổ trưởng',
  teacher: 'Giáo viên',
  parent: 'Phụ huynh',
}

// Danh sách tất cả vai trò nội bộ (Admin Portal)
export const STAFF_ROLES = ['admin', 'bgh', 'to_truong', 'teacher']

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: string
  avatarUrl: string | null
  managedGradeLevel: string | null
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  isStaff: boolean         // Có phải nhân sự nội bộ không (không phải phụ huynh)
  isManagement: boolean   // Admin hoặc BGH
  isAdmin: boolean        // Super Admin
  hasRoleAbove: (targetRole: string) => boolean // Kiểm tra quyền cao hơn 1 vai trò
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isStaff: false,
  isManagement: false,
  isAdmin: false,
  hasRoleAbove: () => false,
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      setUser(null)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role, avatar_url, managed_grade_level')
      .eq('id', authUser.id)
      .single()

    setUser({
      id: authUser.id,
      email: authUser.email || '',
      fullName: profile?.full_name || authUser.email || 'Người dùng',
      role: profile?.role || 'parent',
      avatarUrl: profile?.avatar_url ? getDirectImageUrl(profile.avatar_url) : null,
      managedGradeLevel: profile?.managed_grade_level || null,
    })
    setLoading(false)
  }

  useEffect(() => {
    fetchProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile()
    })

    return () => subscription.unsubscribe()
  }, [])

  const role = user?.role || 'parent'
  const isStaff = STAFF_ROLES.includes(role)
  const isManagement = role === 'admin' || role === 'bgh'
  const isAdmin = role === 'admin'

  const hasRoleAbove = (targetRole: string): boolean => {
    return (ROLE_HIERARCHY[role] || 0) >= (ROLE_HIERARCHY[targetRole] || 0)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isStaff,
      isManagement,
      isAdmin,
      hasRoleAbove,
      refreshProfile: fetchProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
