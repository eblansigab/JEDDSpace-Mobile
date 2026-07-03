# JEDDSpace Mobile — Feature Parity & Implementation Prompt

Use this prompt with Kilo AI to implement the missing JEDDSpace features inside the mobile app.

---

## Project Context

- **Mobile project root:** `JEDDSpace Mobile (m1.0.8.6i) (1)/JEDDSpace Mobile/`
- **Framework:** Expo ~56 + React Native 0.85 + React 19
- **Navigation:** Expo Router (file-based routing in `src/app/`)
- **Auth:** Supabase Auth client in `lib/supabase.ts`
- **Existing tab screens:** Dashboard, Documents, Emails, Contracts, Announcements, Profile
- **No AI, avatar system, or registration approval code exists yet in the mobile project.**

## Source of Truth: Web Implementation

All business logic already exists in the web folder. Do **not** rebuild the backend logic. Reuse the same Supabase tables and API contracts.

### Current web state (as of latest updates)

The web app has the following implemented features that mobile should mirror:

#### Authentication & Registration
- `supabase.auth.signUp()` → employee creation with `registration_status = 'pending'`
- Approval flow: pending users see `/awaiting-approval` page
- Admin page at `/registration-requests` to approve/reject registrations
- `ApprovalGuard` protects routes based on `registration_status`
- Admins bypass approval gate; employees with `pending`/`rejected` status cannot access protected routes

#### AI System (scope-restricted)
- **Scope:** AI only answers JEDDTech operational topics (employees, documents, contracts, leave, notifications, announcements, inbox, jobs, company procedures, recommendations, AI analytics, audit logs, blockchain verification, uploaded files)
- **Rejected topics:** general knowledge, homework, politics, religion, medical advice, programming tutorials, entertainment, games, personal advice, NSFW, illegal content, random calculations
- `web/server/ai/entityResolver.js` has `isAllowedJEDDSpaceIntent()` whitelist
- `web/server/ai/chatHandler.js` has early gate after intent detection
- Greetings and capability questions are still allowed

#### AI Backend APIs
- `web/api/chat.js` → POST action-based AI endpoint
  - actions: `chat` / `conversation`, `history`, `logs`, `summary` / `document`, `operations`, `recommendation`, `image`, `audio`
  - streaming is supported when `payload.stream === true`
- `web/api/admin.js` → POST `{ action: 'analytics' }` or `{ action: 'logs' }`
- `web/server/ai/groqClient.js` → model `llama-3.3-70b-versatile`
- `web/server/ai/dataLoader.js` → intent-aware data loading from Supabase
- Employee name resolution now happens client-side in analytics/logs handlers to avoid broken PostgREST joins

#### AI Frontend Features
- `web/src/services/aiservice.js`
  - `chat(message, messages)`
  - `chatWithContext(messages, userId, attachments)`
  - `chatWithContextStream(messages, userId, attachments, { sessionId, onToken, onProgress, onDone })`
  - `uploadAttachment(file)` — uploads to `document` storage + DB
  - `loadChatHistory(userId, sessionId)` / `saveChatHistory(userId, messages, sessionId)`
  - `loadAllChatLogs()` — admin only
- `web/src/pages/aiAssistantPage.jsx`
  - chat UI with suggested prompts
  - session management (new chat / switch session)
  - streaming token updates
  - attachment support
  - suggested prompts: Today's Jobs, Operations Summary, Available Workers, Employees on Leave, Contract Summary, Unread Notifications, Recommendation Explanation, Previous Summaries, Document Summary, Summarize Document, Compare Contract
- `web/src/pages/aiAnalyticsPage.jsx`
  - stat cards: Today, This Week, This Month usage
  - Most Asked Topics with Pie chart
  - Most Active Users
  - AI Performance metrics
- `web/src/pages/aiChatLogsPage.jsx`
  - admin table of prompt/response/intent logs
  - user names resolved via employee lookup instead of broken joins
- `web/src/services/recommendationService.js`
  - `getRecommendations({ startDate, endDate })`

#### Notifications
- `web/src/services/notificationService.js`
  - `createNotification({ title, message, type, userId, notifyTo, linkId })`
  - Types: `general`, `announcement`, `job_assignment`, `employee_update`
  - `getNotifications(employeeId)` — filters to `notify_to = employeeId OR notify_to IS NULL`
  - Realtime subscription respects `notify_to` filtering
- Messaging notifications target recipient's `user_id`, not sender's

#### Messaging
- `web/src/pages/emailsPage.jsx`
  - Internal messaging system (no Gmail branding)
  - Folder tabs: Received / Sent
  - Compose modal with employee name-based recipient selection
  - Privacy: only recipients receive message notifications
  - Thread view with sender/recipient names

#### Profile & Avatar
- `web/src/services/profileService.js`
  - `uploadAvatar(file, userId)` — uploads to `avatars/{userId}.png` in Supabase Storage
  - `removeAvatar(userId)` — deletes from storage and nulls `employee.avatar_url`
  - `getInitials(first, last)` — for fallback avatars
  - `getAvatarUrl(avatarUrl, firstName, lastName)` — returns stored URL or SVG fallback
- `web/src/pages/profilePage.jsx`
  - Avatar upload/remove/preview UI
  - Fallback to initials on error
- `web/src/components/sideBar.jsx`
  - Avatar image with initials fallback
- Storage bucket: `avatars` (must be public)

#### Registration Requests Admin Page
- `web/src/pages/registrationRequestsPage.jsx`
  - Lists pending registrations as cards
  - Approve / Reject actions
  - Search by name or department
  - Dark theme support

#### UI Branding & Dark Theme
- All email references changed to "Messages" / "Internal Messages"
- Dark theme improvements across:
  - Profile page
  - Admin dashboard
  - Registration request cards
  - AI Analytics stat cards and tables
  - AI Chat History tables
  - Sidebar
  - Tables and lists
- Consistent spacing, card shadows, border radius

### Key Supabase tables used
- `ai_chat_logs` — chat_id, user_id, prompt, response, intent, created_at
- `ai_summarization` — reference_type, content_summary, raw_data_snapshot, created_at
- `document` — document_id, title, file_name, file_path, file_size, file_type, uploaded_by, ai_summary, hash
- `employee` — employee_id, first_name, last_name, position, department, status, created_at, auth_user_id, user_id, role, is_archived, employment_status, email, registration_status, employee_type, avatar_url
- Standard tables: `employee`, `job`, `contracts`, `notification`, `email`
- `notification` — notifications_id, title, type, is_read, link_id, created_at, notify_to, created_by, priority, message

## Implementation Requirements

### 1) Create shared AI service (`src/services/aiService.ts`)

Create a mobile-friendly service that wraps the same backend endpoints the web uses.

Implement:
- `getAuthHeaders()` — gets Supabase session access token
- `chat(message, messages)` — calls `/api/chat` action `chat`
- `chatWithContext(messages, attachments?)` — calls `/api/chat` action `chat` with `attachments`
- `chatWithContextStream(messages, attachments?, options)` — calls `/api/chat` with `stream: true` and parses SSE `event:` / `data:` lines; exposes `onToken`, `onProgress`, `onDone`
- `uploadAttachment(file)` — uploads to `document` storage bucket then inserts into `document` table
- `loadChatHistory(userId, sessionId)` — calls `/api/chat` action `history`
- `saveChatHistory(userId, messages, sessionId)` — calls `/api/chat` action `history`
- `loadAllChatLogs()` — calls `/api/admin` action `logs` (admin only)
- `loadAnalytics()` — calls `/api/admin` action `analytics` (admin only)
- `getRecommendations(startDate, endDate)` — uses Supabase client directly like the web service

**Important:** The AI is scope-restricted. Do not modify the backend scope check. The mobile app should surface the same rejection behavior when users ask out-of-scope questions.

Use `fetch` with the mobile Supabase session token. Keep the same request/response shapes as the web so backend behavior is identical.

### 2) Create AI Admin Analytics screen (`src/app/(tabs)/ai-analytics.tsx`)

- Route: `/ai-analytics`
- Admin-only screen
- UI: Use existing card/list patterns from mobile
- Show:
  - Usage Overview stat cards: Today, This Week, This Month
  - Most Asked Topics (list + chart if possible)
  - Most Active Users (with avatar/initials and count)
  - AI Performance metrics in a clean list/grid
- Loading + empty states
- Pull-to-refresh if possible

### 3) Create AI Chat Logs screen (`src/app/(tabs)/ai-chat-logs.tsx`)

- Route: `/ai-chat-logs`
- Admin-only screen
- Render a `ScrollView` + `FlatList` table with columns:
  - Date
  - User (show avatar/initials if available, fallback to name)
  - Intent
  - Prompt
  - Response
- Wrap long text; show `-` when missing
- Loading + empty states

### 4) Create AI Assistant screen (`src/app/(tabs)/ai-assistant.tsx`)

- Route: `/ai-assistant`
- This is the main chat surface. It must support:
  - Conversation UI (user + assistant bubbles)
  - Streaming token rendering (append tokens in real time)
  - Suggested prompts list
  - Session management:
    - generate `session_...` IDs
    - store recent sessions in `AsyncStorage` keys `jeddspace_ai_session_id` and `jeddspace_ai_sessions`
    - new chat / switch chat / clear chat
  - Attachment upload via `expo-document-picker` + `expo-file-system` base64, then `aiService.uploadAttachment(file)`
  - Prefilled prompt via navigation state if needed
  - Auto-load history on session change
  - Auto-save history after assistant responds
- Suggested prompts should match the web set:
  - Today's Jobs
  - Operations Summary
  - Available Workers
  - Employees on Leave
  - Contract Summary
  - Unread Notifications
  - Recommendation Explanation
  - Previous Summaries
  - Document Summary
  - Summarize Document
  - Compare Contract
- For "Recommendation Explanation", call `getRecommendations({ startDate, endDate })`, build a snapshot string replacing the data, and send it through `chatWithContext` so the model explains the scores.
- **Note:** The AI may reject out-of-scope questions with a standardized message. Handle this gracefully in the UI.

### 5) Register routes in tab layout (`src/app/(tabs)/_layout.tsx`)

Add hidden tabs so the screens are reachable but do not clutter the tab bar:

```tsx
<Tabs.Screen name="ai-assistant" options={{ title: 'AI', href: null }} />
<Tabs.Screen name="ai-analytics" options={{ title: 'AI Analytics', href: null }} />
<Tabs.Screen name="ai-chat-logs" options={{ title: 'AI Logs', href: null }} />
```

If the design prefers, `ai-assistant` can be a visible tab instead of hidden.

### 6) Add navigation access from Dashboard (`src/app/(tabs)/index.tsx`)

Add an AI quick-access card or floating action button on the dashboard so users can reach the assistant without deep navigation.

### 7) Auth & gating

- Reuse `supabase` from `lib/supabase.ts`
- For admin screens (`ai-analytics`, `ai-chat-logs`), guard with an explicit role check. Load the employee row once using the Supabase session and cache the role. Only allow `admin`.
- If not admin, show an unauthorized message.
- Implement `ApprovalGuard` component that checks `profile.registration_status` and redirects non-approved users to awaiting-approval
- Apply the guard to all protected tabs

### 8) Approval Guard / Awaiting Approval screen

Create:
- `src/app/(tabs)/awaiting-approval.tsx` — public screen for pending/rejected users
- `src/components/ApprovalGuard.tsx` — route guard that checks `profile.registration_status` and redirects non-approved users to awaiting-approval

Apply the guard to all protected tabs. Only users with `registration_status = 'approved'` should access the app.

### 9) Registration Requests admin screen

Create `src/app/(tabs)/registration-requests.tsx` (admin only):
- List employees with `registration_status = pending`
- Show avatar/initials, name, department, position, request date
- Approve / Reject buttons that update `employee.registration_status`
- Search/filter by name or department

### 10) Avatar upload and display

Reuse the same `avatars` Supabase Storage bucket and `employee.avatar_url` field.

- Profile screen (`src/app/(tabs)/profile.tsx`): allow avatar upload/remove using `expo-image-picker`
- Sidebar / drawer: show avatar image with initials fallback
- Other screens: show avatar where user identity appears (messages, forms, AI logs, etc.)

**Avatar rules:**
- Show avatar image if `avatar_url` exists
- Fallback to initials circle on error or missing avatar
- Users can only edit their own avatar
- Supported formats: PNG, JPG, JPEG, WEBP
- Max size: 2MB
- Storage path: `avatars/{userId}.png`

### 11) Messaging / Emails screen improvements

- Keep internal messaging branding (no Gmail references)
- Show sender/recipient names instead of emails
- Privacy: only show messages to/from the current user
- Thread view with names and dates

### 12) UI/UX consistency rules

- Match existing mobile colors and components
- Use `Card` from `@/components/card`
- Use `Ionicons` for icons
- Use `ScrollView`, `FlatList`, `TextInput`, `TouchableOpacity`, `ActivityIndicator`, `Alert`
- Keep text sizes and spacing close to the existing screens.
- Support dark theme across all new screens
- Show avatars with initials fallback in all user lists

### 13) Error handling & loading

- Show loading states for all async operations.
- Use `Alert.alert` for errors.
- Log errors to console with `[MobileAI]` prefix.

## Constraints

1. **Do not modify the existing web backend.** The mobile app must call the existing `/api/chat`, `/api/admin`, and Supabase tables directly.
2. **Do not create new Supabase tables or backend endpoints** unless strictly necessary; the existing tables and endpoints must remain the single source of truth.
3. **Keep auth behavior consistent** with the rest of the mobile app.
4. **TypeScript is enabled.** Use types rather than `any` where practical.
5. **AI scope restriction is enforced server-side.** The mobile app does not need to implement scope checks; it should just surface whatever the backend returns.

## Deliverables requested from Kilo

Implement the files and route changes described above. After implementation, run `npm run lint` in the mobile project and fix any newly introduced lint errors.
