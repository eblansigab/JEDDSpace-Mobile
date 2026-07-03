# JEDDSpace Mobile — Missing Pages Implementation Prompt

Use this prompt with Kilo AI to implement the remaining missing pages in the mobile app.

---

## Project Context

- **Mobile project root:** `JEDDSpace Mobile (m1.0.8.6i) (1)/JEDDSpace Mobile/`
- **Framework:** Expo ~56 + React Native 0.85 + React 19
- **Navigation:** Expo Router (file-based routing in `src/app/`)
- **Auth:** Supabase Auth client in `lib/supabase.ts`
- **Existing screens:** Dashboard, Documents, Emails, Contracts, Announcements, Profile, AI Assistant, AI Analytics, AI Chat Logs, Registration Requests, Awaiting Approval, Approval Guard
- **Missing admin pages to implement:** Post Announcement, Manage Employees, Assign Travelling Jobs, Manage Forms

## Source of Truth: Web Implementation

All business logic already exists in the web folder. Do **not** rebuild the backend logic. Reuse the same Supabase tables and API contracts.

### Web pages to mirror

#### 1. Post Announcement (`web/src/pages/postAnnouncementsPage.jsx`)
- Admin-only page
- Form fields:
  - Announcement Title
  - Announcement Body/Content
  - Target Audience/Role filter
  - Priority level
  - Status (draft/published)
- Submit to `announcement` table
- Creates notifications for targeted employees
- Success/error feedback

#### 2. Manage Employees (`web/src/pages/manageEmployeesPage.jsx`)
- Admin-only page
- List all employees in a table with:
  - ID, Name, Position, Role, Status
  - Edit Position button
  - Delete/Archive button
- Add Employee modal with:
  - First Name, Last Name, Email
  - Password, Confirm Password
  - Position, Role, Department
- Uses `employeeService.create()` which calls `registerUser()` flow
- Creates notification on employee add
- Search/filter employees
- Refresh button

#### 3. Assign Travelling Jobs (`web/src/pages/assignJobsPage.jsx`)
- Admin-only page
- Form fields:
  - Select Employee (dropdown with active employees)
  - Department
  - Destination
  - Start Date
  - End Date
  - Notes
- Submit to `job` table
- Auto-creates linked contract in `contracts` table
- Creates notification for assigned employee
- Shows list of existing jobs with status

#### 4. Manage Forms (`web/src/pages/formsOutletPage.jsx`)
- Admin-only page
- Tabs: Leave Forms / Official Business
- Leave Forms tab shows:
  - Employee name + avatar
  - Leave type, dates, department
  - Reason
  - Status badge
  - Approve/Reject buttons for pending
- Official Business tab shows:
  - Employee name + avatar
  - Location, company car, driver, phone
  - Dates
  - Status badge
  - Approve/Reject buttons for pending
- Search/filter by employee name, type, status, location
- Approval/rejection creates notification for employee with admin name and optional reason

### Key Supabase tables used by missing pages
- `announcement` — announcement_id, title, body, status, user_id
- `employee` — employee_id, first_name, last_name, position, department, role, email, avatar_url, registration_status
- `job` — job_id, employee_id, department, destination, start_date, end_date, status, notes
- `contracts` — contracts_id, job_id, contractor, start_date, end_date, contract_title, status
- `leaveform` — leaveform_id, employee_id, start_date, end_date, type, reason, status
- `businessform` — businessform_id, employee_id, start_date, end_date, location, company_car, driver_name, phone_num, status
- `notification` — notifications_id, title, type, is_read, notify_to, created_by, priority, message

## Implementation Requirements

### 1. Post Announcement Screen (`src/app/(tabs)/post-announcement.tsx`)

- Admin-only screen
- Form with:
  - Title input
  - Body textarea
  - Target role/person selector
  - Priority dropdown (Low, Normal, High, Critical)
  - Status toggle (Draft/Published)
- On submit:
  - Insert into `announcement` table
  - Create notifications for targeted employees
  - Show success/error alerts
- Navigation: accessible from Announcements page via FAB or header action

### 2. Manage Employees Screen (`src/app/(tabs)/manage-employees.tsx`)

- Admin-only screen
- Search bar + Refresh button
- Employee list/table showing:
  - Avatar/initials
  - Name
  - Position
  - Role
  - Status badge
  - Edit/Delete actions
- Add Employee modal with form fields
- Edit Position modal/dialog
- Delete shows confirmation, then soft-deletes employee
- Creates notification on add/update
- Pull-to-refresh if possible

### 3. Assign Travelling Jobs Screen (`src/app/(tabs)/assign-jobs.tsx`)

- Admin-only screen
- Form with:
  - Employee dropdown (fetch active employees from `employee` table)
  - Department input
  - Destination input
  - Start Date picker
  - End Date picker
  - Notes textarea
- On submit:
  - Insert into `job` table
  - Auto-create linked `contracts` record with status `pending_signature`
  - Create notification for assigned employee
  - Show success/error alerts
- Show existing jobs list below form

### 4. Manage Forms Screen (`src/app/(tabs)/manage-forms.tsx`)

- Admin-only screen
- Tab switcher: Leave Forms / Official Business
- Each tab shows cards with:
  - Employee avatar/initials + name
  - Form details
  - Status badge
  - Approve/Reject buttons for pending items
- Search/filter functionality
- On approve/reject:
  - Update form status in database
  - Create notification for employee with admin name and optional reason
- Loading and empty states

### 5. Messaging Recipients Dropdown Fix (`src/app/(tabs)/email.tsx`)

- Current bug: recipient dropdown does not show all employees
- Fix requirements:
  - Fetch complete employee directory from `employee` table
  - Filter out archived/inactive employees
  - Show all valid recipients in dropdown
  - Use employee name as display, email as value
  - Search/filter within dropdown if possible
  - Ensure dropdown is scrollable if list is long

## UI/UX Rules

- Use existing mobile components (`Card`, `StatusBadge`, `Button`, `TextInput`, `Modal`, etc.)
- Use `Ionicons` for icons
- Support dark theme on all new screens
- Show avatars with initials fallback in user lists
- Use `Alert.alert` for errors and confirmations
- Show loading states for async operations
- Match existing mobile spacing and typography

## Constraints

1. **Do not modify the existing web backend.** The mobile app must call the same Supabase tables and reuse existing logic.
2. **Do not create new Supabase tables or backend endpoints** unless strictly necessary.
3. **Keep auth behavior consistent** with the rest of the mobile app.
4. **TypeScript is enabled.** Use types rather than `any` where practical.

## Deliverables requested from Kilo

Implement the 4 missing admin pages and fix the messaging recipients dropdown. After implementation, run `npm run lint` in the mobile project and fix any newly introduced lint errors.
