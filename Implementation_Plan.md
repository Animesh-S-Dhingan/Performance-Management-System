PMS Full-Stack Application — Implementation Plan

Build a Performance & Goal Management Platform from 

UI_DESIGN.md
 with Django/DRF backend and React/Vite frontend.

Proposed Changes

Backend — Django/DRF (backend/)

[NEW] Django project scaffolding
backend/manage.py, backend/gms/settings.py, backend/gms/urls.py
backend/requirements.txt — Django, DRF, django-cors-headers, reportlab, djangorestframework-simplejwt

[NEW] core app — Models (backend/core/models.py)

Model	Key Fields
User	email, first_name, last_name, role (employee/manager/admin), evaluator FK, department, date_of_joining
Goal	title, description, labels (JSON), priority, status (draft/pending/active/completed/rejected/archived), target_completion, assigned_to, evaluator, entity (company/team/individual), parent_goal FK, weightage, due_date, goal_period
GoalComment	goal FK, user FK, text, created_at
Feedback	goal FK, submitted_by, feedback_type (member/evaluator), ratings (JSON), text, is_draft, submitted_at
EvaluationDimension	name (Quality, Ownership, Communication, Timeliness, Initiative)
EvaluationRating	goal FK, dimension FK, score, evaluator FK
ReviewCycle	name, cycle_type (quarterly/biannual), trigger_date, reminder_dates (JSON), close_date, status
Probation	user FK, start_date, day30/60/80 status fields, is_paused, pause_reason, revised_dates
Notification	user FK, type, message, related_goal FK, is_read, created_at
AuditLog	user FK, action, entity_type, entity_id, details (JSON), timestamp
AdminConfig	key, value (JSON) — for flag thresholds, cycle settings

[NEW] Serializers (backend/core/serializers.py)

ModelSerializers for all models above
Nested serializers for Goal detail (comments, feedback)
Registration & Login serializers (JWT)

[NEW] Permissions (backend/core/permissions.py)

IsEmployee, IsManager, IsAdmin, IsGoalOwnerOrEvaluatorOrAdmin, CanApproveGoal

[NEW] Views (backend/core/views.py)

AuthViewSet — register, login (JWT token pair), me
GoalViewSet — CRUD + custom actions: submit, approve, reject, progress, complete, archive
FeedbackViewSet — submit member/evaluator feedback, cross-share locking
EvaluationViewSet — score dimensions
ReviewCycleViewSet — CRUD + status transitions
ProbationViewSet — timeline, pause/resume, reassign, waive
NotificationViewSet — list, mark read
AuditLogViewSet — read-only list
AdminConfigViewSet — threshold/cycle config
DashboardView — role-aware aggregated stats
ReportView — analytics data + CSV/PDF export
FlagView — flagged submissions list for admin

[NEW] URLs (backend/core/urls.py, backend/gms/urls.py)

/api/v1/auth/ — register, login, me
/api/v1/goals/ — GoalViewSet (router)
/api/v1/feedback/ — FeedbackViewSet
/api/v1/evaluations/ — EvaluationViewSet
/api/v1/cycles/ — ReviewCycleViewSet
/api/v1/probation/ — ProbationViewSet
/api/v1/notifications/ — NotificationViewSet
/api/v1/audit/ — AuditLogViewSet
/api/v1/admin-config/ — AdminConfigViewSet
/api/v1/dashboard/ — DashboardView
/api/v1/reports/ — ReportView
/api/v1/flags/ — FlagView

Frontend — React/Vite (frontend/)

[NEW] Project init & config

Vite + React scaffold, vite.config.js (proxy /api → http://127.0.0.1:8000)
frontend/src/index.css — design system (Indigo/Blue primary, green/amber/red system colors, soft shadows, rounded cards, Inter font)

[NEW] Core infrastructure

File	Purpose
src/api/client.js	Axios instance, JWT interceptor, base URL /api/v1
src/context/AuthContext.jsx	Login state, role, token management
src/components/Layout.jsx	Sidebar nav + header (role switch, notifications bell, profile)
src/components/ProtectedRoute.jsx	Role-based route guard

[NEW] Pages

Page	Features
LoginPage.jsx	Email/password form, JWT auth
EmployeeDashboard.jsx	My goals, progress bars, deadlines, self-feedback status, pending actions, timeline
ManagerDashboard.jsx	Team progress, approval queue, team performance distribution, flag alerts, heatmap
AdminDashboard.jsx	Org-wide submission status, red-flag queue, escalations, compliance metrics, probation tracker
GoalsPage.jsx	Table/card view, filter by status, search, goal hierarchy tree
GoalDetailPage.jsx	Full goal view, status badge, progress bar, comments, feedback tabs, approve/reject inline
GoalFormPage.jsx	Create/edit modal with weightage validation (live counter, red if ≠100%)
ApprovalsPage.jsx	Manager approval queue with SLA indicators
FeedbackPage.jsx	Structured form (1-5 ratings, open-ended), save draft, cross-share status
FlagReviewPage.jsx	Admin flagged submissions panel, severity/aging filters
ProbationPage.jsx	Timeline (Day 30/60/80), pause badge, reassign manager, waive forms
ReviewCyclesPage.jsx	Active cycle overview, timeline, status indicators, edge case badges
NotificationsPage.jsx	Full notification list (also accessible via bell dropdown)
AdminConfigPage.jsx	Flag threshold, cycle trigger, goal hierarchy config
ReportsPage.jsx	Charts (completion trends, feedback scores, repeat flags), CSV/PDF export
UsersPage.jsx	Admin user management

[NEW] Reusable components

StatusBadge.jsx, ProgressBar.jsx, GoalCard.jsx, TimelineWidget.jsx
ApprovalCard.jsx, NotificationDropdown.jsx, WeightageCounter.jsx
DonutChart.jsx, HeatmapChart.jsx, FlagBadge.jsx, Modal.jsx

Verification Plan

Automated

Backend migrations & server start

bash
cd backend && python manage.py makemigrations && python manage.py migrate && python manage.py runserver 0.0.0.0:8000

Frontend dev server start

bash
cd frontend && npm install && npm run dev

Browser Testing

Navigate to http://localhost:5173, verify login page loads
Create users (admin, manager, employee) via Django admin or API
Test login flow for each role → verify correct dashboard renders
Create goals → verify hierarchy, weightage validation, approval workflow
Test feedback submission and cross-share locking
Test notifications appear on relevant actions

Manual Verification (User)

Review visual design matches 
UI_DESIGN.md
 spec (Indigo/Blue, soft shadows, badges)
Verify role-based sidebar navigation changes per role
Confirm edge case UX states (no goals, manager change, SLA breach highlighting)