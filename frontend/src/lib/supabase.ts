import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storageKey: 'dorm-match-auth',
  },
})

export function getCurrentSchool(): string {
  return localStorage.getItem('schoolCode') || 'DEMO-UNI'
}

export function getCurrentUserId(): string {
  return localStorage.getItem('supabase_user_id') || ''
}

export function setAuthState(userId: string, token: string, refreshToken: string) {
  localStorage.setItem('supabase_user_id', userId)
  localStorage.setItem('token', token)
  localStorage.setItem('refreshToken', refreshToken)
}

export function clearAuthState() {
  ['token', 'refreshToken', 'userId', 'username', 'role', 'supabase_user_id'].forEach(k => localStorage.removeItem(k))
}