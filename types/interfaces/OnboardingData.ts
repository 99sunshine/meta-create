// Onboarding flow data structures

// Step 1: Ignition (Basic Info)
export interface OnboardingStep1 {
  name: string
  email: string
  city: string
  school: string
  avatar_url?: string
}

// Step 2: Your Universe (Skills & Role)
export interface OnboardingStep2 {
  role: string // Visionary | Builder | Strategist | Connector
  skills: string[]
  interests: string[]
  collab_style: string // Sprint-lover | Marathon-runner | Flexible
  availability: string // Available | Exploring | Unavailable
  hackathon_track?: string // Engineering | Society | Aesthetics | Open
  languages?: string[]
  major?: string
  education_level?: string
}

// Step 3: Launch (AI-generated tags & manifesto)
export interface OnboardingStep3 {
  tags: string[] // AI-generated personality tags (6-10)
  manifesto: string // AI-generated 1-sentence manifesto
  role: string // Confirmation from Step 2
}

// Complete onboarding data
export interface OnboardingData extends OnboardingStep1, OnboardingStep2, OnboardingStep3 {
  onboarding_complete: true
}

// Resume upload result (for AI parsing)
export interface ResumeParseResult {
  skills?: string[]
  education?: {
    school?: string
    major?: string
    level?: string
  }
  languages?: string[]
  interests?: string[]
}
