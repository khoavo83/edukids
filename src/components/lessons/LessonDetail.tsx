"use client"

import { useState, useEffect } from 'react'
import { 
  X, 
  MessageSquare, 
  Bookmark, 
  Send, 
  User, 
  Play, 
  Download,
  Clock,
  BookOpen
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'

interface LessonDetailProps {
  lesson: any
  isOpen: boolean
  onClose: () => void
}

export default function LessonDetail({ lesson, isOpen, onClose }: LessonDetailProps) {
  const supabase = createClient()
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (isOpen && lesson) {
      fetchComments()
      checkAuthStatus()
    }
  }, [isOpen, lesson])

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(full_name)')
      .eq('lesson_id', lesson.id)
      .order('created_at', { ascending: true })
    if (data) setComments(data)
  }

  const checkAuthStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setIsAuthenticated(true)
      checkBookmarkStatus(user.id)
    } else {
      setIsAuthenticated(false)
    }
  }

  const checkBookmarkStatus = async (userId: string) => {
    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('lesson_id', lesson.id)
      .eq('user_id', userId)
      .single()
    setIsBookmarked(!!data)
  }

  const toggleBookmark = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (isBookmarked) {
      await supabase.from('bookmarks').delete().eq('lesson_id', lesson.id).eq('user_id', user.id)
    } else {
      await supabase.from('bookmarks').insert([{ lesson_id: lesson.id, user_id: user.id }])
    }
    setIsBookmarked(!isBookmarked)
  }

  const postComment = async () => {
    if (!newComment.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('comments')
      .insert([{ content: newComment, lesson_id: lesson.id, user_id: user.id }])
      .select('*, profiles(full_name)')
      .single()

    if (!error) {
      setComments([...comments, data])
      setNewComment('')
    }
  }

  if (!lesson) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden flex flex-col rounded-3xl glass-card">
        <div className="flex flex-1 overflow-hidden">
          {/* Left Side: Lesson Content */}
          <div className="flex-[1.5] bg-gray-50 flex flex-col">
            <div className="flex-1 flex items-center justify-center p-8">
              {lesson.file_type === 'mp4' ? (
                <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden relative group">
                  <video src={lesson.file_url} controls className="w-full h-full" />
                </div>
              ) : (
                <div className="w-full h-full bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-4">
                  <BookOpen size={64} className="text-primary/20" />
                  <p className="text-gray-400 font-medium italic">Xem tài liệu tại link tải xuống bên dưới</p>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-white border-t border-gray-100">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-black text-gray-900">{lesson.title}</h2>
                  <div className="flex gap-4 mt-2 text-xs font-bold uppercase tracking-widest text-gray-400">
                    <span className="text-primary">{lesson.subjects?.title}</span>
                    <span>•</span>
                    <span>{lesson.grade_level}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isAuthenticated ? (
                    <>
                      <Button 
                        variant={isBookmarked ? "default" : "outline"}
                        className="rounded-xl gap-2 font-bold"
                        onClick={toggleBookmark}
                      >
                        <Bookmark size={18} className={isBookmarked ? "fill-white" : ""} />
                        {isBookmarked ? 'Đã lưu' : 'Lưu lại'}
                      </Button>
                      <Button className="rounded-xl gap-2 font-bold" onClick={() => window.open(lesson.file_url, '_blank')}>
                        <Download size={18} /> Tải về
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" className="rounded-xl font-bold cursor-not-allowed opacity-50" disabled>
                      Đăng nhập để Tải & Lưu
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Comments */}
          <div className="flex-1 flex flex-col bg-white border-l border-gray-50">
            <div className="p-4 border-b border-gray-50 flex items-center gap-2">
              <MessageSquare size={18} className="text-primary" />
              <h3 className="font-bold text-sm uppercase tracking-widest">Trao đổi ({comments.length})</h3>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-10 text-gray-300 text-xs italic">Chưa có bình luận nào. Hãy là người đầu tiên trao đổi!</div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[10px] text-gray-900">{c.profiles?.full_name || 'Người dùng'}</span>
                        <span className="text-[8px] text-gray-300">{new Date(c.created_at).toLocaleTimeString()}</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-2xl rounded-tl-none text-xs text-gray-600">
                        {c.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-gray-50">
              {isAuthenticated ? (
                <div className="relative">
                  <Input 
                    placeholder="Gửi tin nhắn..." 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="rounded-2xl pr-10 bg-gray-50 border-none h-11 focus:ring-primary/20"
                    onKeyDown={(e) => e.key === 'Enter' && postComment()}
                  />
                  <Button 
                    size="icon" 
                    variant="ghost"
                    className="absolute right-1 top-1 h-9 w-9 rounded-xl text-primary hover:bg-primary/10"
                    onClick={postComment}
                  >
                    <Send size={16} />
                  </Button>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-3 text-center text-xs text-gray-500 font-medium">
                  Vui lòng đăng nhập để bình luận.
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
