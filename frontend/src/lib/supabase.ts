import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const unavailableError = new Error('Supabase unavailable: missing environment variables')

function createUnavailableQuery() {
  const response = async () => ({ data: null, error: unavailableError, count: 0 })
  const query: any = {
    select: () => query,
    insert: () => query,
    update: () => query,
    upsert: () => query,
    delete: () => query,
    eq: () => query,
    neq: () => query,
    in: () => query,
    or: () => query,
    order: () => query,
    range: () => query,
    limit: () => query,
    single: response,
    maybeSingle: response,
    then: (resolve: any, reject: any) => response().then(resolve, reject),
    catch: (reject: any) => response().catch(reject),
    finally: (handler: any) => response().finally(handler),
  }
  return query
}

function createUnavailableSupabase() {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: unavailableError }),
      signUp: async () => { throw unavailableError },
      signInWithPassword: async () => { throw unavailableError },
      signOut: async () => ({}),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => createUnavailableQuery(),
    rpc: async () => ({ data: null, error: unavailableError }),
  } as any
}

// 创建 Supabase 客户端（含超时配置，防止网络不通时长时间挂起）
let supabase: any
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase Init Warning] Missing environment variables. App will run in limited fallback mode.')
  supabase = createUnavailableSupabase()
} else try {
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
  supabase = createUnavailableSupabase()
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
