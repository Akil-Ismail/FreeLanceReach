# AI Proposal Generator - Setup & Usage Guide

## Overview

The AI Proposal Generator is a role-based protected feature that allows freelancers to generate compelling proposals for job applications. It includes:

- ✅ Role-based access control (localStorage-based)
- ✅ Responsive dashboard with GitHub-style sidebar
- ✅ AI Proposal generation with different tones and focuses
- ✅ Editable proposals with copy-to-clipboard
- ✅ Toast notifications
- ✅ Production-ready code structure

## Files Created

```
src/
├── hooks/
│   ├── useAuth.ts                 # Authentication hook
│   └── useToast.ts                # Toast hook (exported from common/Toast)
├── components/
│   ├── protected/
│   │   ├── ProtectedLayout.tsx    # Layout wrapper for protected pages
│   │   └── Sidebar.tsx            # Role-based navigation sidebar
│   ├── ai-proposal-generator/
│   │   └── AIProposalGenerator.tsx # Main proposal generator component
│   ├── common/
│   │   └── Toast.tsx              # Toast notification component
│   └── dev/
│       └── RoleSelector.tsx       # Dev tools for testing (optional)
├── app/
│   └── ai-proposal-generator/
│       └── page.tsx               # Main page route
```

## How It Works

### 1. Role Management

The system uses localStorage to simulate authentication:

```typescript
// Set freelancer role
localStorage.setItem("userRole", "freelancer");

// Set company role
localStorage.setItem("userRole", "company");

// Remove role (logout)
localStorage.removeItem("userRole");
```

### 2. Protected Access

The `useAuth` hook:

- Reads `userRole` from localStorage
- Redirects to `/login` if no role is set
- Returns loading state while checking auth

```typescript
const { userRole, isLoading, logout } = useAuth();
```

### 3. Role-based UI

- **Freelancer**: AI Proposal Generator, Job Matches, Tasks, AI Coach, etc.
- **Company**: Post Job, Applicants, Meetings, Analytics, etc.

## Quick Start

### 1. Test with Dev Tools

Add the RoleSelectorPanel to your layout temporarily (during development only):

```typescript
import { RoleSelectorPanel } from '@/components/dev/RoleSelector';

// In your layout or page:
<RoleSelectorPanel />
```

Then use the buttons to set roles and test the feature.

### 2. Manual Testing via Browser Console

Open DevTools console and run:

```javascript
// Set freelancer role
localStorage.setItem("userRole", "freelancer");

// Navigate to the page
window.location.href = "/ai-proposal-generator";
```

### 3. Direct Navigation (after authentication)

Once your auth system is fully integrated, users will naturally have a role set, and can navigate to:

- `http://localhost:3000/ai-proposal-generator`

## Features

### Role-Based Welcome Message

```
If freelancer: "Welcome, Freelancer 👋"
If company: "Welcome, Company 👋"
```

### Sidebar Navigation

**Freelancer Menu:**

- Dashboard
- AI Proposal Generator (current page)
- Job Matches
- CRM
- Tasks
- Analytics
- AI Coach
- Settings
- Logout

**Company Menu:**

- Dashboard
- Post Job
- Applicants
- Meetings
- Analytics
- Settings
- Logout

### Proposal Generation

**Form Fields:**

1. **Job Description** (textarea) - Required
2. **Platform** - Upwork, Fiverr, or LinkedIn
3. **Tone** - Professional, Friendly, Confident, or Persuasive
4. **Focus Area** - Technical Skills, Experience, Portfolio, or Results

**Simulation:**

- Shows loading spinner for 1.5 seconds
- Generates tone-based dummy proposal
- Displays in editable textarea
- Copy to clipboard button
- Success toast notification

### Interactions

- **Generate**: Creates a new proposal based on form inputs
- **Edit**: Modify the generated proposal in the textarea
- **Copy**: Copy to clipboard with success notification
- **Logout**: Removes role and redirects to login

## Styling Details

- **Theme**: Dark SaaS style (slate-950 background)
- **Sidebar**: GitHub-style fixed sidebar with active state
- **Forms**: Gradient borders, smooth transitions
- **Buttons**: Blue gradient with hover effects
- **Icons**: Lucide React icons
- **Animations**: Fade-in, slide-in transitions

## Integration with Real Authentication

When you implement real authentication:

1. **Replace localStorage** with actual auth tokens/session
2. **Update useAuth hook** to call your auth API
3. **Keep the component structure** - it's ready for real auth
4. **Keep ProtectedLayout** - it will still handle loading states

Example integration:

```typescript
// In useAuth.ts
export const useAuth = () => {
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Call your auth API instead of localStorage
    const fetchUserRole = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        setUserRole(data.role);
      } catch (error) {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [router]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return { userRole, isLoading, logout };
};
```

## Extending the Feature

### Add More Proposals

Edit `DUMMY_PROPOSALS` in `AIProposalGenerator.tsx`:

```typescript
const DUMMY_PROPOSALS = {
  professional: `...`,
  friendly: `...`,
  confident: `...`,
  persuasive: `...`,
  // Add more tones here
};
```

### Create Similar Protected Pages

Reuse the same pattern:

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';
import { ProtectedLayout } from '@/components/protected/ProtectedLayout';

export default function NewProtectedPage() {
  const { userRole, isLoading } = useAuth();

  if (isLoading || !userRole) return <LoadingScreen />;

  return (
    <ProtectedLayout>
      <YourComponent userRole={userRole} />
    </ProtectedLayout>
  );
}
```

### Add More Sidebar Links

Edit `FREELANCER_MENU` or `COMPANY_MENU` in `Sidebar.tsx`:

```typescript
const FREELANCER_MENU = [
  // ... existing items
  { name: "New Feature", href: "/new-feature", icon: YourIcon },
];
```

## Browser DevTools Tips

1. **Check localStorage:**

   ```javascript
   localStorage.getItem("userRole"); // Returns 'freelancer' or 'company'
   ```

2. **Set role programmatically:**

   ```javascript
   localStorage.setItem("userRole", "freelancer");
   location.reload();
   ```

3. **Clear all localStorage:**
   ```javascript
   localStorage.clear();
   location.reload();
   ```

## Common Issues & Solutions

**Issue: Blank page on `/ai-proposal-generator`**

- Solution: Check if `userRole` is set in localStorage
- Use RoleSelectorPanel to set it

**Issue: Always redirects to `/login`**

- Solution: Ensure the page is a client component (`'use client'`)
- Check localStorage isn't blocked by browser

**Issue: Icons not showing**

- Solution: Ensure `lucide-react` is installed (`npm install lucide-react`)

## Performance Notes

- All components are client components (client-side rendering)
- Sidebar is sticky while scrolling main content
- Proposal generation simulates with 1.5s delay (replace with API call)
- Toast notifications auto-dismiss after 3 seconds
- Responsive design works on mobile (sidebar becomes overlay)

## Future Enhancements

1. **Real API Integration:**
   - Connect to backend for proposal generation
   - Use AI service (OpenAI, Anthropic, etc.)

2. **Advanced Features:**
   - Save generated proposals
   - Proposal templates
   - History/favorites
   - A/B testing proposals

3. **Analytics:**
   - Track proposal acceptance rate
   - Monitor conversion metrics

4. **Real Authentication:**
   - Replace localStorage with JWT tokens
   - Add session management
   - Implement 2FA

## Support

For issues or questions about this implementation, check:

- Ensure all files are created in correct locations
- Verify lucide-react is installed
- Check browser console for errors
- Test with RoleSelectorPanel for quick debugging
