// Enum types for user profile fields
// These should be fetched from DB tables but typed here for TypeScript safety

export type Availability = 'Available' | 'Exploring' | 'Unavailable'

export type CollabStyle = 'Sprint-lover' | 'Marathon-runner' | 'Flexible'

export type HackathonTrack = 'Engineering' | 'Society' | 'Aesthetics' | 'Open'

export type EducationLevel = 'High School' | 'Undergraduate' | 'Graduate' | 'PhD' | 'Other'

export type SubscriptionTier = 'free' | 'pro' | 'team'

export type Locale = 'en' | 'zh'

// Category types for teams and works
export type TeamCategory = 'Hackathon' | 'Project' | 'Startup' | 'Research' | 'Creative' | 'Other'

export type WorkCategory = 'Engineering' | 'Design' | 'Art' | 'Science' | 'Business' | 'Other'

// Collab request types
export type CollabRequestType = 'join_project' | 'invite_to_team' | 'just_connect'

export type CollabRequestStatus = 'pending' | 'accepted' | 'declined' | 'expired'
