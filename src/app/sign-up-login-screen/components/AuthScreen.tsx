"use client"

import { useState } from 'react'
import { signInWithEmail, signUpWithEmail, useSupabaseAuth } from '@/lib/supabase'

export default function AuthScreen() {
  const { session, user, loading } = useSupabaseAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    try {
      if (mode === 'login') {
        const { error } = await signInWithEmail(email, password)
        if (error) throw error
      } else {
        const { error } = await signUpWithEmail(email, password)
        if (error) throw error
      }
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-10 shadow-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-900">{mode === 'login' ? 'Sign in' : 'Sign up'}</h1>
          <p className="mt-2 text-slate-600">Use your Supabase account credentials to continue.</p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-100 p-6 text-center text-slate-700">
            Loading auth state...
          </div>
        ) : session ? (
          <div className="rounded-3xl border border-emerald-300 bg-emerald-50 p-6 text-center text-emerald-900">
            <p className="text-lg font-medium">Signed in as {user?.email}</p>
            <p className="mt-2 text-sm text-slate-600">You can now access the admin dashboard or register a vendor.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error ? <p className="rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-3xl bg-indigo-600 px-6 py-3 text-white transition hover:bg-indigo-700"
            >
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>

            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-6 py-3 text-slate-900 transition hover:border-indigo-300 hover:bg-indigo-50"
            >
              {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
