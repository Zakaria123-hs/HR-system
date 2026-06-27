# Leave Management System

A full-stack web application for managing employee leave requests with a two-stage approval workflow (Supervisor → HR).

## Stack

| | Tech |
|---|---|
| **Backend** | Laravel 11, Laravel Sanctum, SQLite |
| **Frontend** | React 19, Vite, Tailwind CSS, Axios |

## Features

- Role-based access: `employee`, `supervisor`, `hr`
- Two-stage leave approval (supervisor → HR final validation)
- Leave balance tracking with automatic deduction on approval
- Moroccan Labor Code enforcement (6-month service eligibility)
- Minimum active staff check per department
- Real-time in-app notifications at each approval stage
- Company holidays calendar (FullCalendar)
- Team directory with role visibility rules

## Project Structure

```
leave-management-system/
├── leave-management-backend/   # Laravel REST API
└── leave-management-frontend/  # React SPA
```

## Getting Started

**Backend**
```bash
cd leave-management-backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve        # http://localhost:8000
```

**Frontend**
```bash
cd leave-management-frontend
npm install
npm run dev              # http://localhost:5173
```

## Documentation

- [Backend README](./leave-management-backend/README.md) — API routes, business logic, database schema
- [Frontend README](./leave-management-frontend/README.md) — component structure, auth flow, service layer
