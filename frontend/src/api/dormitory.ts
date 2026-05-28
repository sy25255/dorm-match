import { supabase, getCurrentSchool } from '@/lib/supabase'

function getFallbackCapacity() {
  try {
    const stored = localStorage.getItem('demo_room_capacity')
    const value = stored ? Number(stored) : 8
    return Number.isFinite(value) && value > 0 ? value : 8
  } catch {
    return 8
  }
}

export async function getDefaultRoomCapacity() {
  const sc = getCurrentSchool()
  const { data, error } = await supabase
    .from('dormitory_rooms')
    .select('capacity')
    .eq('school_code', sc)
    .neq('status', 'MAINTENANCE')

  if (error) return getFallbackCapacity()

  const capacities = (data || [])
    .map((row: any) => Number(row.capacity))
    .filter((value: number) => Number.isFinite(value) && value > 0)

  if (capacities.length === 0) return getFallbackCapacity()

  const counts = new Map<number, number>()
  capacities.forEach((value: number) => counts.set(value, (counts.get(value) || 0) + 1))

  return [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0]
}
