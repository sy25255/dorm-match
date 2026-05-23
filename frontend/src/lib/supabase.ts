import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env file.')
}

// 创建 Supabase 客户端（含超时配置，防止网络不通时长时间挂起）
let supabase: ReturnType<typeof createClient>
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storageKey: 'dorm-match-auth',
    },
    global: {
      fetch: (...args: Parameters<typeof fetch>) => {
        // 为所有请求添加 10 秒超时，防止 Supabase 不可用时页面挂起
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('Request timeout: Supabase unreachable')), 10000)
          fetch(...args).then(
            (res) => { clearTimeout(timer); resolve(res) },
            (err) => { clearTimeout(timer); reject(err) }
          )
        })
      },
    },
  })
} catch (e) {
  console.error('[Supabase Init Error]', e)
  // 创建一个 mock 客户端，防止应用崩溃
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signUp: async () => { throw new Error('Supabase unavailable') },
      signInWithPassword: async () => { throw new Error('Supabase unavailable') },
      signOut: async () => ({}),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: new Error('Supabase unavailable') }) }) }),
      upsert: async () => ({ error: new Error('Supabase unavailable') }),
      insert: async () => ({ error: new Error('Supabase unavailable') }),
    }),
    rpc: async () => ({ data: null, error: new Error('Supabase unavailable') }),
  } as any
}

export { supabase }

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