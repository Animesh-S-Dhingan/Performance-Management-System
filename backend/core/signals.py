from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, Goal, EvaluationRating, AuditLog, AdminConfig
from .utils import send_welcome_slack, send_goal_slack, send_custom_email, send_slack_notification


@receiver(post_save, sender=User)
def welcome_user_notification(sender, instance, created, **kwargs):
    """Send welcome email + Slack notification when a new user registers."""
    if created:
        # Welcome Email
        if instance.email:
            context = {'user': instance}
            send_custom_email(
                subject="🎉 Welcome to Performance Management System!",
                template_name='emails/welcome_email.html',
                context=context,
                recipient_list=[instance.email]
            )

        # Rich Slack notification for Admin/HR
        send_welcome_slack(instance)


@receiver(post_save, sender=Goal)
def goal_notification(sender, instance, created, **kwargs):
    """Send goal assignment email + Slack notification when a goal is created."""
    if created:
        # Email to the Employee assigned to the goal
        if instance.assigned_to and instance.assigned_to.email:
            context = {'goal': instance, 'user': instance.assigned_to}
            send_custom_email(
                subject=f"🎯 New Goal Assigned: {instance.title}",
                template_name='emails/goal_created.html',
                context=context,
                recipient_list=[instance.assigned_to.email]
            )

        # Rich Slack message to channel
        send_goal_slack(instance)


@receiver(post_save, sender=EvaluationRating)
def check_red_flag(sender, instance, created, **kwargs):
    """Auto-tag red flags if score is below threshold."""
    if created:
        # Get threshold from AdminConfig
        config = AdminConfig.objects.filter(key='flag_thresholds').first()
        threshold = 2.5 # Default
        if config and isinstance(config.value, dict):
            threshold = config.value.get('low_score', 2.5)
        
        if instance.score <= threshold:
            AuditLog.objects.create(
                user=instance.evaluator,
                action='RED_FLAG',
                entity_type='EvaluationRating',
                entity_id=instance.id,
                details={
                    'score': instance.score,
                    'threshold': threshold,
                    'dimension': instance.dimension.name,
                    'goal': instance.goal.title,
                    'employee': instance.goal.assigned_to.get_full_name()
                }
            )
            # Notify Admin via Slack
            send_slack_notification(
                f"🚩 *Red Flag Alert*: Low score ({instance.score}) for {instance.goal.assigned_to.first_name} on '{instance.dimension.name}'"
            )


@receiver(post_save, sender=Goal)
def aggregate_goal_progress(sender, instance, **kwargs):
    """Aggregate completion % from sub-goals to parent goal."""
    if instance.parent_goal:
        parent = instance.parent_goal
        sub_goals = parent.sub_goals.all()
        if sub_goals.exists():
            # Weighted average aggregation
            total_weight = sum(g.weightage for g in sub_goals)
            if total_weight > 0:
                weighted_completion = sum((g.target_completion * g.weightage) / total_weight for g in sub_goals)
                parent.target_completion = int(weighted_completion)
                parent.save()