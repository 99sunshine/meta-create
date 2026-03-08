# Auth System Documentation

## Overview
The auth system uses Supabase for authentication with magic link (passwordless) login, following a clean repository pattern adapted from Firebase-based mobile apps.

## Architecture

### File Structure
```
supabase/
├── auth.ts              # Server-side auth helpers (magic link, session, signout)
├── utils/
│   ├── client.ts        # Browser Supabase client (Client Components)
│   ├── server.ts        # Server Supabase client (Server Components/Actions)
│   └── middleware.ts    # Middleware helper for session refresh
└── repos/
    └── profile.ts       # ProfileRepository (CRUD for user profiles)

hooks/
└── useAuth.tsx          # Client-side auth context + provider

schemas/
└── profile.ts           # Zod validation schemas for profiles

middleware.ts            # Root middleware for session refresh
```

## Key Components

### 1. Server Auth (`supabase/auth.ts`)
Server Actions for authentication:
- `sendMagicLink(email)` - Send passwordless login link
- `signOutUser()` - Sign out and redirect
- `getCurrentSession()` - Get current session
- `getCurrentUser()` - Get current user from session
- `getCurrentUserId()` - Get user ID from session

### 2. Profile Repository (`supabase/repos/profile.ts`)
CRUD operations for user profiles:
- `getProfile(userId)` - Fetch profile (server-side)
- `getProfileClient(userId)` - Fetch profile (client-side)
- `createProfile(data)` - Create profile after signup
- `updateProfile(userId, updates)` - Update profile
- `completeOnboarding(userId)` - Mark onboarding complete
- `hasCompletedOnboarding(userId)` - Check onboarding status

### 3. Auth Hook (`hooks/useAuth.tsx`)
Client-side React context for auth state:
```tsx
const { user, sessionUser, loading, logout, forceRefresh } = useAuth()
```

**Fields:**
- `user: UserProfile | null` - Full user profile from database
- `sessionUser: User | null` - Supabase session user
- `loading: boolean` - Initial auth check + profile fetch
- `logout: () => Promise<void>` - Sign out function
- `forceRefresh: () => void` - Force re-check auth state

### 4. Validation (`schemas/profile.ts`)
Zod schemas for type safety:
- `profileSchema` - Full profile validation
- `profileUpdateSchema` - Partial updates (excludes immutable fields)
- `profileCreateSchema` - Initial profile creation

## Usage Examples

### Server Component (fetch profile)
```tsx
import { getCurrentUserId } from '@/supabase/auth'
import { ProfileRepository } from '@/supabase/repos/profile'

export default async function ProfilePage() {
  const userId = await getCurrentUserId()
  
  if (!userId) {
    redirect('/login')
  }
  
  const profileRepo = new ProfileRepository()
  const profile = await profileRepo.getProfile(userId)
  
  return <div>Welcome, {profile?.name}</div>
}
```

### Client Component (auth hook)
```tsx
'use client'

import { useAuth } from '@/hooks/useAuth'

export default function Dashboard() {
  const { user, loading, logout } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please sign in</div>
  
  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <button onClick={logout}>Sign out</button>
    </div>
  )
}
```

### Server Action (magic link)
```tsx
'use server'

import { sendMagicLink } from '@/supabase/auth'

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  
  try {
    await sendMagicLink(email)
    return { success: true }
  } catch (error) {
    return { error: (error as Error).message }
  }
}
```

## Flow Diagrams

### Login Flow
```
User enters email
  ↓
sendMagicLink(email)
  ↓
Supabase sends email
  ↓
User clicks link
  ↓
/auth/callback route
  ↓
Session created
  ↓
useAuth detects session
  ↓
Fetches profile
  ↓
User logged in
```

### Profile Fetch on Auth Change
```
useAuth mounted
  ↓
getSession()
  ↓
onAuthStateChange listener
  ↓
Session detected
  ↓
ProfileRepository.getProfileClient(userId)
  ↓
setUser(profile)
  ↓
loading = false
```

## Key Differences from Firebase Version

| Aspect | Firebase | Supabase |
|--------|----------|----------|
| Auth listener | `onAuthStateChanged` | `supabase.auth.onAuthStateChange` |
| Profile fetch | `getDoc` from Firestore | `ProfileRepository.getProfile` |
| Session vs Profile | `FirebaseUser` + separate doc | `session.user` + profiles table |
| Logout | `signOut` + router | `signOutUser` + revalidatePath |
| Database | Firestore | PostgreSQL with RLS |
| Type safety | Manual types | Auto-generated + Zod |

## Security Notes

### RLS (Row Level Security)
All database queries respect RLS policies. Example policy for profiles:
```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### Session Management
- Middleware refreshes session on every request
- Session stored in httpOnly cookies (Supabase default)
- PWA: Session persists in IndexedDB for offline

## Common Patterns

### Force Refresh After Onboarding
```tsx
const { forceRefresh } = useAuth()

async function completeOnboarding() {
  await updateProfile({ onboarding_complete: true })
  forceRefresh() // Re-fetch profile with new data
}
```

### Conditional Rendering
```tsx
const { user, loading } = useAuth()

if (loading) return <LoadingSpinner />
if (!user) return <LoginPrompt />
if (!user.onboarding_complete) return <OnboardingFlow />
return <Dashboard />
```

### Logout and Redirect
```tsx
const { logout } = useAuth()

await logout() // Automatically redirects to /login
```

## Troubleshooting

### Profile not loading
- Check RLS policies on `profiles` table
- Verify profile exists for user ID
- Check console for errors in ProfileRepository

### Session not persisting
- Verify middleware.ts is running (check Network tab)
- Check cookie settings (should be httpOnly, secure in prod)
- Verify `NEXT_PUBLIC_SITE_URL` in .env.local

### Auth state out of sync
- Call `forceRefresh()` to re-check
- Check for multiple AuthProvider instances
- Verify cleanup in useEffect (subscription.unsubscribe)

## Next Steps

For onboarding implementation, you'll need:
1. `/auth/callback` route to handle magic link
2. `/login` page with email form
3. Onboarding wizard (3 steps)
4. Profile creation flow after signup
