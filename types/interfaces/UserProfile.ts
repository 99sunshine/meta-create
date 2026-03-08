import type { Tables } from '../supabase'

// User profile from database
export type UserProfile = Tables<'profiles'>

// Partial profile for updates
export type UserProfileUpdate = Partial<Omit<UserProfile, 'id' | 'created_at' | 'email'>>

// Profile fields required for onboarding completion
export type OnboardingRequiredFields = Pick<
  UserProfile,
  'name' | 'email' | 'role' | 'city' | 'school'
>

// Full profile with all onboarding fields
export type CompleteProfile = OnboardingRequiredFields & {
  skills: string[]
  interests: string[]
  collab_style: string
  availability: string
  tags: string[]
  manifesto: string
  onboarding_complete: true
}
