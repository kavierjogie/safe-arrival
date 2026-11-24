import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import { supabase, requireAdminAuth } from '../lib/supabase'
import { Button, Field, Logo, inputCls } from '../components/common/ui'

export default function AdminLoginPage() {
  const nav = useNavigate()
  const from = useLocation().state?.from ?? '/operations'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.')
    setBusy(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (err) return setError('Sign-in failed. Check your email and password.')
    nav(from, { replace: true })
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-navy px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <Logo />
        <h1 className="mt-6 flex items-center gap-2 text-xl font-semibold"><LockKeyhole className="size-5 text-teal-ink" aria-hidden />Staff sign-in</h1>
        {requireAdminAuth ? (
          <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
            <Field label="Email"><input type="email" autoComplete="username" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
            <Field label="Password"><input type="password" autoComplete="current-password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
            {error && <p role="alert" className="text-sm text-alert-ink">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
            <p className="text-xs text-muted">Accounts are created by an administrator in Supabase Auth.</p>
          </form>
        ) : (
          <div className="mt-3 space-y-4 text-sm text-slate-600">
            <p>Staff sign-in is <strong>off</strong> for this demo so judges can explore the dashboards freely.</p>
            <p>To require it, connect Supabase and set <code className="rounded bg-slate-100 px-1">VITE_REQUIRE_ADMIN_AUTH=true</code>.</p>
            <Button as={Link} to="/operations" className="w-full">Continue to operations (demo)</Button>
          </div>
        )}
      </div>
    </div>
  )
}
