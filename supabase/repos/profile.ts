import { createClient } from '../utils/client'
import type { UserProfile, UserProfileUpdate } from '@/types'
import { profileUpdateSchema, profileCreateSchema } from '@/schemas/profile'

export class ProfileRepository {
  /**
   * Get user profile by ID
   * Uses browser client - safe for Client Components
   * For Server Components, use createClient from utils/server directly
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - this is okay for new users
        return null
      }
      throw new Error(`Profile fetch failed: ${error.message}`)
    }

    return data as UserProfile
  }

  /**
   * Create initial profile after signup
   */
  async createProfile(profileData: {
    id: string
    email: string
    name: string
    role: string
  }): Promise<UserProfile> {
    const supabase = createClient()
    
    // Validate input
    const validated = profileCreateSchema.parse({
      ...profileData,
      locale: 'en',
      subscription_tier: 'free',
      onboarding_complete: false,
    })

    const { data, error } = await supabase
      .from('profiles')
      .insert(validated)
      .select()
      .single()

    if (error) {
      throw new Error(`Profile creation failed: ${error.message}`)
    }

    return data as UserProfile
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: UserProfileUpdate): Promise<UserProfile> {
    const supabase = createClient()
    
    // Validate updates with Zod
    const validated = profileUpdateSchema.parse(updates)

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Profile update failed: ${error.message}`)
    }

    return data as UserProfile
  }

  /**
   * Mark onboarding as complete
   */
  async completeOnboarding(userId: string): Promise<UserProfile> {
    return this.updateProfile(userId, { onboarding_complete: true })
  }

  /**
   * Check if user has completed onboarding
   */
  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    const profile = await this.getProfile(userId)
    return profile?.onboarding_complete ?? false
  }

  /**
   * Get profiles created in the last N days (for "New Creators This Week" section).
   * Only returns users who have completed onboarding (have a role set).
   */
  async getRecentProfiles(days = 7, limit = 20): Promise<UserProfile[]> {
    const supabase = createClient()
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .gte('created_at', since)
      .not('role', 'is', null)
      .eq('onboarding_complete', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(`Recent profiles fetch failed: ${error.message}`)
    return (data ?? []) as UserProfile[]
  }
}
