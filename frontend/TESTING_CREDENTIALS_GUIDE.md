# 🧪 Testing Flow Guide - No Backend

## How to Access AI Proposal Generator

Since there's **no backend implemented**, the authentication is fully simulated using localStorage. Here's how to test:

---

## 3 Ways to Access the AI Proposal Generator

### **Method 1: Login Page (Recommended for UI Testing)**

1. **Go to login page:** `http://localhost:3000/login`

2. **Select your role:**
   - Choose between **"Freelancer"** or **"Company"**

3. **Enter ANY credentials** (they don't matter for testing):
   - Email: `test@example.com` (or any email)
   - Password: `anything` (or any password)

4. **Click "Sign In"** → Automatically redirected to `/ai-proposal-generator`

**Test Credentials Provided:**

- **Freelancer:** freelancer@test.com / password123
- **Company:** company@test.com / password123

---

### **Method 2: Signup Page**

1. **Freelancer Signup:** `http://localhost:3000/signup`
   - Fill in any info (all fields accepted)
   - Click "Create Freelancer Account"
   - Auto-logs in as freelancer → `/ai-proposal-generator`

2. **Company Signup:** `http://localhost:3000/signup/company`
   - Fill in any company info (all fields accepted)
   - Click "Create Company Account"
   - Auto-logs in as company → `/ai-proposal-generator`

---

### **Method 3: Browser Console (Fastest)**

Open DevTools Console (F12) and run:

```javascript
// Login as Freelancer
localStorage.setItem("userRole", "freelancer");
window.location.href = "/ai-proposal-generator";
```

Or:

```javascript
// Login as Company
localStorage.setItem("userRole", "company");
window.location.href = "/ai-proposal-generator";
```

---

## What Gets Set

When you sign in (any method), `localStorage` gets:

```javascript
localStorage.getItem("userRole");
// Returns: "freelancer" or "company"
```

This single value controls:

- ✅ Sidebar menu items
- ✅ Welcome message
- ✅ Access to protected page
- ✅ Logout functionality

---

## Complete Testing Flow

### Option A: Quick Reset + Login

```
1. Logout (button in sidebar) → clears role
2. Go to /login
3. Enter email: test@test.com
4. Enter password: test123
5. Click Sign In
6. See AI Proposal Generator page
```

### Option B: Signup Then Access

```
1. Go to /signup
2. Fill form with dummy data (doesn't matter)
3. Create account → auto-logged in
4. See AI Proposal Generator page
5. Use proposal generator
6. Logout when done
```

### Option C: Direct Console Access

```
F12 → Console → paste code → Enter
```

---

## Testing Different Roles

### Test as Freelancer:

```javascript
localStorage.setItem("userRole", "freelancer");
location.reload();
```

You'll see:

- Freelancer-specific sidebar menu
- "Welcome, Freelancer 👋" message
- AI Proposal Generator feature

### Test as Company:

```javascript
localStorage.setItem("userRole", "company");
location.reload();
```

You'll see:

- Company-specific sidebar menu
- "Welcome, Company 👋" message
- Different menu items (though page still shows)

---

## What to Test

### ✅ Login Flow

- Type email → works
- Type password → works
- Select role → highlighted correctly
- Click "Sign In" → redirects to `/ai-proposal-generator`

### ✅ Signup Flow

- Fill any form data → no validation errors (for testing)
- Click "Create Account" → redirects immediately
- Auto-logged in (check localStorage)

### ✅ Protected Page Access

- No role set → redirects to `/login` automatically
- Role set → shows the page
- Logout → removes role, redirects to `/login`

### ✅ Sidebar Navigation

- Different menu items per role
- "AI Proposal Generator" highlighted on current page
- Logout button works

### ✅ AI Proposal Generator

- Form fills correctly
- Generate button creates proposal
- Loading spinner shows 1.5s
- Copy button works
- Toast notifications show

---

## Important Notes

### For Testing Only

- ✅ **Any email/password works** - no validation
- ✅ **No actual signup stored** - just localStorage
- ✅ **No data persistence** - refreshing clears everything
- ✅ **No backend API calls** - simulated only

### In Production

When you add real backend:

1. Replace `handleSubmit` in login/signup pages
2. Call actual authentication API
3. Get real JWT token or session
4. Update `useAuth.ts` hook to use real auth
5. Rest of component structure stays the same ✅

---

## Sidebar Menu by Role

### Freelancer Menu:

- Dashboard
- **AI Proposal Generator** (current page)
- Job Matches
- CRM
- Tasks
- Analytics
- AI Coach
- Settings
- Logout

### Company Menu:

- Dashboard
- Post Job
- Applicants
- Meetings
- Analytics
- Settings
- Logout

---

## Troubleshooting

**Q: Page shows blank/loading**

- A: Check if role is set: `localStorage.getItem("userRole")`
- A: Should return `"freelancer"` or `"company"`

**Q: Redirects to /login even with role set**

- A: Make sure you're on a page with `'use client'` directive
- A: Check browser console for errors

**Q: Can't generate proposal**

- A: Check if you're logged in (role in localStorage)
- A: Fill in job description field
- A: Try Console: `localStorage.getItem("userRole")`

**Q: Logout not working**

- A: Check console for errors
- A: Try manually: `localStorage.removeItem("userRole")`

---

## Ready for Backend Integration

When you build the actual backend:

**Login Endpoint Structure:**

```typescript
// POST /api/auth/login
{
  email: string;
  password: string;
}

// Response:
{
  token: string; // JWT token
  role: "freelancer" | "company";
}
```

**Signup Endpoint Structure:**

```typescript
// POST /api/auth/signup/freelancer
{
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  // ... other fields
}

// POST /api/auth/signup/company
{
  companyName: string;
  email: string;
  password: string;
  // ... other fields
}
```

---

## Quick Command Reference

| Goal                | Command                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------- |
| Login as Freelancer | `localStorage.setItem("userRole", "freelancer"); location.href="/ai-proposal-generator"` |
| Login as Company    | `localStorage.setItem("userRole", "company"); location.href="/ai-proposal-generator"`    |
| Check Current Role  | `localStorage.getItem("userRole")`                                                       |
| Logout              | `localStorage.removeItem("userRole"); location.href="/login"`                            |
| Clear All Storage   | `localStorage.clear(); location.reload()`                                                |

---

**Happy Testing! 🚀**
