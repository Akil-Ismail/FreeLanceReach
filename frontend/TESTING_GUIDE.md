# 🚀 Quick Testing Guide - AI Proposal Generator

## Setup (1 minute)

1. **Install dependencies** (if not already done):

   ```bash
   npm install
   ```

2. **Start dev server**:

   ```bash
   npm run dev
   ```

3. **Visit the app**:
   - Open `http://localhost:3000`
   - Open browser DevTools (F12)

## Testing Methods

### Method 1: Browser Console (Fastest ⚡)

1. Open DevTools Console (F12)

2. Set freelancer role:

   ```javascript
   localStorage.setItem("userRole", "freelancer");
   ```

3. Navigate to feature:

   ```javascript
   window.location.href = "/ai-proposal-generator";
   ```

4. ✅ You'll see the freelancer dashboard with AI Proposal Generator

### Method 2: Dev Tools Panel (Recommended for UI Testing)

1. Add `RoleSelectorPanel` to your layout temporarily:

   In `frontend/src/app/layout.tsx`, add this import:

   ```typescript
   import { RoleSelectorPanel } from "@/components/dev/RoleSelector";
   ```

   Then in your root layout, add at the end of JSX:

   ```typescript
   <RoleSelectorPanel />
   ```

2. Refresh the page - you'll see a purple "🧪 Dev Tools" button at bottom-left

3. Click buttons to:
   - ✅ Set Freelancer
   - ✅ Set Company
   - ✅ Clear Role (Logout)

4. Auto-redirects to `/ai-proposal-generator`

## What to Test

### 1. Authentication

- ✅ No role → Redirects to `/login`
- ✅ Set freelancer → Shows freelancer sidebar
- ✅ Set company → Shows company sidebar
- ✅ Logout → Removes role, redirects to `/login`

### 2. Sidebar Navigation

- ✅ Different menu items for freelancer vs company
- ✅ "AI Proposal Generator" is active (blue highlight)
- ✅ Click other links (they work if pages exist)
- ✅ Logout button works

### 3. Welcome Message

- ✅ Shows "Welcome, Freelancer 👋" for freelancer role
- ✅ Shows "Welcome, Company 👋" for company role

### 4. Proposal Generator Form

- ✅ Can enter job description
- ✅ Can select platform (Upwork, Fiverr, LinkedIn)
- ✅ Can select tone (Professional, Friendly, Confident, Persuasive)
- ✅ Can select focus area (Technical, Experience, Portfolio, Results)

### 5. Proposal Generation

- ✅ Click "Generate Proposal" → Shows loading spinner (1.5s)
- ✅ Different proposals appear for different tones
- ✅ Can edit proposal in textarea
- ✅ "Copy" button works
- ✅ Toast notification shows "Copied to clipboard!"
- ✅ Toast auto-dismisses after 3 seconds

### 6. UI/UX

- ✅ Dark theme looks professional
- ✅ Sidebar is sticky while scrolling
- ✅ Form is sticky on larger screens
- ✅ Responsive on mobile (sidebar collapses)
- ✅ Hover effects on buttons
- ✅ Smooth transitions

## Test Scenarios

### Scenario 1: Freelancer Workflow

```
1. localStorage.setItem("userRole", "freelancer")
2. Navigate to /ai-proposal-generator
3. See freelancer sidebar + welcome message
4. Fill in job description
5. Change tone to "Friendly"
6. Click "Generate Proposal"
7. See loading spinner
8. Copy generated proposal
9. Click Logout
10. See redirect to /login
```

### Scenario 2: Company Workflow

```
1. localStorage.setItem("userRole", "company")
2. Navigate to /ai-proposal-generator
3. See company sidebar + welcome message
4. Companies can view the page but it's for freelancers
   (You can optionally add a message like "This feature is for freelancers")
```

### Scenario 3: Role Switching

```
1. Set freelancer role
2. Go to /ai-proposal-generator
3. Set company role (without logout)
   localStorage.setItem("userRole", "company")
4. Page updates immediately
```

## Expected Results

✅ **All tests pass when:**

- Different UIs for different roles
- Protected route redirects if no role
- Form submission works with loading state
- Copy to clipboard works
- Toast notifications appear and disappear
- Logout works correctly
- Sidebar navigation functional

## Troubleshooting

### Page shows blank/loading forever

- Check localStorage: `localStorage.getItem("userRole")`
- Should return 'freelancer' or 'company'
- If null, set it: `localStorage.setItem("userRole", "freelancer")`

### Icons not showing

- Check browser console for errors
- Ensure lucide-react is installed: `npm list lucide-react`
- If not: `npm install lucide-react`

### Sidebar doesn't update when role changes

- Page might need refresh
- Clear localStorage: `localStorage.clear()`
- Set role again and refresh

### Redirect not working

- Ensure `'use client'` at top of page file
- Check that next/navigation is imported correctly

## Browser Console Helpers

Copy-paste these into console for quick testing:

```javascript
// Set freelancer
localStorage.setItem("userRole", "freelancer");
window.location.href = "/ai-proposal-generator";

// Set company
localStorage.setItem("userRole", "company");
window.location.href = "/ai-proposal-generator";

// Logout
localStorage.removeItem("userRole");
window.location.href = "/";

// Check current role
console.log("Current role:", localStorage.getItem("userRole"));

// Clear all storage
localStorage.clear();
console.log("Storage cleared");
```

## After Testing

### Clean Up Dev Tools

Remove RoleSelectorPanel from layout.tsx before production:

```typescript
// Remove this:
// <RoleSelectorPanel />
```

### Integration with Real Auth

When you implement real authentication, update `useAuth.ts` to call your auth API instead of localStorage.

## Need Help?

Check these files:

- **Setup Guide**: `AI_PROPOSAL_GENERATOR_SETUP.md`
- **Hook**: `src/hooks/useAuth.ts`
- **Component**: `src/components/ai-proposal-generator/AIProposalGenerator.tsx`
- **Layout**: `src/components/protected/ProtectedLayout.tsx`
- **Sidebar**: `src/components/protected/Sidebar.tsx`

---

**Happy Testing! 🎉**
