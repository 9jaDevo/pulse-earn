// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, Database } from '../lib/supabase'
import { ProfileService } from '../services/profileService'
import { ReferralService } from '../services/referralService'
import { SettingsService } from '../services/settingsService'
import { useToast } from '../hooks/useToast'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (
    email: string,
    password: string,
    name: string,
    country?: string,
    referralCode?: string
  ) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { successToast, errorToast } = useToast()

  // Fetch profile helper always clears `loading`
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await ProfileService.fetchProfileById(userId)
      if (error || !data) {
        console.warn('[Auth] No profile or error', error)
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('[Auth] fetchProfile exception', err)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  // Central handler for initial + realtime auth events
  const handleAuthChange = async (event: string, session: Session | null) => {
    console.log('[Auth] Event:', event, '→ Session?', !!session)

    // 1) On sign-out or token refresh failure, clear everything
    if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESH_FAILED') {
      setSession(null)
      setUser(null)
      setProfile(null)
      setLoading(false)
      return
    }

    // 2) On sign-in or initial boot, update session/user and fetch profile
    if (session?.user) {
      setSession(session)
      setUser(session.user)
      return fetchProfile(session.user.id)
    }

    // 3) Fallback: no session
    setSession(null)
    setUser(null)
    setProfile(null)
    setLoading(false)
  }

  useEffect(() => {
    let mounted = true

    // Subscribe to all auth events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, sess) => {
      if (!mounted) return
      handleAuthChange(event, sess)
    })

    // Immediately bootstrap from any persisted session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return
        handleAuthChange('INITIAL_SESSION', session)
      })
      .catch((err) => {
        console.error('[Auth] getSession error', err)
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // === Authentication actions ===

  const signUp = async (
    email: string,
    password: string,
    name: string,
    country?: string,
    referralCode?: string
  ) => {
    try {
      // Get referral bonus points from settings
      const { data: pointsSettings } = await SettingsService.getSettings('points');
      const referralBonusPoints = pointsSettings?.referralBonusPoints || 100; // Default to 100 if not set

      // Validate referral code if provided
      let referrerId: string | undefined;
      if (referralCode) {
        const { data: referralData, error: referralError } = await ReferralService.validateReferralCode(referralCode);
        
        if (referralError) {
          console.error('[Auth] Error validating referral code:', referralError);
        } else if (referralData?.valid) {
          referrerId = referralData.referrerId;
        }
      }

      const userData: Record<string, any> = { name }
      if (country) userData.country = country
      if (referrerId) userData.referred_by = referrerId

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: userData },
      })

      if (error) {
        throw error
      }

      // If there was a valid referral, process the bonus
      if (referrerId && user) {
        try {
          await ReferralService.processReferralBonus(referrerId, user.id);
          successToast(`Signed up with referral code! You earned ${referralBonusPoints} bonus points.`);
        } catch (err) {
          console.error('[Auth] Error processing referral bonus:', err);
          // Continue even if referral processing fails
        }
      }

      successToast('Account created successfully! You are now signed in.')
      return { error: null }
    } catch (error: any) {
      console.error('[Auth] signUp error', error)
      errorToast('Failed to create account. Please try again.')
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        // clear a bad/expired token if that's the issue
        if (/expired|invalid/.test(error.message)) {
          await supabase.auth.signOut()
        }
        errorToast('Invalid credentials or session expired.')
        setLoading(false)
        return { error }
      }

      // Check if user is suspended
      if (data.user) {
        const { data: userProfile } = await ProfileService.fetchProfileById(data.user.id)
        if (userProfile?.is_suspended) {
          // Sign out the user immediately
          await supabase.auth.signOut()
          errorToast('Your account has been suspended. Please contact support for assistance.')
          setLoading(false)
          return { error: { message: 'Account suspended' } }
        }
      }

      successToast('Welcome back! You are now signed in.')
      // onAuthStateChange → handleAuthChange will clear loading
      return { error: null }
    } catch (error: any) {
      console.error('[Auth] signIn exception', error)
      errorToast('An error occurred during sign in. Please try again.')
      setLoading(false)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      // clear local state immediately
      setUser(null)
      setProfile(null)
      setSession(null)
      successToast('You have been signed out successfully.')
      await supabase.auth.signOut()
    } catch (error: any) {
      console.error('[Auth] signOut error', error)
      errorToast('Failed to sign out. Please try again.')
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user logged in' }
    try {
      const { data, error } = await ProfileService.updateUserProfile(user.id, updates)
      if (error || !data) {
        throw error
      }
      setProfile(data)
      successToast('Profile updated successfully!')
      return { error: null }
    } catch (error: any) {
      console.error('[Auth] updateProfile error', error)
      errorToast('Failed to update profile. Please try again.')
      return { error }
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, session, loading, signUp, signIn, signOut, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}