# Create Team & Work Implementation Plan

## Overview
Add ability for users to create teams and works from both Explore page and Profile page using modal forms with FAB (Floating Action Button).

## Requirements from PRD

### Team Creation (Section 7.5)
- Required: Team name, description (50-500 chars), primary category
- Optional: Looking-for roles, target event, external chat link
- Creator automatically becomes owner and first member
- is_open defaults to true

### Work Creation (Section 7.6)
- Required: Title (5-80 chars), Description (20-500 chars), Category
- Optional: Tags (1-5), Images (URLs for MVP), Links
- Supported formats: JPG, PNG, WebP images; External links

## Implementation Phases

### Phase 1: Data Layer & Forms (Current)
Build the foundation without UI integration

**Deliverables:**
1. Zod validation schemas for team and work creation
2. Repository create methods (createTeam, createWork)
3. CreateTeamForm component with full validation
4. CreateWorkForm component with full validation
5. CreateModal wrapper component

**Why Phase 1 First:**
- Establishes data contracts (schemas)
- Creates reusable form components
- Can be tested independently before integration
- No dependencies on profile page or navigation

### Phase 2: Integration & Profile Page (Next)
Integrate forms into UI with FAB and profile page

**Deliverables:**
1. FloatingActionButton component with menu
2. Profile page (/profile route) with user's works/teams
3. Integration of FAB into Explore page
4. Integration of FAB into Profile page
5. Auto-refresh feed after creation

**Why Phase 2 Second:**
- Requires working forms from Phase 1
- Profile page is a larger undertaking
- FAB needs both form types to be functional
- Can test Phase 1 forms independently first

## Phase 1 Details

### Step 1: Create Schemas
Files: `schemas/team.ts`, `schemas/work.ts`

Team schema validation:
- name: 3-100 chars
- description: 50-500 chars
- category: enum
- looking_for_roles: optional array
- external_chat_link: optional URL
- is_open: boolean (default true)
- max_members: 2-6 (default 6)

Work schema validation:
- title: 5-80 chars
- description: 20-500 chars
- category: enum
- tags: 1-5 strings (optional)
- images: array of URLs, max 9 (optional)
- links: array of URLs (optional)

### Step 2: Repository Methods
Files: `supabase/repos/teams.ts`, `supabase/repos/works.ts`

TeamsRepository.createTeam():
- Validates input with Zod
- Inserts team into teams table
- Inserts creator into team_members table
- Returns TeamWithMembers

WorksRepository.createWork():
- Validates input with Zod
- Inserts work into works table
- Returns WorkWithCreator

### Step 3: Form Components
Files: `components/features/create/CreateTeamForm.tsx`, `components/features/create/CreateWorkForm.tsx`

CreateTeamForm:
- Text input: name
- Textarea: description (shows character count)
- Select: category
- Multi-select chips: looking_for_roles
- Text input: external_chat_link (optional)
- Checkbox: is_open
- Submit button with loading state
- Error display

CreateWorkForm:
- Text input: title
- Textarea: description (shows character count)
- Select: category
- Tag input: tags (chip interface, max 5)
- URL input list: images (add/remove, max 9)
- URL input list: links (add/remove)
- Submit button with loading state
- Error display

### Step 4: Modal Wrapper
File: `components/features/create/CreateModal.tsx`

- Props: isOpen, onClose, type ('team' | 'work')
- Full-screen overlay with cosmic styling
- Renders appropriate form based on type
- Close on backdrop click or Escape key
- Smooth animations

## Simplified MVP Scope
- Image Upload: URL input (not file upload)
- Collaborator Tagging: Skip for Phase 1
- Event Selection: Skip (can add with Event Hub)
- Auto-complete: Skip for MVP

## Phase 2 Preview
After Phase 1 is complete, Phase 2 will add:
- FloatingActionButton (FAB) component
- Profile page layout
- Integration into Explore and Profile pages
- Navigation updates
- Auto-refresh after creation

## Success Criteria Phase 1
- [ ] Schemas validate correctly
- [ ] Repository methods insert data and return typed results
- [ ] Forms render with all fields
- [ ] Forms validate input before submission
- [ ] Forms show loading/error states
- [ ] Modal opens/closes properly
- [ ] Can create team via form (test with temporary button)
- [ ] Can create work via form (test with temporary button)

## Testing Phase 1
Create temporary test buttons in Explore page to open modals and verify:
1. Modal opens with correct form
2. Validation works (try invalid inputs)
3. Submission creates record in Supabase
4. Success closes modal
5. Error states display properly

---

**Status**: Phase 1 in progress
**Next**: Once Phase 1 complete, proceed to Phase 2 for integration
