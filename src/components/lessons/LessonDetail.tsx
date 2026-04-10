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
  BookOpen,
  Star,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getDirectImageUrl, cn } from '@/lib/utils'
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
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [ratingStats, setRatingStats] = useState({ avg: 0, total: 0, counts: [0, 0, 0, 0, 0] })
  const [userRating, setUserRating] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen && lesson) {
      fetchComments()
      checkAuthStatus()
      fetchRatingStats()
    }
  }, [isOpen, lesson])

  const fetchRatingStats = async () => {
    const { data: allRatings } = await supabase
      .from('ratings')
      .select('rating')
      .eq('lesson_id', lesson.id)

    if (allRatings && allRatings.length > 0) {
      const total = allRatings.length
      const sum = allRatings.reduce((acc, r) => acc + r.rating, 0)
      const counts = [0, 0, 0, 0, 0]
      allRatings.forEach(r => {
        if (r.rating >= 1 && r.rating <= 5) counts[5 - r.rating]++
      })
      setRatingStats({ avg: Number((sum / total).toFixed(1)), total, counts })
    } else {
      setRatingStats({ avg: 0, total: 0, counts: [0, 0, 0, 0, 0] })
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: myRating } = await supabase
        .from('ratings')
        .select('rating')
        .eq('lesson_id', lesson.id)
        .eq('user_id', user.id)
        .single()
      if (myRating) setUserRating(myRating.rating)
    }
  }

  const rateLesson = async (rating: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('ratings')
      .upsert({ 
        lesson_id: lesson.id, 
        user_id: user.id, 
        rating 
      }, { onConflict: 'lesson_id,user_id' })

    if (!error) {
      setUserRating(rating)
      fetchRatingStats()
    }
  }

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
        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Side: Lesson Content - Tự động giãn nở */}
          <div className="flex-1 bg-gray-950 flex flex-col transition-all duration-300 overflow-hidden">
            <div className="flex-1 flex items-center justify-center overflow-hidden relative group">
              {/* Nút Toggle Trao đổi khi đang đóng */}
              {!isChatOpen && (
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 rounded-full shadow-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white w-10 h-20 transition-all hover:scale-105"
                  onClick={() => setIsChatOpen(true)}
                >
                  <ChevronLeft size={24} />
                </Button>
              )}
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
            
            {/* Bottom area - Đã thu gọn cực đại để tối ưu không gian hiển thị tài liệu */}
            <ScrollArea className="h-32 md:h-36 bg-white/95 backdrop-blur-sm border-t border-gray-100 shrink-0">
              <div className="px-5 py-4">
                <div className="flex justify-between items-center gap-4">
                  <div className="min-w-0 flex-1 mr-4">
                    <h2 className="text-xl font-black text-gray-900 leading-tight">{lesson.title}</h2>
                    <div className="flex items-center gap-3 mt-1 font-bold uppercase tracking-widest">
                      <span className="text-xs text-primary">{lesson.subjects?.title}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-400">{lesson.grade_level}</span>
                      {lesson.profiles?.full_name && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-500 normal-case tracking-normal">{lesson.profiles.full_name}</span>
                        </>
                      )}
                      
                      {/* Điểm trung bình nhỏ gọn */}
                      <span className="text-gray-300 ml-1">•</span>
                      <div className="flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                        <Star size={10} className="fill-orange-400 text-orange-400" />
                        <span className="text-[10px] text-orange-600 font-bold">{ratingStats.avg} ({ratingStats.total})</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {isAuthenticated ? (
                      <>
                        {/* Đánh giá của bạn - Thu gọn kế bên nút Lưu */}
                        <div className="flex flex-col items-center gap-1 mr-2 px-3 border-r border-gray-100">
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Đánh giá của bạn</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button 
                                key={star} 
                                onClick={() => rateLesson(star)}
                                className="transition-all hover:scale-125"
                              >
                                <Star 
                                  size={16} 
                                  className={cn(
                                    star <= (userRating || 0) 
                                    ? "fill-orange-400 text-orange-400" 
                                    : "text-gray-200 hover:text-orange-200"
                                  )} 
                                />
                              </button>
                            ))}
                          </div>
                          {userRating && (
                            <span className="text-[8px] text-green-500 font-bold italic line-clamp-1">
                              Đã đánh giá!
                            </span>
                          )}
                        </div>

                        <Button 
                          variant={isBookmarked ? "default" : "outline"}
                          className="rounded-xl gap-2 font-bold h-11"
                          onClick={toggleBookmark}
                        >
                          <Bookmark size={18} className={isBookmarked ? "fill-white" : ""} />
                          {isBookmarked ? 'Đã lưu' : 'Lưu lại'}
                        </Button>
                        <Button className="rounded-xl gap-2 font-bold h-11" onClick={() => window.open(lesson.file_url, '_blank')}>
                          <Download size={18} /> Tải về
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" className="rounded-xl font-bold cursor-not-allowed opacity-50" disabled>
                        Đăng nhập để Tải & Đánh giá
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Right Side: Comments - Thu gọn được */}
          <div className={cn(
            "flex flex-col bg-white border-l border-gray-50 transition-all duration-300 overflow-hidden",
            isChatOpen ? "w-[350px] opacity-100 visible" : "w-0 opacity-0 invisible"
          )}>
            <div className="p-4 border-b border-gray-50 flex items-center gap-2">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                onClick={() => setIsChatOpen(false)}
                title="Thu gọn trao đổi"
              >
                <ChevronRight size={18} />
              </Button>
              <div className="flex items-center gap-2 flex-1">
                <MessageSquare size={18} className="text-primary" />
                <h3 className="font-bold text-sm uppercase tracking-widest">Trao đổi ({comments.length})</h3>
              </div>
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
