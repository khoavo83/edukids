"use client"

import { useState, useEffect, useMemo } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  UtensilsCrossed, Plus, ChevronLeft, ChevronRight, Pencil, Trash2, 
  Save, Image as ImageIcon, CalendarDays 
} from 'lucide-react'

const DAYS = [
  { value: 2, label: 'Thứ 2' },
  { value: 3, label: 'Thứ 3' },
  { value: 4, label: 'Thứ 4' },
  { value: 5, label: 'Thứ 5' },
  { value: 6, label: 'Thứ 6' },
  { value: 7, label: 'Thứ 7' },
]

const MEALS: Record<string, { label: string; color: string; bg: string }> = {
  sang: { label: 'Bữa sáng', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  trua: { label: 'Bữa trưa', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  xe: { label: 'Bữa xế', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
  phu: { label: 'Bữa phụ', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
}

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function MenusPage() {
  const supabase = createClient()
  const { user, hasRoleAbove } = useAuth()
  const canEdit = hasRoleAbove('bgh')

  const [menus, setMenus] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(() => getWeekStart(new Date()))

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editMenu, setEditMenu] = useState<any>(null)
  const [menuForm, setMenuForm] = useState({
    day_of_week: 2,
    meal_type: 'sang',
    description: '',
    image_url: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  const fetchMenus = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('menus')
      .select('*')
      .eq('week_start_date', currentWeek)
      .order('day_of_week')
      .order('meal_type')

    if (data) setMenus(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchMenus()
  }, [currentWeek])

  const navigateWeek = (direction: number) => {
    const d = new Date(currentWeek)
    d.setDate(d.getDate() + direction * 7)
    setCurrentWeek(getWeekStart(d))
  }

  // Tổ chức data theo ngày + bữa
  const menuGrid = useMemo(() => {
    const grid: Record<number, Record<string, any>> = {}
    DAYS.forEach(day => {
      grid[day.value] = {}
      Object.keys(MEALS).forEach(meal => {
        grid[day.value][meal] = null
      })
    })
    menus.forEach(m => {
      if (grid[m.day_of_week]) {
        grid[m.day_of_week][m.meal_type] = m
      }
    })
    return grid
  }, [menus])

  const openAddDialog = (day: number, meal: string) => {
    setEditMenu(null)
    setMenuForm({ day_of_week: day, meal_type: meal, description: '', image_url: '' })
    setIsDialogOpen(true)
  }

  const openEditDialog = (menu: any) => {
    setEditMenu(menu)
    setMenuForm({
      day_of_week: menu.day_of_week,
      meal_type: menu.meal_type,
      description: menu.description,
      image_url: menu.image_url || '',
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!menuForm.description.trim()) return
    setIsSaving(true)

    if (editMenu) {
      // Update
      await supabase
        .from('menus')
        .update({
          description: menuForm.description,
          image_url: menuForm.image_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editMenu.id)
    } else {
      // Insert
      await supabase.from('menus').insert({
        week_start_date: currentWeek,
        day_of_week: menuForm.day_of_week,
        meal_type: menuForm.meal_type,
        description: menuForm.description,
        image_url: menuForm.image_url || null,
        created_by: user?.id,
      })
    }

    setIsSaving(false)
    setIsDialogOpen(false)
    fetchMenus()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa món ăn này?')) return
    await supabase.from('menus').delete().eq('id', id)
    fetchMenus()
  }

  // Tính ngày cuối tuần
  const weekEnd = new Date(currentWeek)
  weekEnd.setDate(weekEnd.getDate() + 5)

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <UtensilsCrossed className="text-primary" size={28} />
            Quản lý Thực đơn
          </h1>
          <p className="text-gray-500 mt-1">Lên thực đơn dinh dưỡng theo tuần cho các bé.</p>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="glass-card rounded-2xl p-4 mb-8 flex items-center justify-between">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigateWeek(-1)}>
          <ChevronLeft size={20} />
        </Button>
        <div className="text-center">
          <div className="flex items-center gap-2 justify-center">
            <CalendarDays size={18} className="text-primary" />
            <span className="text-lg font-bold text-gray-900">
              Tuần: {formatDate(currentWeek)} — {formatDate(weekEnd.toISOString())}
            </span>
          </div>
          <button 
            onClick={() => setCurrentWeek(getWeekStart(new Date()))}
            className="text-xs text-primary font-semibold hover:underline mt-1"
          >
            Về tuần hiện tại
          </button>
        </div>
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigateWeek(1)}>
          <ChevronRight size={20} />
        </Button>
      </div>

      {/* Menu Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header row */}
          <div className="grid grid-cols-[120px_repeat(6,1fr)] gap-2 mb-2">
            <div className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Bữa ăn</div>
            {DAYS.map(day => {
              const dayDate = new Date(currentWeek)
              dayDate.setDate(dayDate.getDate() + day.value - 2)
              return (
                <div key={day.value} className="p-3 text-center">
                  <div className="text-sm font-bold text-gray-900">{day.label}</div>
                  <div className="text-[10px] text-gray-400">{dayDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</div>
                </div>
              )
            })}
          </div>

          {/* Rows: mỗi bữa */}
          {Object.entries(MEALS).map(([mealKey, meal]) => (
            <div key={mealKey} className="grid grid-cols-[120px_repeat(6,1fr)] gap-2 mb-2">
              {/* Meal label */}
              <div className={`p-3 rounded-xl border ${meal.bg} flex items-center justify-center`}>
                <span className={`text-xs font-bold ${meal.color}`}>{meal.label}</span>
              </div>

              {/* Cells */}
              {DAYS.map(day => {
                const item = menuGrid[day.value]?.[mealKey]
                return (
                  <div
                    key={`${day.value}-${mealKey}`}
                    className={`rounded-xl border p-3 min-h-[90px] transition-all group relative ${
                      item 
                        ? 'bg-white border-gray-200 hover:border-primary/30 hover:shadow-sm' 
                        : 'bg-gray-50/50 border-dashed border-gray-200 hover:border-primary/30'
                    }`}
                  >
                    {item ? (
                      <>
                        <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{item.description}</p>
                        {item.image_url && (
                          <div className="mt-2">
                            <img src={item.image_url} alt="" className="w-full h-12 object-cover rounded-lg" />
                          </div>
                        )}
                        {canEdit && (
                          <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button 
                              onClick={() => openEditDialog(item)}
                              className="w-6 h-6 bg-white rounded-lg shadow border border-gray-100 flex items-center justify-center text-blue-500 hover:bg-blue-50"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="w-6 h-6 bg-white rounded-lg shadow border border-gray-100 flex items-center justify-center text-red-500 hover:bg-red-50"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </>
                    ) : canEdit ? (
                      <button 
                        onClick={() => openAddDialog(day.value, mealKey)}
                        className="w-full h-full flex items-center justify-center text-gray-300 hover:text-primary transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                        Chưa có
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Dialog thêm/sửa */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-3xl glass-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed size={20} className="text-primary" />
              {editMenu ? 'Sửa Thực đơn' : 'Thêm Thực đơn'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ngày</Label>
                <div className="h-11 px-4 rounded-xl border bg-gray-50 flex items-center text-sm text-gray-600">
                  {DAYS.find(d => d.value === menuForm.day_of_week)?.label}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bữa</Label>
                <div className={`h-11 px-4 rounded-xl border flex items-center text-sm font-semibold ${MEALS[menuForm.meal_type]?.bg} ${MEALS[menuForm.meal_type]?.color}`}>
                  {MEALS[menuForm.meal_type]?.label}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nội dung thực đơn *</Label>
              <textarea
                value={menuForm.description}
                onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-primary/10 outline-none min-h-[100px] resize-none"
                placeholder="VD: Cháo thịt bò + rau cải, Sữa chua..."
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <ImageIcon size={14} className="text-gray-400" />
                Link hình ảnh (tùy chọn)
              </Label>
              <Input
                value={menuForm.image_url}
                onChange={(e) => setMenuForm({ ...menuForm, image_url: e.target.value })}
                className="rounded-xl h-11"
                placeholder="https://example.com/hinh-com.jpg"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving || !menuForm.description.trim()}
              className="w-full rounded-xl h-12 font-bold gap-2 shadow-lg shadow-primary/20"
            >
              {isSaving ? <span className="animate-spin">⏳</span> : <Save size={18} />}
              {isSaving ? 'Đang lưu...' : editMenu ? 'Cập nhật' : 'Thêm vào thực đơn'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
