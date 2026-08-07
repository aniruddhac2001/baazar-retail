"use client"

import { useEffect, useState } from 'react'
import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, getUsers, getVendors, onAuthStateChange } from './index'
import type { User, Vendor } from './types'

export function useSupabaseAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let subscription: ReturnType<typeof onAuthStateChange> | null = null

    async function initialize() {
      const { data } = await supabase.auth.getSession()
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)

      subscription = onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
        setSession(session)
        setUser(session?.user ?? null)
      })
    }

    initialize()

    return () => {
      if (subscription && 'data' in subscription) {
        subscription.data.subscription.unsubscribe()
      }
    }
  }, [])

  return { session, user, loading }
}

export function useVendorList() {
  const [vendors, setVendors] = useState<Vendor[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchVendors() {
      try {
        const result = await getVendors()
        setVendors(result ?? [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchVendors()
  }, [])

  return { vendors, loading, error }
}

export function useUserList() {
  const [users, setUsers] = useState<User[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchUsers() {
      try {
        const result = await getUsers()
        setUsers(result ?? [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  return { users, loading, error }
}
