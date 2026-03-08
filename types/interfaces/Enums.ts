// Enum types for user profile fields
// These match the database check constraints exactly
// See: profiles table check constraints in Supabase

export type Availability = 'weekends' | 'evenings' | 'flexible' | 'full-time'

export type CollabStyle = string // No DB constraint - can be any text

export type HackathonTrack = 'Engineering' | 'Design' | 'Business' | 'Science' | 'Social Impact'

export type EducationLevel = 'Undergrad' | 'Master' | 'PhD' | 'Professional'

export type SubscriptionTier = 'free' | 'premium'

export type Locale = 'en' | 'zh'

// Category types for teams and works
export type TeamCategory = 'Hackathon' | 'Project' | 'Startup' | 'Research' | 'Creative' | 'Other'

export type WorkCategory = 'Engineering' | 'Design' | 'Art' | 'Science' | 'Business' | 'Other'

// Collab request types
export type CollabRequestType = 'join_project' | 'invite_to_team' | 'just_connect'

export type CollabRequestStatus = 'pending' | 'accepted' | 'declined' | 'expired'
