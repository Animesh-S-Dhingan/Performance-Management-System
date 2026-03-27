"""
Core models for the Performance & Goal Management Platform.
"""
from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Custom user with role-based access."""

    class Role(models.TextChoices):
        EMPLOYEE = 'employee', 'Employee'
        MANAGER = 'manager', 'Manager'
        ADMIN = 'admin', 'Admin'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.EMPLOYEE)
    department = models.CharField(max_length=100, blank=True)
    date_of_joining = models.DateField(null=True, blank=True)
    evaluator = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='direct_reports',
        help_text='Manager / evaluator for this user'
    )

    class Meta:
        ordering = ['first_name', 'last_name']

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    @property
    def is_manager(self):
        return self.role == self.Role.MANAGER

    @property
    def is_admin_user(self):
        return self.role == self.Role.ADMIN

    @property
    def is_employee(self):
        return self.role == self.Role.EMPLOYEE


class Goal(models.Model):
    """Goal model supporting Company → Team → Individual hierarchy."""

    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PENDING = 'pending', 'Pending Approval'
        ACTIVE = 'active', 'Active'
        COMPLETED = 'completed', 'Completed'
        REJECTED = 'rejected', 'Rejected'
        ARCHIVED = 'archived', 'Archived'

    class Entity(models.TextChoices):
        COMPANY = 'company', 'Company'
        TEAM = 'team', 'Team'
        INDIVIDUAL = 'individual', 'Individual'

    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        CRITICAL = 'critical', 'Critical'

    class GoalPeriod(models.TextChoices):
        DAILY = 'daily', 'Daily'
        WEEKLY = 'weekly', 'Weekly'
        MONTHLY = 'monthly', 'Monthly'
        QUARTERLY = 'quarterly', 'Quarterly'
        ANNUAL = 'annual', 'Annual'

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    labels = models.JSONField(default=dict, blank=True, help_text='Category labels: Growth, Delivery, Process')
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    target_completion = models.IntegerField(default=0, help_text='Completion percentage 0-100')
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    evaluator = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='evaluating_goals'
    )
    entity = models.CharField(max_length=20, choices=Entity.choices, default=Entity.INDIVIDUAL)
    parent_goal = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True, related_name='sub_goals'
    )
    weightage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    due_date = models.DateField(null=True, blank=True)
    goal_period = models.CharField(max_length=20, choices=GoalPeriod.choices, default=GoalPeriod.QUARTERLY)
    rejection_comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.title} [{self.get_status_display()}]"


class GoalComment(models.Model):
    """Comments on goals."""
    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Comment by {self.user} on {self.goal}"


class Feedback(models.Model):
    """Feedback submissions for goals (member self-review or evaluator review)."""

    class FeedbackType(models.TextChoices):
        MEMBER = 'member', 'Member Self-Review'
        EVALUATOR = 'evaluator', 'Evaluator Review'

    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='feedbacks')
    submitted_by = models.ForeignKey(User, on_delete=models.CASCADE)
    feedback_type = models.CharField(max_length=20, choices=FeedbackType.choices)
    ratings = models.JSONField(default=dict, blank=True, help_text='Structured rating data (1-5 scale)')
    text = models.TextField(blank=True)
    is_draft = models.BooleanField(default=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['goal', 'feedback_type']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_feedback_type_display()} for {self.goal}"


class EvaluationDimension(models.Model):
    """Evaluation dimensions: Quality, Ownership, Communication, Timeliness, Initiative."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class EvaluationRating(models.Model):
    """Per-dimension rating for a goal."""

    class RatingLevel(models.TextChoices):
        BELOW = 'below', 'Below Expectations'
        MEETS = 'meets', 'Meets Expectations'
        ABOVE = 'above', 'Above Expectations'

    goal = models.ForeignKey(Goal, on_delete=models.CASCADE, related_name='evaluation_ratings')
    dimension = models.ForeignKey(EvaluationDimension, on_delete=models.CASCADE)
    score = models.IntegerField(help_text='Numeric score 1-5')
    rating_level = models.CharField(max_length=20, choices=RatingLevel.choices, blank=True)
    evaluator = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['goal', 'dimension']

    def __str__(self):
        return f"{self.dimension} → {self.score} for {self.goal}"


class ReviewCycle(models.Model):
    """Review cycle configuration and tracking."""

    class CycleType(models.TextChoices):
        QUARTERLY = 'quarterly', 'Quarterly'
        BIANNUAL = 'biannual', 'Bi-Annual'

    class Status(models.TextChoices):
        NOT_STARTED = 'not_started', 'Not Started'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        ESCALATED = 'escalated', 'Escalated'

    name = models.CharField(max_length=200)
    cycle_type = models.CharField(max_length=20, choices=CycleType.choices)
    trigger_date = models.DateField()
    reminder_dates = models.JSONField(default=list, blank=True)
    close_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NOT_STARTED)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-trigger_date']

    def __str__(self):
        return f"{self.name} ({self.get_cycle_type_display()})"


class Probation(models.Model):
    """Probation tracking for employees."""

    class MilestoneStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SUBMITTED = 'submitted', 'Submitted'
        OVERDUE = 'overdue', 'Overdue'
        WAIVED = 'waived', 'Waived'

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='probation')
    start_date = models.DateField()
    day30_status = models.CharField(max_length=20, choices=MilestoneStatus.choices, default=MilestoneStatus.PENDING)
    day30_date = models.DateField(null=True, blank=True)
    day60_status = models.CharField(max_length=20, choices=MilestoneStatus.choices, default=MilestoneStatus.PENDING)
    day60_date = models.DateField(null=True, blank=True)
    day80_status = models.CharField(max_length=20, choices=MilestoneStatus.choices, default=MilestoneStatus.PENDING)
    day80_date = models.DateField(null=True, blank=True)
    is_paused = models.BooleanField(default=False)
    pause_reason = models.CharField(max_length=200, blank=True)
    revised_end_date = models.DateField(null=True, blank=True)
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='probation_reports')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Probation: {self.user}"


class Notification(models.Model):
    """In-app notifications."""

    class NotificationType(models.TextChoices):
        GOAL_APPROVED = 'goal_approved', 'Goal Approved'
        GOAL_REJECTED = 'goal_rejected', 'Goal Rejected'
        GOAL_SUBMITTED = 'goal_submitted', 'Goal Submitted for Approval'
        FEEDBACK_PENDING = 'feedback_pending', 'Feedback Pending'
        REMINDER = 'reminder', 'Reminder'
        ESCALATION = 'escalation', 'Escalation'
        PROBATION = 'probation', 'Probation Update'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    message = models.TextField()
    related_goal = models.ForeignKey(Goal, on_delete=models.SET_NULL, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.notification_type}] {self.message[:50]}"


class AuditLog(models.Model):
    """Audit trail for important actions."""
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=100)
    entity_type = models.CharField(max_length=50)
    entity_id = models.IntegerField()
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} on {self.entity_type}#{self.entity_id} by {self.user}"


class AdminConfig(models.Model):
    """Admin-configurable settings (flag thresholds, cycle settings, etc.)."""
    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField(default=dict)
    description = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.key
