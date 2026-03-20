# Dual Authentication System

## Overview
MetaCreate now supports **both password-based authentication AND magic link authentication** on separate, dedicated pages.

## User Experience

### Two Separate Pages
1. **Login Page** (`/login`) - For existing users
2. **Sign Up Page** (`/signup`) - For new users
3. **Cross-navigation** - Easy links to switch between pages

### Each Page Features
1. **Method Toggle**: Password vs Magic Link
2. **Clean, focused interface** for each use case
3. **Navigation links** at bottom to switch pages

### Authentication Methods

#### 1. Password Authentication
**Sign Up:**
- User enters email + password (min 6 characters)
- Account created immediately
- Email confirmation sent (optional based on Supabase settings)
- Redirects to onboarding

**Login:**
- User enters email + password
- Instant authentication
- Redirects to home if onboarded, otherwise to onboarding

#### 2. Magic Link Authentication
**How it works:**
- User enters email only
- Magic link sent to inbox
- Click link → auto-login
- No password needed

## Implementation Details

### Files Modified

#### 1. `/supabase/auth.ts`
Added three new server actions:
- `signUpWithPassword(email, password)` - Create new account
- `signInWithPassword(email, password)` - Login with credentials
- `sendMagicLink(email)` - Send passwordless login link (existing)

#### 2. `/app/(auth)/login/page.tsx`
Login page with:
- Method switching (Password/Magic Link)
- Email + password fields for password method
- Email only for magic link method
- Link to signup page at bottom
- Error handling for all flows
- Success states (email sent confirmation)

#### 3. `/app/(auth)/signup/page.tsx`
Sign up page with:
- Method switching (Password/Magic Link)
- Email + password + confirm password for password method
- Email only for magic link method
- Link to login page at bottom
- Password matching validation
- Error handling and success states

#### 4. `/app/auth/callback/route.ts`
Enhanced to:
- Check if user has completed onboarding
- Redirect to `/onboarding` for new users
- Redirect to `/` for returning users

#### 5. `/hooks/useAuth.tsx`
Added router integration for logout redirect

## Supabase Configuration

### Email Settings
In your Supabase dashboard:
1. Go to **Authentication → Email Templates**
2. Customize confirmation email (for sign ups)
3. Customize magic link email

### Password Requirements
Default: Minimum 6 characters (configurable in auth.ts validation)

### Email Confirmation
- **Optional**: Can be disabled in Supabase dashboard
- **Recommended**: Enable for production
- If enabled: Users must click confirmation link before first login

## Testing Guide

### Test Password Sign Up
1. Go to http://localhost:3000/signup
2. Select "Password" method
3. Enter email, password, and confirm password (min 6 chars)
4. Click "Create Account"
5. Check email for confirmation (if enabled in Supabase)
6. Should redirect to onboarding

### Test Password Login
1. Go to http://localhost:3000/login
2. Select "Password" method
3. Enter credentials
4. Click "Sign In"
5. Should redirect to home (or onboarding if incomplete)

### Test Magic Link (Login)
1. Go to http://localhost:3000/login
2. Select "Magic Link"
3. Enter email
4. Check inbox for magic link
5. Click link → auto-login

### Test Magic Link (Sign Up)
1. Go to http://localhost:3000/signup
2. Select "Magic Link"
3. Enter email
4. Check inbox for magic link
5. Click link → redirects to onboarding

### Test Navigation Between Pages
1. On login page, click "Create one now" link
2. Should navigate to signup page
3. On signup page, click "Sign in instead" link
4. Should navigate back to login page

## Security Features

✅ **Password hashing** - Handled by Supabase (bcrypt)
✅ **Email verification** - Configurable
✅ **Magic link expiration** - 1 hour (Supabase default)
✅ **Session management** - httpOnly cookies
✅ **CSRF protection** - Built into Supabase Auth
✅ **Rate limiting** - Supabase default limits apply

## User Flow Diagrams

### Password Sign Up
```
Enter email + password
  ↓
Account created in Supabase
  ↓
Email confirmation sent (if enabled)
  ↓
Redirect to /onboarding
```

### Password Login
```
Enter email + password
  ↓
Supabase validates credentials
  ↓
Session created
  ↓
Check onboarding_complete
  ↓
Redirect to / or /onboarding
```

### Magic Link
```
Enter email
  ↓
Magic link sent
  ↓
User clicks link
  ↓
/auth/callback processes token
  ↓
Check onboarding_complete
  ↓
Redirect to / or /onboarding
```

## Next Steps

### Recommended Enhancements
1. **Forgot Password**: Add password reset flow
2. **Social OAuth**: Google, GitHub, etc.
3. **2FA**: Two-factor authentication
4. **Password Strength Meter**: Visual feedback
5. **Remember Me**: Persistent sessions

### Code Improvements
- Add password validation regex (uppercase, numbers, special chars)
- Add rate limiting on client side
- Add toast notifications instead of error text
- Add loading skeleton for better UX

## Troubleshooting

### "Invalid login credentials"
- Check password is correct
- Verify email is confirmed (if required)
- Check Supabase logs in dashboard

### Magic link not received
- Check spam folder
- Verify SMTP settings in Supabase
- Check rate limits (max 4 emails per hour per email)

### Redirect issues
- Verify `NEXT_PUBLIC_SITE_URL` in `.env.local`
- Check Supabase Auth redirect URLs in dashboard
- Must include both `http://localhost:3000/auth/callback` and production URL

## Migration Notes

### Existing Users
- Users who signed up with magic link can now set a password
- Add a "Set Password" feature in settings (future work)

### Database
- No schema changes needed
- Supabase handles password storage in `auth.users` table
- Profile table (`profiles`) unchanged
