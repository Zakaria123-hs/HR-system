# Leave Management System — Backend

A Laravel REST API that manages employee leave requests through a two-stage approval workflow (Supervisor → HR), enforcing Moroccan Labor Code rules, leave balance tracking, and real-time notifications.

---

## Tech Stack

- **Framework:** Laravel 11
- **Auth:** Laravel Sanctum (session-based)
- **Database:** SQLite (configurable to MySQL/MariaDB)
- **Language:** PHP 8.2+

---

## Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

The API runs at `http://localhost:8000/api`.

---

## Authentication

Authentication uses **Laravel Sanctum with session cookies** (not tokens). The frontend must send requests with `withCredentials: true` and include the CSRF token.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/login` | Login with email + password |
| `POST` | `/logout` | Invalidate session |

### POST `/login`

**Body:**
```json
{
  "email": "employee@company.com",
  "password": "secret"
}
```

**Success `200`:**
```json
{
  "user": { "id": 1, "name": "...", "role": "employee", ... },
  "message": "Login successful"
}
```

**Failure `401`:** Invalid credentials.

---

## Roles & Access Control

Every protected route is guarded by `auth:sanctum` + a custom `RoleMiddleware` that checks `users.role`.

| Role | Description |
|------|-------------|
| `employee` | Can submit leave requests and view their own data |
| `supervisor` | Can approve or reject pending requests from their team |
| `hr` | Gives final approval/rejection after supervisor approval |

A request to a route with the wrong role returns `403 Unauthorized`.

---

## Database Schema

```
users
  id, name, email, password, role, level
  id_service → services.id
  supervisor_id → users.id (self-referential)
  hired_at
  timestamps

services
  id, name, min_active_staff, timestamps

leave_types
  id, name, is_balance_based (bool), default_days, timestamps

leave_balances
  id, user_id, leave_type_id, remaining_days, used_days, timestamps

leave_requests
  id, user_id, leave_type_id
  start_date, end_date, days_count
  status: pending | pending_hr | approved | rejected
  supervisor_id, reason, approved_at, timestamps

holidays
  id, name, date (unique), timestamps

notifications
  id, user_id, leave_request_id, type, message, read_at, timestamps
```

---

## API Routes

All routes below require `auth:sanctum`. Roles are noted per group.

---

### Shared Routes — `employee`, `supervisor`, `hr`

#### `GET /api/leave-types`
Returns all available leave types.

```json
[
  { "id": 1, "name": "Annual Leave", "is_balance_based": true, "default_days": 18 },
  { "id": 2, "name": "Sick Leave", "is_balance_based": false, "default_days": 0 }
]
```

---

#### `GET /api/my-leave-requests`
Returns the authenticated user's leave history, ordered newest first.

```json
{
  "my_requests": [
    {
      "leave_type": "Annual Leave",
      "status": "approved",
      "start_date": "2026-06-01",
      "end_date": "2026-06-05",
      "reason": "Family trip",
      "approved_by": "Manager Name",
      "created_at": "..."
    }
  ]
}
```

---

#### `GET /api/my-balances`
Returns the user's remaining and used days per leave type.

```json
{
  "myBalance": [
    { "leave_type": "Annual Leave", "remaining_days": 12, "used_days": 6 }
  ]
}
```

---

#### `GET /api/dashboard-data`
Returns a summary card for the employee dashboard: profile info + leave statistics.

```json
{
  "general_info": {
    "name": "John Doe",
    "role": "employee",
    "email": "john@company.com",
    "service": "IT Department"
  },
  "time_off": {
    "days_approved": 6,
    "days_awaiting_approval": 3,
    "days_remaining": 12
  }
}
```

---

#### `POST /api/leave-requests`
Submit a new leave request.

**Body:**
```json
{
  "leave_type_id": 1,
  "start_date": "2026-07-01",
  "end_date": "2026-07-05",
  "reason": "Optional reason"
}
```

**Business rules enforced (in order):**

1. **Validation** — all fields validated; `start_date` must be today or later, `end_date` after `start_date`.
2. **6-month service rule** — per Moroccan Labor Code, the employee must have at least 6 months of continuous service (`hired_at`). Returns `403` if not met.
3. **Overlap check** — rejects if the employee already has a `pending` or `approved` request covering the same dates.
4. **Day counting** — working days are calculated by iterating the date range and excluding weekends and public holidays from the `holidays` table.
5. **Balance check** — if the leave type is `is_balance_based`, the system checks `leave_balances`. It also accounts for days already locked in pending requests to prevent double-spending.
6. **Minimum staff check** — checks the employee's `service.min_active_staff`. If approving this request would leave fewer than the minimum number of active staff in the department during those dates, the request is rejected with `422`.
7. **Insert** — the request is saved with `status = pending` and `supervisor_id` set to the employee's assigned supervisor.
8. **Notification** — a `leave_created` notification is sent to the supervisor.

**Success `201`:**
```json
{ "message": "Leave request submitted successfully!" }
```

---

#### `GET /api/my-notifications`
Returns all **unread** notifications for the authenticated user, newest first.

```json
{
  "status": "success",
  "notifications": [
    {
      "id": 5,
      "message": "Your leave request has been approved by your manager...",
      "type": "leave_approved_by_supervisor",
      "read_at": null,
      "created_at": "..."
    }
  ]
}
```

---

#### `POST /api/notifications/{id}/read`
Marks a specific notification as read by setting `read_at = now()`. Only marks notifications belonging to the authenticated user.

```json
{ "message": "Notification processed", "rows_affected": 1 }
```

---

#### `GET /api/company-holidays`
Returns all configured public holidays.

```json
{ "holidays": [{ "id": 1, "name": "Labor Day", "date": "2026-05-01" }] }
```

---

#### `GET /api/team-work`
Returns team members visible to the authenticated user.

- **HR** sees all users in the system.
- **Supervisor / Employee** sees only users in the same service.

The response excludes the authenticated user and flags who is the user's direct supervisor.

```json
[
  {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@company.com",
    "role": "supervisor",
    "service": { "id": 1, "name": "IT Department" },
    "is_supervisor": true,
    "is_my_supervisor": true
  }
]
```

---

### Supervisor Routes — `supervisor` only

#### `GET /api/leave-requests/pending`
Returns all `pending` leave requests assigned to the authenticated supervisor.

```json
{
  "pending_req": [
    {
      "id": 10,
      "employee_name": "John Doe",
      "leave_type_label": "Annual Leave",
      "start_date": "2026-07-01",
      "end_date": "2026-07-05",
      "days_count": 5,
      "reason": "...",
      "status": "pending",
      "created_at": "..."
    }
  ]
}
```

---

#### `POST /api/leave/approve/{id}`
Supervisor approves a `pending` request. Runs inside a database transaction with a row lock.

**What happens:**
1. Verifies the request exists and is still `pending`.
2. Checks the employee has sufficient balance (if balance-based).
3. Updates status to `pending_hr` and records the supervisor's ID.
4. Sends a notification to the **employee**: "approved by supervisor, awaiting HR."
5. Sends a notification to **all HR users** in the same service: "new request requires your approval."

```json
{ "message": "Approved by supervisor, HR notified." }
```

---

#### `POST /api/leave/reject/{id}`
Supervisor rejects a `pending` request. Runs inside a database transaction.

**What happens:**
1. Verifies the request exists and is still `pending`.
2. Updates status to `rejected`.
3. Sends a `leave_rejected` notification to the employee.

```json
{ "message": "Rejected successfully" }
```

---

### HR Routes — `hr` only

#### `GET /api/hr/pending`
Returns all requests with `status = pending_hr` for employees in the HR user's service.

```json
{
  "hr_pending": [
    {
      "id": 10,
      "employee_name": "John Doe",
      "leave_type": "Annual Leave",
      "start_date": "2026-07-01",
      "end_date": "2026-07-05",
      "days_count": 5,
      "reason": "...",
      "supervisor_who_approved": "Manager Name"
    }
  ]
}
```

---

#### `POST /api/hr/validate/{id}`
HR gives the final decision on a `pending_hr` request.

**Body:**
```json
{ "action": "approved" }
```
or
```json
{ "action": "rejected" }
```

**If `approved`:**
1. Deducts `days_count` from `leave_balances.remaining_days` and increments `used_days`.
2. Sets status to `approved` and records `approved_at`.
3. Notifies the **employee**: "fully approved by HR."
4. Notifies the **supervisor**: "request for [employee] fully approved."

**If `rejected`:**
1. Sets status to `rejected`.
2. Notifies the **employee**: "rejected during HR validation."
3. Notifies the **supervisor**: "request for [employee] rejected."

```json
{ "message": "Request successfully processed and notifications dispatched." }
```

---

## Leave Request Lifecycle

```
Employee submits request
        │
        ▼
   status: pending  ──────────────────────────────► Supervisor rejects
        │                                                    │
        ▼                                                    ▼
Supervisor approves                                  status: rejected
        │                                            Employee notified
        ▼
  status: pending_hr
  Supervisor + Employee notified
        │
        ├──────────────────────────────► HR rejects
        │                                    │
        ▼                                    ▼
   HR approves                         status: rejected
        │                               Employee + Supervisor notified
        ▼
  status: approved
  Balance deducted
  Employee + Supervisor notified
```

---

## Notification Types

| Type | Triggered by | Recipient |
|------|-------------|-----------|
| `leave_created` | Employee submits request | Supervisor |
| `leave_approved_by_supervisor` | Supervisor approves | Employee |
| `pending_hr_validation` | Supervisor approves | HR users |
| `leave_rejected` | Supervisor rejects | Employee |
| `leave_final_approved` | HR approves | Employee + Supervisor |
| `leave_final_rejected` | HR rejects | Employee + Supervisor |

---

## Environment Variables

Key variables in `.env`:

```env
APP_URL=http://localhost
DB_CONNECTION=sqlite        # or mysql
SESSION_DRIVER=database
SESSION_LIFETIME=120
```

For MySQL, uncomment and fill:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=leave_management
DB_USERNAME=root
DB_PASSWORD=
```
