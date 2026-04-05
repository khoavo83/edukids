"use client"

import { useState, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { Check, X, Eye, FileText, Play, Clock, Search } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function ReviewPage() {
  const supabase = createClient()
  const [pendingLessons, setPendingLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPendingLessons()
  }, [])

  const fetchPendingLessons = async () => {
    const { data } = await supabase
      .from('lessons')
      .select('*, subjects(title)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    if (data) setPendingLessons(data)
    setLoading(false)
  }

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('lessons')
      .update({ status })
      .eq('id', id)

    if (!error) {
      setPendingLessons(pendingLessons.filter(l => l.id !== id))
    }
  }

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Phê duyệt Nội dung</h1>
        <p className="text-gray-500">Kiểm tra và phê duyệt các bài giảng mới từ giáo viên.</p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Đang quét các bài giảng chờ duyệt...</div>
        ) : pendingLessons.length === 0 ? (
          <div className="glass-card rounded-3xl p-20 text-center flex flex-col items-center gap-4 text-gray-500">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
              <Check size={32} />
            </div>
            <span>Tuyệt vời! Không còn bài giảng nào đang chờ duyệt.</span>
          </div>
        ) : (
          pendingLessons.map((lesson) => (
            <div key={lesson.id} className="glass-card rounded-2xl p-6 flex items-center gap-6 group hover:translate-x-1 transition-transform">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
                {lesson.file_type === 'mp4' ? <Play size={24} /> : <FileText size={24} />}
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">{lesson.title}</h3>
                <div className="flex gap-4 mt-1 text-xs text-gray-400 font-medium">
                  <span className="text-primary">{lesson.subjects?.title}</span>
                  <span>•</span>
                  <span>{lesson.grade_level}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {new Date(lesson.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl gap-2 font-bold hover:bg-gray-100"
                  onClick={() => window.open(lesson.file_url, '_blank')}
                >
                  <Eye size={16} /> Xem
                </Button>
                <Button 
                  size="sm" 
                  className="bg-green-500 hover:bg-green-600 font-bold rounded-xl gap-2"
                  onClick={() => handleReview(lesson.id, 'approved')}
                >
                  <Check size={16} /> Duyệt
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 hover:bg-red-50 hover:text-red-600 font-bold rounded-xl gap-2"
                  onClick={() => handleReview(lesson.id, 'rejected')}
                >
                  <X size={16} /> Từ chối
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </MainLayout>
  )
}
