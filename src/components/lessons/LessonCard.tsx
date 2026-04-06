import React from 'react'
import { Play, FileText, ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface LessonCardProps {
  lesson: any
  onClick: () => void
}

const getInitials = (name: string) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function LessonCard({ lesson, onClick }: LessonCardProps) {
  const isVideo = lesson.file_type === 'mp4' || lesson.file_type === 'mov'
  const isImage = lesson.file_type === 'png' || lesson.file_type === 'jpg' || lesson.file_type === 'jpeg' || lesson.file_type === 'webp'

  return (
    <div 
      className="lesson-card-hover glass-card bg-white rounded-3xl overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full"
      onClick={onClick}
    >
      <div className="relative h-48 bg-gray-100 overflow-hidden w-full shrink-0">
        {/* Preview nền */}
        {isVideo ? (
          <video 
            src={lesson.file_url} 
            className="w-full h-full object-cover" 
            muted 
            loop 
            onMouseEnter={(e) => { e.currentTarget.play() }} 
            onMouseLeave={(e) => { e.currentTarget.pause() }} 
          />
        ) : isImage ? (
          <img 
            src={lesson.file_url} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            alt={lesson.title}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-blue-500/10 flex flex-col items-center justify-center p-6 group-hover:scale-105 transition-transform duration-500">
            <FileText size={48} className="text-primary mb-3 opacity-80" />
            <p className="text-xs font-bold text-gray-500 tracking-widest uppercase">{lesson.file_type}</p>
          </div>
        )}
        
        {/* Icon Overlay Giữa (Giống Youtube) */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/0 transition-colors">
            <div className="w-12 h-12 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play size={20} className="text-white fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Môn Học Badge Góc Trên Phải */}
        <div className="absolute top-4 right-4 z-10">
          <Badge className="bg-white/90 text-primary hover:bg-white border-none shadow-sm backdrop-blur-md text-[10px] uppercase font-black tracking-widest">
            {lesson.subjects?.title || 'Chưa phân loại'}
          </Badge>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors flex-grow">
          {lesson.title}
        </h3>
        
        <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black tracking-tighter overflow-hidden ring-2 ring-white shadow-sm shrink-0">
               {lesson.profiles?.avatar_url ? (
                 <img src={lesson.profiles.avatar_url} className="w-full h-full object-cover" alt="avatar" />
               ) : (
                 getInitials(lesson.profiles?.full_name || 'Admin')
               )}
            </div>
            <div className="min-w-0">
               <p className="text-[11px] font-bold text-gray-700 truncate">
                 {lesson.profiles?.full_name || 'Quản trị viên'}
               </p>
               <p className="text-[9px] font-semibold text-gray-400">
                 {new Date(lesson.created_at).toLocaleDateString('vi-VN')}
               </p>
            </div>
          </div>
          
          <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 bg-gray-50 rounded-md text-gray-500 shrink-0 ml-2">
            {lesson.grade_level}
          </span>
        </div>
      </div>
    </div>
  )
}
