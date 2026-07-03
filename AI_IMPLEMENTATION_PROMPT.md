# JEDDSpace Mobile — AI Feature Parity Implementation Prompt

Use this prompt with Kilo AI to implement the JEDDSpace AI Assistant, AI Analytics, and AI Chat Logs features inside the mobile app.

---

## Project Context

- **Mobile project root:** `JEDDSpace Mobile (m1.0.8.6i) (1)/JEDDSpace Mobile/`
- **Framework:** Expo ~55 + React Native 0.83 + React 19
- **Navigation:** Expo Router (file-based routing in `src/app/`)
- **Auth:** Supabase Auth client in `lib/supabase.ts`
- **Existing tab screens:** Dashboard, Documents, Emails, Contracts, Announcements, Official Business, Leave Form, Profile
- **No AI code exists yet in the mobile project.**

## Source of Truth: Web AI Implementation

All AI logic already exists in the web folder. Do **not** rebuild the backend logic. Reuse the same API contracts and Supabase tables.

### Web backend API routes to mirror
- `web/api/chat.js` → POST action-based AI endpoint
  - actions: `chat` / `conversation`, `history`, `logs`, `summary` / `document`, `operations`, `recommendation`, `image`, `audio`
  - streaming is supported when `payload.stream === true`
- `web/api/aiAnalytics.js` → POST `{ action: 'analytics' }`
- `web/api/test.js` → POST `{ action: 'groq' }` (optional)
- `web/server/ai/groqClient.js` → model `llama-3.3-70b-versatile`
- `web/server/ai/dataLoader.js` → intent-aware data loading from Supabase

### Web frontend AI files to mirror functionally
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
- `web/src/pages/aiAnalyticsPage.jsx`
  - topics, top users, usage stats, performance metrics
- `web/src/pages/aiChatLogsPage.jsx`
  - admin table of prompt/response/intent logs
- `web/src/services/recommendationService.js`
  - `getRecommendations({ startDate, endDate })`

### Key Supabase tables used by AI
- `ai_chat_logs` — prompt, response, intent, created_at, user_id, employee relation
- `ai_summarization` — reference_type, content_summary, raw_data_snapshot, created_at
- `document` — for attachment uploads
- Standard tables: `employee`, `job`, `leaveform`, `contracts`, `notification`, `email`

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

Use `fetch` with the mobile Supabase session token. Keep the same request/response shapes as the web so backend behavior is identical.

### 2) Create AI Admin Analytics screen (`src/app/(tabs)/ai-analytics.tsx`)

- Route: `/ai-analytics`
- Admin-only screen
- UI: Use existing card/list patterns from mobile (see `src/app/(tabs)/announcements.tsx` and `src/components/card.tsx`)
- Show:
  - Most Asked Topics
  - Most Active Users
  - Average AI Usage (today / week / month)
  - AI Performance metrics
- Loading + empty states
- Pull-to-refresh if possible

### 3) Create AI Chat Logs screen (`src/app/(tabs)/ai-chat-logs.tsx`)

- Route: `/ai-chat-logs`
- Admin-only screen
- Render a `ScrollView` + `FlatList` table with columns:
  - Date
  - User
  - Intent
  - Prompt
  - Response
- Truncate long text; show `-` when missing

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

### 8) UI/UX consistency rules

- Match existing mobile colors: brand `#1E0977`, active tab background `#0C21C1`, background `#F9FAFB`
- Use existing UI pieces:
  - `Card` from `@/components/card`
  - `MenuDropdown` where applicable
  - Ionicons for icons
- Use `ScrollView`, `FlatList`, `TextInput`, `TouchableOpacity`, `ActivityIndicator`, `Alert`
- Keep text sizes and spacing close to the existing screens.

### 9) Error handling & loading

- Show loading states for all async operations.
- Use `Alert.alert` for errors.
- Log errors to console with `[MobileAI]` prefix.

## Constraints

1. **Do not modify the existing web backend.** The mobile app must call the existing `/api/chat` and `/api/admin` routes.
2. **Do not create new Supabase tables or backend endpoints** unless strictly necessary; the existing tables and endpoints must remain the single source of truth.
3. **Keep auth behavior consistent** with the rest of the mobile app.
4. **TypeScript is enabled.** Use types rather than `any` where practical.

## Deliverables requested from Kilo

Implement the files and route changes described above. After implementation, run `npm run lint` in the mobile project and fix any newly introduced lint errors.

# Additional instructions

The mobile application is a presentation layer only. The existing web backend remains the single source of truth for all AI functionality. Every AI response, permission decision, context-building operation, intent classification, entity resolution, analytics calculation, and conversation processing must originate from the existing backend. The mobile implementation must not duplicate or reimplement any AI business logic. Its responsibility is limited to authentication, UI rendering, file selection, streaming response handling, local session persistence, and invoking the existing backend APIs. The goal is feature parity with the web application, not a second AI implementation.