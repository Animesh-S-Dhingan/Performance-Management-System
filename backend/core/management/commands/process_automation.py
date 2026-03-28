from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import User, Probation, ReviewCycle, Notification, Goal
from core.utils import add_business_days, send_custom_email, send_slack_notification
from datetime import timedelta

class Command(BaseCommand):
    help = 'Process PMS automation: probation milestones, review cycles, and escalations.'

    def handle(self, *args, **options):
        self.stdout.write("Running PMS Automation...")
        today = timezone.now().date()
        
        # 1. Process Probation Milestones
        self.process_probation_milestones(today)
        
        # 2. Process Review Cycle Reminders
        self.process_review_cycles(today)
        
        # 3. Process Goal Escalations
        self.process_goal_escalations(today)
        
        self.stdout.write(self.style.SUCCESS("Automation run complete!"))

    def process_probation_milestones(self, today):
        probations = Probation.objects.filter(is_paused=False)
        for p in probations:
            for days, status_attr, triggered_attr, title in [
                (30, 'day30_status', 'day30_triggered_at', 'Day 30'),
                (60, 'day60_status', 'day60_triggered_at', 'Day 60'),
                (80, 'day80_status', 'day80_triggered_at', 'Day 80'),
            ]:
                status = getattr(p, status_attr)
                triggered_at = getattr(p, triggered_attr)
                
                if status == Probation.MilestoneStatus.PENDING:
                    target_date = add_business_days(p.start_date, days)
                    
                    if today >= target_date and not triggered_at:
                        setattr(p, triggered_attr, timezone.now())
                        p.save()
                        self.send_probation_notification(p, title, "Initial Trigger")
                        self.stdout.write(f"Triggered {title} for {p.user}")
                    
                    elif triggered_at:
                        triggered_date = triggered_at.date()
                        # Reminders (+2, +4, +6 working days)
                        for r_days in [2, 4, 6]:
                            if today == add_business_days(triggered_date, r_days):
                                self.send_probation_notification(p, title, f"Reminder (+{r_days}d)")
                                self.stdout.write(f"Sent {r_days}d reminder for {p.user}")
                        
                        # Escalation (+7 working days)
                        if today >= add_business_days(triggered_date, 7):
                            self.send_probation_notification(p, title, "ESCALATION (+7d)", to_admin=True)
                            self.stdout.write(f"Escalated {title} for {p.user}")

    def send_probation_notification(self, probation, milestone, type_label, to_admin=False):
        user = probation.user
        manager = probation.manager
        subject = f"PMS: {milestone} Probation {type_label}"
        
        # 1. In-App Notification
        recipients = [user]
        if manager: recipients.append(manager)
        if to_admin:
            admin = User.objects.filter(role='admin').first()
            if admin: recipients.append(admin)
            
        for r in recipients:
            Notification.objects.create(
                user=r,
                notification_type=Notification.NotificationType.PROBATION,
                message=f"{subject} for {user.get_full_name()}."
            )
            
        # 2. Email (Simplified)
        send_custom_email(
            subject,
            'emails/probation_milestone.html',
            {'user': user, 'milestone': milestone, 'type': type_label},
            [r.email for r in recipients]
        )
        
        # 3. Slack (for escalations or triggers)
        if to_admin or type_label == "Initial Trigger":
            send_slack_notification(f"🔔 *{subject}*\nUser: {user.get_full_name()}\nManager: {manager.get_full_name() if manager else 'N/A'}")

    def process_review_cycles(self, today):
        cycles = ReviewCycle.objects.filter(status=ReviewCycle.Status.IN_PROGRESS)
        for cycle in cycles:
            # PRD: Eligibility cutoff = joined more than 60 days before cycle close
            # We filter employees based on tenure and track
            eligible_users = User.objects.filter(
                is_active=True, 
                role=User.Role.EMPLOYEE,
                date_of_joining__lte=cycle.close_date - timedelta(days=60)
            )
            
            for u in eligible_users:
                # Deduplication logic: If BOTH, and this is Bi-Annual, check if a Quarterly overlap exists
                if u.review_track == User.ReviewTrack.BOTH and cycle.cycle_type == ReviewCycle.CycleType.BIANNUAL:
                    # Check if there's an overlapping Quarterly cycle trigger today or active
                    # PRD says "run quarterly only" in overlap
                    if ReviewCycle.objects.filter(cycle_type=ReviewCycle.CycleType.QUARTERLY, status=ReviewCycle.Status.IN_PROGRESS).exists():
                        self.stdout.write(f"Deduplicated: Skipping Bi-Annual for {u.username} (Quarterly precedence)")
                        continue

                # PRD: Remind 5th, 15th; Admin 22nd
                if today.day in [5, 15, 22]:
                    Notification.objects.create(
                        user=u,
                        notification_type=Notification.NotificationType.REMINDER,
                        message=f"Reminder: {cycle.name} review forms are pending."
                    )
            
            if today.day == 22:
                admin = User.objects.filter(role='admin').first()
                if admin:
                    Notification.objects.create(
                        user=admin,
                        notification_type=Notification.NotificationType.ESCALATION,
                        message=f"Escalation: {cycle.name} compliance check required."
                    )

    def process_goal_escalations(self, today):
        # PRD: Auto-escalate after 5 business days
        # We'll use a simplified implementation checking Goal updated_at
        pending_goals = Goal.objects.filter(status=Goal.Status.PENDING)
        for goal in pending_goals:
            # Calculate 5 business days ago
            # If today is >= 5 business days from goal.updated_at
            if today >= add_business_days(goal.updated_at.date(), 5):
                admin = User.objects.filter(role='admin').first()
                if admin:
                    Notification.objects.create(
                        user=admin,
                        notification_type=Notification.NotificationType.ESCALATION,
                        message=f"SLA Breach: Goal '{goal.title}' pending for > 5 business days."
                    )
