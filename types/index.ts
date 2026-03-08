// Re-export database types
export type { Database, Tables, TablesInsert, TablesUpdate } from './supabase'

// Re-export custom interfaces
  export type { 
  UserProfile, 
  UserProfileUpdate, 
  OnboardingRequiredFields,
  CompleteProfile 
} from './interfaces/UserProfile'

export type { 
  OnboardingData,
  OnboardingStep1,
  OnboardingStep2,
  OnboardingStep3,
  ResumeParseResult
} from './interfaces/OnboardingData'

export type { 
  Role, 
  RoleInfo, 
  RoleComplementarity 
} from './interfaces/Role'

export type {
  Availability,
  CollabStyle,
  HackathonTrack,
  EducationLevel,
  SubscriptionTier,
  Locale,
  TeamCategory,
  WorkCategory,
  CollabRequestType,
  CollabRequestStatus
} from './interfaces/Enums'

export { ROLE_COMPLEMENTARITY } from './interfaces/Role'
