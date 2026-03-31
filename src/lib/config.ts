// App configuration from environment variables
export const config = {
  appName: import.meta.env.VITE_APP_NAME || '내 집 찾기',
  appSubtitle: import.meta.env.VITE_APP_SUBTITLE || '내 집 마련 프로젝트',
  password: import.meta.env.VITE_PASSWORD || 'house2026',
  moveTarget: import.meta.env.VITE_MOVE_TARGET || '', // YYYY-MM-DD, empty = no deadline
  workplace: import.meta.env.VITE_WORKPLACE || '회사',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseKey: import.meta.env.VITE_SUPABASE_KEY || '',
}

export const hasSupabase = () => !!config.supabaseUrl && !!config.supabaseKey
