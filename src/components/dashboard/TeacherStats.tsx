import React, { useState, useMemo } from 'react'
import { Trophy, Medal, Calendar } from 'lucide-react'
import { getDirectImageUrl } from '@/lib/utils'

type Period = 'week' | 'month' | 'quarter' | 'year' | 'all'

interface TeacherStatsProps {
  lessons: any[]
}

const PERIOD_LABELS: Record<Period, string> = {
  week: 'Tuần này',
  month: 'Tháng này',
  quarter: 'Quý này',
  year: 'Năm nay',
  all: 'Tất cả'
}

const getInitials = (name: string) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function TeacherStats({ lessons }: TeacherStatsProps) {
  const [period, setPeriod] = useState<Period>('month')

  const stats = useMemo(() => {
    // Determine start time based on period
    const now = new Date()
    let startTime = 0
    
    switch (period) {
      case 'week':
        const day = now.getDay()
        const diff = now.getDate() - day + (day === 0 ? -6 : 1) // Cố định thứ 2 là đầu tuần
        startTime = new Date(now.setDate(diff)).setHours(0, 0, 0, 0)
        break
      case 'month':
        startTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
        break
      case 'quarter':
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3
        startTime = new Date(now.getFullYear(), quarterMonth, 1).getTime()
        break
      case 'year':
        startTime = new Date(now.getFullYear(), 0, 1).getTime()
        break
      case 'all':
      default:
        startTime = 0
        break
    }

    // Filter lessons
    const filtered = lessons.filter(l => {
      // Bảng vinh danh chỉ đếm các bài được duyệt và đang chờ duyệt (nằm trong mảng lessons tải về từ dashboard)
      if (l.status === 'rejected') return false; 

      if (period === 'all') return true
      return new Date(l.created_at).getTime() >= startTime
    })

    // Group by teacher
    const map = new Map<string, { count: number; name: string; avatar: string }>()
    filtered.forEach(l => {
      // Ưu tiên hiển thị giáo viên, tài khoản không có profile bỏ qua
      if (!l.profiles) return

      const teacherId = l.teacher_id || 'unknown'
      const name = l.profiles.full_name || 'Giáo viên ẩn danh'
      const avatar = l.profiles.avatar_url || ''

      const ex = map.get(teacherId) || { count: 0, name, avatar }
      ex.count += 1
      map.set(teacherId, ex)
    })

    // Sort descending
    const sorted = Array.from(map.values()).sort((a, b) => b.count - a.count)
    
    // Get max count for calculating progress bar percentage
    const maxCount = sorted.length > 0 ? sorted[0].count : 1

    return { sorted, maxCount }
  }, [lessons, period])

  return (
    <div className="glass-card rounded-3xl p-6 mb-10 border border-gray-100/50 bg-white shadow-xl shadow-primary/5">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8 border-b border-gray-50 pb-6">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={24} />
            Bảng Vàng Đóng Góp
          </h2>
          <p className="text-sm text-gray-500 mt-1">Tôn vinh các giáo viên chia sẻ bài giảng nhiều nhất</p>
        </div>

        <div className="flex bg-gray-50 p-1 rounded-2xl overflow-x-auto shrink-0 w-full xl:w-auto">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-2 text-xs md:text-sm font-bold rounded-xl whitespace-nowrap transition-all ${
                period === p 
                  ? 'bg-white text-primary shadow flex-1 text-center border-b-2 border-primary' 
                  : 'text-gray-500 hover:bg-gray-100 flex-1 text-center'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin">
        {stats.sorted.length === 0 ? (
          <div className="text-center py-10 text-gray-400 font-medium flex flex-col items-center">
            <Calendar className="mb-3 opacity-50" size={32} />
            Chưa có đóng góp bài giảng trong khung thời gian này.
          </div>
        ) : (
          stats.sorted.map((teacher, index) => {
            const isTop1 = index === 0
            const isTop2 = index === 1
            const isTop3 = index === 2
            const percentage = Math.max(5, (teacher.count / stats.maxCount) * 100)

            return (
              <div 
                key={index} 
                className={`relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] ${
                  isTop1 ? 'bg-yellow-50/50 border border-yellow-100' : 
                  isTop2 ? 'bg-gray-50/50 border border-gray-100' :
                  isTop3 ? 'bg-amber-50/30 border border-orange-50' : 
                  'hover:bg-gray-50/50 border border-transparent'
                }`}
              >
                {/* Ranking Badge */}
                <div className="w-10 h-10 shrink-0 flex items-center justify-center font-black text-lg">
                  {isTop1 ? <Medal className="text-yellow-500 fill-yellow-500" size={32} /> :
                   isTop2 ? <Medal className="text-gray-400 fill-gray-200" size={28} /> :
                   isTop3 ? <Medal className="text-amber-700 fill-amber-700/20" size={26} /> :
                   <span className="text-gray-300">#{index + 1}</span>}
                </div>

                {/* Avatar */}
                <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-sm font-black tracking-tighter overflow-hidden ring-4 shadow-sm ${
                  isTop1 ? 'ring-yellow-200 bg-yellow-100 text-yellow-600' :
                  isTop2 ? 'ring-gray-200 bg-gray-100 text-gray-600' :
                  isTop3 ? 'ring-amber-100 bg-amber-50 text-amber-700' :
                  'ring-white bg-primary/10 text-primary'
                }`}>
                  {teacher.avatar ? (
                    <img src={getDirectImageUrl(teacher.avatar)} className="w-full h-full object-cover" alt="avatar" />
                  ) : (
                    getInitials(teacher.name)
                  )}
                </div>

                {/* Info & Bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-end mb-2">
                    <h4 className={`font-extrabold truncate ${isTop1 ? 'text-yellow-700 text-base' : 'text-gray-800 text-sm'}`}>
                      {teacher.name}
                    </h4>
                    <span className={`font-black text-lg flex items-center gap-1 ${isTop1 ? 'text-yellow-600' : 'text-gray-700'}`}>
                      {teacher.count} <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">bài</span>
                    </span>
                  </div>
                  
                  {/* Progress bar container */}
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        isTop1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-300' :
                        isTop2 ? 'bg-gradient-to-r from-gray-400 to-gray-300' :
                        isTop3 ? 'bg-gradient-to-r from-amber-600 to-orange-400' :
                        'bg-gradient-to-r from-primary to-blue-400 opacity-60'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
