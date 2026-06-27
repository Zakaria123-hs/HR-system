# Leave Management System — Frontend

A React SPA that provides role-based dashboards for employees, supervisors, and HR to manage leave requests. Communicates with the Laravel backend via session-based Axios requests.

---

## Tech Stack

- **Framework:** React 19 + Vite
- **Routing:** React Router DOM v7
- **Styling:** Tailwind CSS v4 + plain CSS modules per page
- **HTTP:** Axios (session cookies, CSRF)
- **Calendar:** FullCalendar (dayGrid plugin)

---

## Setup

```bash
npm install
npm run dev
```

Runs at `http://localhost:5173`. The backend must be running at `http://localhost:8000`.

---

## Project Structure

```
src/
├── api/
│   └── axios.jsx              # Axios instance (baseURL, withCredentials)
├── context/
│   └── AuthContext.jsx        # Global auth state + login/logout helpers
├── routes/
│   └── ProtectedRoute.jsx     # Role-aware route guard
├── services/                  # All API call functions (one file per domain)
│   ├── AuthService.jsx
│   ├── employeeService.jsx
│   ├── superviceService.jsx
│   └── hrService.jsx
├── layouts/
│   └── DashboardLayout.jsx    # Persistent sidebar + header shell
├── page/                      # One file per route/screen
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   ├── RequestDashboard.jsx
│   ├── SupervisorDashboard.jsx
│   ├── HrDashboard.jsx
│   ├── CompanyHoliday.jsx
│   └── TeamPage.jsx
├── components/                # Reusable UI pieces used inside pages
│   ├── LeaveRequestForm.jsx
│   ├── LeaveRequestsTable.jsx
│   ├── LeaveRequestBalance.jsx
│   ├── SupervisorPendingTable.jsx
│   ├── LogoutButton.jsx
│   └── LoadingSpinner.jsx
├── style/                     # Per-page CSS files
│   ├── loginPage.css
│   ├── dashboardLayout.css
│   ├── holidayCalendar.css
│   └── teamPage.css
├── App.jsx                    # Route definitions
└── main.jsx                   # Entry point — wraps app in BrowserRouter + AuthProvider
```

---

## Authentication Flow

Authentication is **session-based** (Laravel Sanctum). No JWT tokens are stored.

### Axios instance — `src/api/axios.jsx`

```js
baseURL: "http://localhost:8000"
withCredentials: true   // sends session cookie on every request
withXSRFToken: true     // sends CSRF token automatically
```

### AuthContext — `src/context/AuthContext.jsx`

Wraps the entire app. Exposes:

| Value | Type | Description |
|-------|------|-------------|
| `user` | object \| null | The authenticated user object from `/api/user` |
| `isAuthenticated` | bool | `true` if `user` is not null |
| `isLoading` | bool | `true` while the initial session check is in progress |
| `login(credentials)` | async fn | Fetches CSRF cookie → POST login → sets user |
| `logout()` | async fn | POST logout → clears user state |

On app load, `AuthContext` calls `GET /api/user` to restore the session from the existing cookie. `isLoading` stays `true` until this resolves, preventing a flash redirect to `/login`.

### ProtectedRoute — `src/routes/ProtectedRoute.jsx`

Wraps any route that requires auth. Props:

- `role` — array of allowed roles e.g. `['employee', 'supervisor', 'hr']`

Behavior:
- While `isLoading` → renders `<LoadingSpinner />`
- No user → redirects to `/login`
- User role not in `role` array → redirects to `/login`

---

## Routing — `src/App.jsx`

| Path | Component | Allowed Roles |
|------|-----------|---------------|
| `/login` | `LoginPage` | Public |
| `/dashboard` | `DashboardPage` | employee, supervisor, hr |
| `/my-requests` | `RequestDashboard` | employee, supervisor, hr |
| `/supervisor/requests` | `SupervisorDashboard` | supervisor, hr |
| `/holidays` | `CompanyHoliday` | employee, supervisor, hr |
| `/employee` | `TeamPage` | employee, supervisor, hr |
| `*` | — | Redirects to `/dashboard` |

After login, the user is redirected based on role:
- `employee` / `supervisor` → `/dashboard`
- `hr` → `/hr` *(route not yet defined — needs to be added)*

---

## Services Layer — `src/services/`

Thin wrappers around Axios. Each function returns the raw Axios promise.

### `AuthService.jsx`

| Function | Method | Endpoint |
|----------|--------|----------|
| `login(data)` | POST | `/api/login` |
| `logout()` | POST | `/api/logout` |
| `getUser()` | GET | `/api/user` |

### `employeeService.jsx`

| Function | Method | Endpoint |
|----------|--------|----------|
| `getLeaveTypes()` | GET | `/api/leave-types` |
| `getMyBalances()` | GET | `/api/my-balances` |
| `getMyRequests()` | GET | `/api/my-leave-requests` |
| `getMyNotifications()` | GET | `/api/my-notifications` |
| `postLeaveRequest(data)` | POST | `/api/leave-requests` |
| `postReadNotification(id)` | POST | `/api/notifications/{id}/read` |
| `dashboardData()` | GET | `/api/dashboard-data` |
| `holidays()` | GET | `/api/company-holidays` |
| `getTeam()` | GET | `/api/team-work` |

### `superviceService.jsx`

| Function | Method | Endpoint |
|----------|--------|----------|
| `pendingRequest()` | GET | `/api/leave-requests/pending` |
| `approveRequest(id)` | POST | `/api/leave/approve/{id}` |
| `rejectRequest(id)` | POST | `/api/leave/reject/{id}` |

### `hrService.jsx`

| Function | Method | Endpoint |
|----------|--------|----------|
| `hrPendingRequests()` | GET | `/api/hr/pending` |
| `hrValidate(id, action)` | POST | `/api/hr/validate/{id}` |

---

## Layout — `DashboardLayout.jsx`

The persistent shell rendered on every authenticated page. Contains the sidebar and top header. Pages inject their content as `children`.

Props passed from every page:

| Prop | Type | Description |
|------|------|-------------|
| `children` | ReactNode | The page content rendered in the main area |
| `unreadCount` | number | Badge count on the notification bell |
| `notifications` | array | List of notification objects |
| `fetchNotifications` | fn | Callback to re-fetch notifications after marking as read |

Every page that uses `DashboardLayout` follows this pattern:

```jsx
<DashboardLayout unreadCount={unreadCount} notifications={notifications} fetchNotifications={fn}>
    {/* page content */}
</DashboardLayout>
```

---

## Pages

### `LoginPage`
- Controlled form with `email` + `password`
- On submit: fetches CSRF cookie → calls `login()` from `AuthService` → sets user in context → redirects by role
- Google login button is present but not yet implemented

---

### `DashboardPage` — `/dashboard`
- Fetches `dashboardData()` and `getMyNotifications()` on mount
- Displays a profile card (name, role, email, service) and time-off stats (approved, awaiting, remaining days)
- Two placeholder panels: Announcements and Tasks (not yet implemented)

---

### `RequestDashboard` — `/my-requests`
- Fetches balances, requests, and notifications in parallel with `Promise.all`
- Renders `<LeaveRequestsTable>` with the request history
- Two modal triggers:
  - "My balance" → opens `<LeaveRequestBalance>` modal
  - "Time request" → opens `<LeaveRequestForm>` modal
- After a successful form submission, `fetchData()` is called to refresh the table

---

### `SupervisorDashboard` — `/supervisor/requests`
- Reads `user.role` from `AuthContext`
- If `hr` → renders `<HRDashboard>`
- If `supervisor` → renders `<SupervisorPendingTable>`
- This single route serves both roles

---

### `HrDashboard` *(rendered inside SupervisorDashboard)*
- Fetches `hrPendingRequests()` on mount
- Table shows: employee name, supervisor who approved, leave type, dates, days, reason
- Approve / Reject buttons call `hrValidate(id, action)` and remove the row on success

---

### `CompanyHoliday` — `/holidays`
- Fetches holidays and maps them to FullCalendar event format
- Renders a `dayGridMonth` calendar with holidays highlighted in blue

---

### `TeamPage` — `/employee`
- Fetches `getTeam()` — returns colleagues filtered by role (HR sees all, others see same service)
- Client-side search filters by name, email, or service
- Displays role badges: `YOUR SUPERVISOR`, `SUPERVISOR`, `HR`, `EMPLOYEE`

---

## Components

### `LeaveRequestForm`
Modal form for submitting a leave request.
- Fetches leave types on mount to populate the dropdown
- Fields: leave type, start date, end date, reason
- On success: shows green banner, clears form, calls `onSuccec()` to refresh parent data
- On error: shows red banner with the backend error message

### `LeaveRequestsTable`
Table of the employee's own leave history.
- Client-side filter by leave type category (dropdown)
- Status badges: green (approved), amber (pending), red (rejected)
- Buttons: "My balance" and "Time request" — trigger modals in the parent page via callbacks

### `LeaveRequestBalance`
Modal showing leave balance metrics per leave type.
- Three boxes: days used, days awaiting approval (currently a hardcoded mock `4.5`), days remaining
- `pendingMock` needs to be replaced with real pending days from the API

### `SupervisorPendingTable`
Table of pending requests assigned to the logged-in supervisor.
- Approve / Reject buttons call the supervisor service and refresh the table
- Shows a success message banner for 3 seconds after an action

### `LoadingSpinner`
Simple centered spinner, used during data fetching and route guard checks.

### `LogoutButton`
Calls `logout()` from `AuthContext`. Can be placed anywhere in the layout.

---

## Known Issues / What's Not Yet Implemented

| Item | Location | Notes |
|------|----------|-------|
| HR route `/hr` missing | `App.jsx` | Login redirects HR to `/hr` but no route exists — add it |
| Pending days in balance modal | `LeaveRequestBalance.jsx` | `pendingMock = 4.5` is hardcoded, should come from the API |
| Google login | `LoginPage.jsx` | Button renders but has no handler |
| Announcements panel | `DashboardPage.jsx` | Empty state placeholder |
| Tasks panel | `DashboardPage.jsx` | Empty state placeholder |
| Notification prop name inconsistency | Multiple pages | Some pages pass `fetachNotifications` (typo), others pass `fetchNotifications` — standardize in `DashboardLayout` |
