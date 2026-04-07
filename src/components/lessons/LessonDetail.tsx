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
import { getDirectImageUrl } from '@/lib/utils'
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

  const getFileCategory = () => {
    if (!lesson?.file_type) return 'unknown'
    const ft = lesson.file_type.toLowerCase()
    if (ft === 'youtube') return 'youtube'
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ft)) return 'video'
    if (['pdf'].includes(ft)) return 'pdf'
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ft)) return 'image'
    if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ft)) return 'office'
    return 'other'
  }

  const getYouTubeId = (url: string) => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  const fileCategory = getFileCategory()

  if (!lesson) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] h-[92vh] p-0 overflow-hidden flex flex-col rounded-3xl glass-card border-0 shadow-2xl">
        <div className="flex flex-1 overflow-hidden">
          {/* Left Side: Lesson Content - Chiếm phần lớn */}
          <div className="flex-[2] bg-gray-950 flex flex-col">
            <div className="flex-1 flex items-center justify-center overflow-hidden relative">
              {fileCategory === 'youtube' && (
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(lesson.file_url)}?autoplay=1`}
                  className="w-full h-full border-0 bg-black"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={lesson.title}
                />
              )}

              {fileCategory === 'video' && (
                <video 
                  src={lesson.file_url} 
                  controls 
                  className="w-full h-full object-contain" 
                  autoPlay
                />
              )}

              {fileCategory === 'pdf' && (
                <iframe
                  src={`${lesson.file_url}#toolbar=1&navpanes=1&scrollbar=1`}
                  className="w-full h-full border-0"
                  title={lesson.title}
                />
              )}

              {fileCategory === 'image' && (
                <div className="w-full h-full flex items-center justify-center p-4 bg-gray-900">
                  <img 
                    src={getDirectImageUrl(lesson.file_url)} 
                    alt={lesson.title}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  />
                </div>
              )}

              {fileCategory === 'office' && (
                <div className="w-full h-full relative">
                  {/* Loading overlay */}
                  <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-4 z-10 office-loading">
                    <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                    <p className="text-white/60 text-sm font-medium">Đang mở tài liệu...</p>
                    <p className="text-white/30 text-xs">Powered by Google Docs Viewer</p>
                  </div>
                  <iframe
                    src={`https://docs.google.com/gview?url=${encodeURIComponent(lesson.file_url)}&embedded=true`}
                    className="w-full h-full border-0 relative z-20"
                    title={lesson.title}
                    onLoad={(e) => {
                      const el = (e.target as HTMLElement).parentElement?.querySelector('.office-loading') as HTMLElement
                      if (el) el.style.display = 'none'
                    }}
                  />
                </div>
              )}

              {fileCategory === 'other' && (
                <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center gap-4">
                  <BookOpen size={80} className="text-white/10" />
                  <p className="text-white/40 font-medium italic text-sm">Không hỗ trợ xem trước định dạng này</p>
                  <Button 
                    className="rounded-xl gap-2 font-bold mt-2" 
                    onClick={() => window.open(lesson.file_url, '_blank')}
                  >
                    <Download size={18} /> Tải file để xem
                  </Button>
                </div>
              )}
            </div>
            
            {/* Bottom bar - Thông tin bài giảng */}
            <div className="p-5 bg-white/95 backdrop-blur-sm border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div className="min-w-0 flex-1 mr-4">
                  <h2 className="text-lg font-black text-gray-900 truncate">{lesson.title}</h2>
                  <div className="flex gap-3 mt-1 text-xs font-bold uppercase tracking-widest text-gray-400">
                    <span className="text-primary">{lesson.subjects?.title}</span>
                    <span>•</span>
                    <span>{lesson.grade_level}</span>
                    {lesson.profiles?.full_name && (
                      <>
                        <span>•</span>
                        <span className="text-gray-500 normal-case tracking-normal">{lesson.profiles.full_name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
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
