import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { config } from '../lib/config.ts'

const PASSWORD = config.password

interface Props {
  onLogin: () => void
}

export function LoginPage({ onLogin }: Props) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)
  const [rememberPw, setRememberPw] = useState(!!localStorage.getItem('house-hunter-saved-pw'))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pw === PASSWORD) {
      sessionStorage.setItem('house-hunter-authed', '1')
      if (rememberPw) {
        localStorage.setItem('house-hunter-saved-pw', pw)
      } else {
        localStorage.removeItem('house-hunter-saved-pw')
      }
      onLogin()
    } else {
      setError(true)
      setPw('')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="card p-8 w-full max-w-sm text-center">
        <div className="text-4xl mb-3">🏠</div>
        <h1 className="text-xl font-bold mb-1">{config.appName}</h1>
        <p className="text-sm text-text-secondary mb-6">{config.appSubtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="password"
              value={pw}
              onChange={e => { setPw(e.target.value); setError(false) }}
              placeholder="비밀번호"
              autoFocus
              className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm ${
                error ? 'border-danger' : 'border-border'
              }`}
            />
          </div>
          {error && <p className="text-xs text-danger">비밀번호가 틀렸어요</p>}
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={rememberPw}
              onChange={e => setRememberPw(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-primary"
            />
            비밀번호 저장
          </label>
          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-lg font-medium text-sm"
          >
            들어가기
          </button>
        </form>
      </div>
    </div>
  )
}
