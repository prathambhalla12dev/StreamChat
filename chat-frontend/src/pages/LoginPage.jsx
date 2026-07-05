import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import BrandPanel from '../components/BrandPanel'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/chat')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-screen bg-base">
      <BrandPanel />

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-muted text-sm mt-1.5">Sign in to keep the conversation going.</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-coral/10 border border-coral/20 text-coral text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface border border-border text-ink placeholder:text-faint focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors text-sm"
                placeholder="alice"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-surface border border-border text-ink placeholder:text-faint focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-muted transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-dim disabled:opacity-60 text-white font-medium text-sm transition-colors mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  Sign in
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            New here?{' '}
            <Link to="/register" className="text-accent-glow hover:text-accent font-medium transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
