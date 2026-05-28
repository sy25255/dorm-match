import { supabase, getCurrentSchool, getCurrentUserId } from '@/lib/supabase'

export interface RoomMessage {
  from: string
  fromName: string
  text: string
  time: string
}

function isMissingTable(error: any) {
  const text = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`
  return error?.code === '42P01' || text.includes('room_messages') || text.includes('does not exist')
}

export const chatApi = {
  async list(roomNumber: string): Promise<RoomMessage[] | null> {
    const { data, error } = await supabase
      .from('room_messages')
      .select('user_id, user_name, message, created_at')
      .eq('school_code', getCurrentSchool())
      .eq('room_number', roomNumber)
      .order('created_at', { ascending: true })
      .limit(200)

    if (error) {
      if (isMissingTable(error)) return null
      throw error
    }

    return (data || []).map((row: any) => ({
      from: row.user_id || '',
      fromName: row.user_name || '',
      text: row.message || '',
      time: row.created_at || '',
    }))
  },

  async send(roomNumber: string, text: string, userName: string) {
    const { error } = await supabase.from('room_messages').insert({
      school_code: getCurrentSchool(),
      room_number: roomNumber,
      user_id: getCurrentUserId(),
      user_name: userName,
      message: text,
    })
    if (error) {
      if (isMissingTable(error)) return false
      throw error
    }
    return true
  },
}
