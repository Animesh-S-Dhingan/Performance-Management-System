from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Goal, GoalComment, Feedback, EvaluationDimension,
    EvaluationRating, ReviewCycle, Probation, Notification,
    AuditLog, AdminConfig
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'department')
    list_filter = ('role', 'department', 'is_active')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('PMS Info', {'fields': ('role', 'department', 'date_of_joining', 'evaluator')}),
    )


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ('title', 'assigned_to', 'status', 'entity', 'weightage', 'target_completion', 'due_date')
    list_filter = ('status', 'entity', 'priority')
    search_fields = ('title', 'description')


@admin.register(GoalComment)
class GoalCommentAdmin(admin.ModelAdmin):
    list_display = ('goal', 'user', 'created_at')


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('goal', 'submitted_by', 'feedback_type', 'is_draft', 'submitted_at')
    list_filter = ('feedback_type', 'is_draft')


@admin.register(EvaluationDimension)
class EvaluationDimensionAdmin(admin.ModelAdmin):
    list_display = ('name',)


@admin.register(EvaluationRating)
class EvaluationRatingAdmin(admin.ModelAdmin):
    list_display = ('goal', 'dimension', 'score', 'evaluator')


@admin.register(ReviewCycle)
class ReviewCycleAdmin(admin.ModelAdmin):
    list_display = ('name', 'cycle_type', 'trigger_date', 'close_date', 'status')
    list_filter = ('cycle_type', 'status')


@admin.register(Probation)
class ProbationAdmin(admin.ModelAdmin):
    list_display = ('user', 'start_date', 'day30_status', 'day60_status', 'day80_status', 'is_paused')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'entity_type', 'entity_id', 'timestamp')
    list_filter = ('action', 'entity_type')


@admin.register(AdminConfig)
class AdminConfigAdmin(admin.ModelAdmin):
    list_display = ('key', 'updated_at')
