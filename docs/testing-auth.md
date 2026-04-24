# Testing Auth Flow

## Server Running
✅ Development server: http://localhost:3000

## Test Flow

### 1. Visit Home Page
- Go to http://localhost:3000
- Should see "MetaCreate 🚀" landing page
- Click "Sign In" button

### 2. Login Page
- Enter your email
- Click "Send Magic Link"
- Should see "Check your email! 📧" confirmation

### 3. Check Email
- Open your email inbox
- Find magic link from Supabase
- Click the link (will redirect to /auth/callback)

### 4. Auth Callback
- Magic link processes automatically
- Redirects to /onboarding

### 5. Onboarding Flow

**Step 1: Ignition 🔥**
- Enter your name
- Enter city (e.g., "New York")
- Enter school (e.g., "Columbia University")
- Click "Next →"

**Step 2: Your Universe 🌌**
- Select a role: Visionary, Builder, Strategist, or Connector
- Select collaboration style: Sprint-lover, Marathon-runner, or Flexible
- Select availability: Available, Exploring, or Unavailable
- Click "Next →"

**Step 3: Launch 🚀**
- Optionally add a manifesto
- Review profile summary
- Click "Launch Profile 🚀"

### 6. Home Page (Authenticated)
- Should see welcome message with your name
- Profile details displayed
- "Sign Out" button available

### 7. Test Logout
- Click "Sign Out"
- Should redirect to /login
- Session cleared

## What to Check

✅ **Magic link arrives in email**
✅ **Callback redirects to onboarding**
✅ **Onboarding saves profile to database**
✅ **Auth state persists on page reload**
✅ **Logout clears session**
✅ **Protected routes work (can't access /onboarding if not logged in)**

## Troubleshooting

### Magic link not received
- Check spam folder
- Verify email in Supabase dashboard
- Check NEXT_PUBLIC_SITE_URL in .env.local

### Callback fails
- Check browser console for errors
- Verify Supabase URL/key in .env.local
- Check Supabase Auth settings (email templates, redirect URLs)

### Profile not saving
- Check browser console
- Verify RLS policies on profiles table
- Check Supabase logs in dashboard

### Session not persisting
- Clear browser cookies
- Check middleware is running (Network tab)
- Verify createClient functions are typed correctly

## Database Check

After completing onboarding, check Supabase:
1. Go to Table Editor
2. Open `profiles` table
3. You should see your profile with:
   - name, city, school filled
   - role selected
   - onboarding_complete = true
   - timestamps

## Next Steps After Testing

Once basic flow works:
- Add AI features (resume parsing, tag generation)
- Add skills/interests selection
- Add avatar upload
- Style onboarding with cosmic theme
- Add validation and error handling
- Add loading states and animations
