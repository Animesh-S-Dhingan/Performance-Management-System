:dart: UI Design Prompt for PMS (Performance & Goal Management Platform)
Design a modern, enterprise-grade web application UI for a Performance & Goal Management Platform (PMS) that includes Performance Monitoring (PMS) and Goal Management System (GMS) as a unified experience.
The platform supports three roles only:

Employee
Manager
Admin (HR / Leadership)
The UI must be clean, scalable, data-rich, and workflow-driven, with strong emphasis on dashboards, approvals, timelines, and automation visibility.
:art: Design Principles
• Minimal, professional SaaS UI (similar to Stripe / Notion / Rippling)
• Soft shadows, rounded cards, clean typography
• Color system:
Primary: Indigo / Blue (actions)
Success: Green (completed / approved)
Warning: Amber (pending / incomplete)
Danger: Red (flags / escalations)
• Use badges, tags, and progress indicators heavily
• Responsive layout (desktop-first)

:compass: Global Layout
• Left sidebar navigation
• Top header with:
Role switch (for Manager who is also Employee)
Notifications (approval requests, reminders, escalations)
Profile dropdown
• Main content area with modular cards

:bar_chart: ROLE-BASED DASHBOARDS
:bust_in_silhouette: Employee Dashboard
Show:

My Goals (active, pending approval, completed)
Goal progress (progress bars with % and weightage)
Upcoming deadlines (probation / review cycles)
Self-feedback status (submitted / pending)
Notifications (goal rejected, approved, reminders)
Widgets:

Goal completion summary (weighted %)
Pending actions card
Timeline (Day 30 / 60 / 80 or cycle events)


:busts_in_silhouette: Manager Dashboard
Show:

Team goal progress (aggregated)
Pending approvals (goals)
Pending feedback submissions
Team performance distribution (Below / Meets / Above)
Widgets:

Approval queue (quick approve/reject)
Team goals table
Flag alerts from feedback
Completion heatmap


:office_worker: Admin Dashboard
Show:

Org-wide submission status
Red-flag queue (high priority)
Escalations (aging indicators)
Compliance metrics (completion rates)
Widgets:

Cycle progress tracker
Flagged responses panel
Probation tracker (Active / Paused / Completed)
Weekly digest summary


:dart: GOAL MANAGEMENT SYSTEM (GMS)
Goal Hierarchy UI
Display:

Company → Team → Individual cascade
Tree or nested expandable structure
Goal States (Badges)

Draft (grey)
Pending Approval (yellow)
Active (blue)
Completed (green)
Archived (muted)


Goal Features UI
Employee

Create goal (form modal)
Edit goal
Submit for approval
Update completion %
Manager/Admin

Approve / Reject (with comment box)
Assign weightage (must total 100%)
Archive goals


Goal Cards / Table View
Each goal shows:

Title
Owner
Status badge
Weightage %
Progress bar
Linked parent goal
Last updated


Weightage Validation UI

Live counter (e.g., “Total: 80% / 100%”)
Turns red if not 100%
Disable save until valid


Approval Workflow UI

Notification on submission
Inline approve/reject buttons
Rejection requires comment
SLA indicator (e.g., “Pending for 3 days”)


:memo: FEEDBACK & REVIEW SYSTEM
Feedback Forms UI
• Structured form with:
Rating inputs (1–5 scale)
Open-ended questions
• Save draft option
• Submit button

Cross-Share Logic
• Show:
“Waiting for Manager” / “Waiting for Employee”
• Unlock both views only after submission

Flag System UI
• Highlight:
Low scores (≤ threshold)
Negative sentiment
Blank responses
Badges:

Red Flag
Repeat Flag
Incomplete


Admin Flag Review Panel
• List of flagged submissions
• Filters:
Severity
Aging (days pending)
• Action buttons:
Mark reviewed
Add notes

:stopwatch: PROBATION TRACKING UI
Timeline View
• Day 30 / 60 / 80 milestones
• Status:
Pending
Submitted
Overdue

Special States

Paused (leave) → show pause badge + revised dates
No Manager → show alert banner
Backdated DOJ → show admin decision modal


Actions

Send reminders
Reassign manager
Waive forms


:repeat: REVIEW CYCLES UI
Cycle Overview Page
• Active cycle (Bi-Annual / Quarterly)
• Timeline with:
Trigger date
Reminder dates
Close date

Status Indicators

Not started
In progress
Completed
Escalated


Edge Cases UI

Mid-cycle joiners → “Not eligible” badge
Dual-track → show only active cycle
Waived → show audit tag


:bell: NOTIFICATIONS SYSTEM
Show:

Goal approvals/rejections
Pending submissions
Escalations
Reminders
UI:

Notification bell with dropdown
Categorized alerts
CTA buttons (Approve / Submit / Review)


:gear: ADMIN CONTROLS
Configuration Panels

Red flag threshold setup
Cycle trigger settings
Goal hierarchy management


Audit Logs
• Track:
Goal approvals
Waivers
Escalations
Admin overrides

:chart_with_upwards_trend: ANALYTICS & REPORTING

Goal completion trends
Feedback score trends
Repeat flag detection
Export options (CSV / PDF)


:jigsaw: IMPORTANT EDGE CASE UX
Ensure UI handles:

No goals → block self-rating with alert
Manager change → show history note
Admin reassignment → confirmation modal
Approval SLA breach → highlight in red
Flag aging → show “X days pending”


:sparkles: INTERACTIONS & MICROCOPY
• Use clear system messages:
“Waiting for Manager submission”
“Goal pending approval for 3 days”
“Weightage must equal 100%”
• Use tooltips for complex logic
• Use modals for critical actions

:iphone: COMPONENTS TO INCLUDE

Cards
Tables with filters & sorting
Progress bars
Timeline components
Modals (approval, rejection, config)
Badges / tags
Notification dropdown
Charts (for Admin analytics)


:rocket: OUTPUT EXPECTATION
Generate:

Full UI screens for all 3 roles
Dashboard views
Goal management pages
Feedback forms
Admin panels
Edge case states