import { supabase, getCurrentUserId } from '@/lib/supabase'

const wrap = (data: any) => ({ data: { code: 200, message: 'ok', data } })

export const notificationApi = {
  async getList(params?: { isRead?: number }) {
    const uid = getCurrentUserId()
    let q = supabase.from('notifications').select('*').eq('user_id', uid)
    if (params?.isRead !== undefined) q = q.eq('is_read', params.isRead)
    const { data } = await q.order('created_at', { ascending: false })
    return wrap(data || [])
  },

  async getUnreadCount() {
    const uid = getCurrentUserId()
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('is_read', 0)
    return wrap({ count: count || 0 })
  },

  async markRead(id: number) {
    await supabase.from('notifications').update({ is_read: 1 }).eq('id', id)
    return wrap(null)
  },

  async markAllRead() {
    const uid = getCurrentUserId()
    await supabase.from('notifications').update({ is_read: 1 }).eq('user_id', uid)
    return wrap(null)
  },
}