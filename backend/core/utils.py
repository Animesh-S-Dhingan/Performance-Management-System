import requests
import json
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
import logging

import datetime
from django.utils import timezone

logger = logging.getLogger(__name__)


def is_business_day(date):
    """Check if a date is a business day (Mon-Fri)."""
    # In a real app, this would also check a holiday calendar
    return date.weekday() < 5


def add_business_days(start_date, days):
    """Add X business days to a start date."""
    current_date = start_date
    added_days = 0
    while added_days < int(days):
        current_date = current_date + datetime.timedelta(days=1)
        if is_business_day(current_date):
            added_days = added_days + 1
    return current_date


def send_slack_notification(message, blocks=None):
    """Send a message to Slack via Incoming Webhook."""
    webhook_url = getattr(settings, 'SLACK_WEBHOOK_URL', '')
    if not webhook_url or 'XXXX' in webhook_url:
        logger.warning("Slack webhook not configured. Skipping notification.")
        return

    payload = {"text": message}
    if blocks:
        payload["blocks"] = blocks

    try:
        response = requests.post(
            webhook_url,
            data=json.dumps(payload),
            headers={"Content-Type": "application/json"},
            timeout=5
        )
        if response.status_code != 200:
            logger.error(f"Slack notification failed: {response.status_code} {response.text}")
    except Exception as e:
        logger.error(f"Slack Error: {e}")


def send_welcome_slack(user):
    """Send a rich Slack welcome message for a new user."""
    role_emoji = {"admin": "👑", "manager": "🧑‍💼", "employee": "👤"}.get(user.role, "👤")
    blocks = [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": "🚀 New Member Joined PMS Platform!", "emoji": True}
        },
        {
            "type": "section",
            "fields": [
                {"type": "mrkdwn", "text": f"*Name:*\n{user.get_full_name()}"},
                {"type": "mrkdwn", "text": f"*Role:*\n{role_emoji} {user.role.title()}"},
                {"type": "mrkdwn", "text": f"*Email:*\n{user.email}"},
                {"type": "mrkdwn", "text": f"*Username:*\n@{user.username}"},
            ]
        },
        {
            "type": "context",
            "elements": [
                {"type": "mrkdwn", "text": "Welcome to the team! 🎉 Let's achieve great things together."}
            ]
        },
        {"type": "divider"}
    ]
    send_slack_notification(
        f"🚀 New User Joined: {user.get_full_name()} ({user.role})",
        blocks=blocks
    )


def send_goal_slack(goal):
    """Send a rich Slack message for a newly created goal."""
    priority_emoji = {
        "critical": "🔴", "high": "🟡", "medium": "🔵", "low": "🟢"
    }.get(goal.priority, "⚪")

    blocks = [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": "🎯 New Goal Created!", "emoji": True}
        },
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": f"*{goal.title}*"}
        },
        {
            "type": "section",
            "fields": [
                {"type": "mrkdwn", "text": f"*Assigned To:*\n{goal.assigned_to.get_full_name()}"},
                {"type": "mrkdwn", "text": f"*Priority:*\n{priority_emoji} {goal.get_priority_display()}"},
                {"type": "mrkdwn", "text": f"*Due Date:*\n{goal.due_date or 'Not set'}"},
                {"type": "mrkdwn", "text": f"*Period:*\n{goal.get_goal_period_display()}"},
            ]
        },
        {
            "type": "context",
            "elements": [
                {"type": "mrkdwn", "text": f"🏷️ Weightage: *{goal.weightage}%* | Entity: *{goal.get_entity_display()}*"}
            ]
        },
        {"type": "divider"}
    ]
    send_slack_notification(
        f"🎯 New Goal: {goal.title} → {goal.assigned_to.get_full_name()}",
        blocks=blocks
    )


def send_custom_email(subject, template_name, context, recipient_list):
    """Send an HTML templated email with a plain-text fallback."""
    try:
        html_content = render_to_string(template_name, context)
    except Exception as e:
        logger.error(f"Template render error ({template_name}): {e}")
        return

    text_content = f"Notification from PMS Platform\n\nSubject: {subject}"
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', settings.EMAIL_HOST_USER)

    msg = EmailMultiAlternatives(subject, text_content, from_email, recipient_list)
    msg.attach_alternative(html_content, "text/html")
    try:
        msg.send()
        logger.info(f"Email sent to {recipient_list}: {subject}")
    except Exception as e:
        logger.error(f"Email Error: {e}")


def analyze_sentiment(text):
    """
    Very basic keyword-based sentiment analysis for demonstration.
    Returns a score between -1.0 and 1.0.
    """
    if not text:
        return 0.0
    
    pos_words = {"excellent", "great", "exceeds", "satisfied", "good", "strong", "achieved", "positive", "helpful", "done"}
    neg_words = {"poor", "unreliable", "slow", "fail", "incomplete", "struggle", "negative", "bad", "difficult", "below", "worst"}
    
    words = text.lower().replace('.', '').replace(',', '').split()
    pos_count = sum(1 for w in words if w in pos_words)
    neg_count = sum(1 for w in words if w in neg_words)
    
    if (pos_count + neg_count) == 0: return 0.0
    
    score = (pos_count - neg_count) / (pos_count + neg_count)
    return float(round(score, 2))


def send_red_flag_notification(feedback):
    """Notify Admin about a red flag."""
    from core.models import User, Notification
    user = feedback.submitted_by
    target = feedback.goal.assigned_to if feedback.goal else feedback.probation.user
    
    subject = f"🚨 RED FLAG: {feedback.flag_reason}"
    message = f"Feedback Red Flag for {target.get_full_name()}.\nReason: {feedback.flag_reason}\nSentiment: {feedback.sentiment_score}"
    
    # 1. Slack
    blocks = [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": "🚨 Performance Red Flag!", "emoji": True}
        },
        {
            "type": "section",
            "fields": [
                {"type": "mrkdwn", "text": f"*Subject:*\n{target.get_full_name()}"},
                {"type": "mrkdwn", "text": f"*Triggered By:*\n{user.get_full_name()}"},
            ]
        },
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": f"*Flag Reason:*\n{feedback.flag_reason}"}
        },
        {
            "type": "context",
            "elements": [
                {"type": "mrkdwn", "text": f"📍 Sentiment Score: *{feedback.sentiment_score}* | Triggered At: *{feedback.flag_triggered_at}*"}
            ]
        }
    ]
    send_slack_notification(message, blocks=blocks)
    
    # 2. In-App Notification (to all admins)
    admins = User.objects.filter(role=User.Role.ADMIN)
    for admin in admins:
        Notification.objects.create(
            user=admin,
            notification_type=Notification.NotificationType.ESCALATION,
            message=message
        )


def calculate_sla_metrics():
    """Calculate SLA metrics for red flags and goal approvals."""
    from core.models import Feedback, Goal
    import datetime
    
    now = timezone.now()
    
    # 1. Red Flag Resolution SLA (7 days)
    resolved_flags = Feedback.objects.filter(is_red_flag=True, is_resolved=True, resolved_at__isnull=False)
    avg_resolve_time = 0
    if resolved_flags.exists():
        total_time = sum((f.resolved_at - f.flag_triggered_at).total_seconds() for f in resolved_flags)
        avg_resolve_time = (total_time / resolved_flags.count()) / 3600  # hours
        
    flag_breaches = Feedback.objects.filter(
        is_red_flag=True, 
        is_resolved=False, 
        flag_triggered_at__lt=now - datetime.timedelta(days=7)
    ).count()

    # 2. Goal Approval SLA (5 business days)
    pending_goals = Goal.objects.filter(status='pending')
    approval_breaches: int = 0
    for goal in pending_goals:
        if add_business_days(goal.created_at, 5) < now:
            approval_breaches = approval_breaches + 1
            
    return {
        'avg_flag_resolve_hours': float(round(avg_resolve_time, 2)),
        'flag_sla_breaches': int(flag_breaches),
        'goal_approval_breaches': int(approval_breaches),
        'timestamp': now.isoformat()
    }