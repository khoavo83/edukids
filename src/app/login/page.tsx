"use client"

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Layout, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (isLogin) {
      // Đăng nhập
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (error) {
        setError(error.message === 'Invalid login credentials' 
          ? 'Email hoặc mật khẩu không đúng.' 
          : error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } else {
      // Đăng ký
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
          }
        }
      })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7f9fc] via-white to-[#fff0f0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/30 mx-auto mb-4">
            <Layout size={32} />
          </div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            EduKids
          </h1>
          <p className="text-gray-400 text-sm mt-2">Hệ thống Quản lý Dữ liệu Học tập</p>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-3xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {isLogin ? 'Đăng nhập' : 'Tạo tài khoản mới'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label>Họ và tên</Label>
                <Input 
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={form.fullName}
                  onChange={(e) => setForm({...form, fullName: e.target.value})}
                  className="rounded-xl h-12"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                className="rounded-xl h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Mật khẩu</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  className="rounded-xl h-12 pr-12"
                  required
                  minLength={6}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 px-4 py-3 rounded-xl text-sm font-medium">
                {success}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full rounded-xl h-12 font-bold text-base gap-2 shadow-lg shadow-primary/20"
              disabled={loading}
            >
              {loading ? (
                <span className="animate-spin">⏳</span>
              ) : isLogin ? (
                <><LogIn size={18} /> Đăng nhập</>
              ) : (
                <><UserPlus size={18} /> Đăng ký</>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess('') }}
              className="text-sm text-gray-500 hover:text-primary transition-colors"
            >
              {isLogin ? (
                <>Chưa có tài khoản? <span className="font-bold text-primary">Đăng ký ngay</span></>
              ) : (
                <>Đã có tài khoản? <span className="font-bold text-primary">Đăng nhập</span></>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 EduKids. Phát triển bởi đội ngũ Hoa Mai.
        </p>
      </div>
    </div>
  )
}
