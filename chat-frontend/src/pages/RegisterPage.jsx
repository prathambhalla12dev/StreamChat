import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import BrandPanel from '../components/BrandPanel'

export default function RegisterPage() {
  const { register, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      await login(form.username, form.password)
      navigate('/chat')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const passwordValid = form.password.length >= 8

  return (
    <div className="flex h-screen w-screen bg-base">
      <BrandPanel />

      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-sm animate-fade-up py-8">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Create your account</h2>
            <p className="text-muted text-sm mt-1.5">Join the conversation — it only takes a minute.</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-coral/10 border border-coral/20 text-coral text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Username</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => update('username', e.target.value)}
                  required
                  minLength={3}
                  maxLength={30}
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface border border-border text-ink placeholder:text-faint focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors text-sm"
                  placeholder="alice"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Display name</label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => update('displayName', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-surface border border-border text-ink placeholder:text-faint focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors text-sm"
                  placeholder="Alice"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface border border-border text-ink placeholder:text-faint focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors text-sm"
                placeholder="alice@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                required
                minLength={8}
                className="w-full px-3.5 py-2.5 rounded-lg bg-surface border border-border text-ink placeholder:text-faint focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-colors text-sm"
                placeholder="At least 8 characters"
              />
              {form.password.length > 0 && (
                <div className={`flex items-center gap-1.5 mt-1.5 text-xs ${passwordValid ? 'text-signal' : 'text-faint'}`}>
                  <CheckCircle2 size={12} />
                  {passwordValid ? 'Strong enough' : 'Minimum 8 characters'}
                </div>
              )}
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
                  <UserPlus size={16} />
                  Create account
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-glow hover:text-accent font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
