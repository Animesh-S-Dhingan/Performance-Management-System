from rest_framework import viewsets, permissions, status, decorators
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from django.utils import timezone
from .utils import send_slack_notification
from .models import (
    Goal, GoalComment, Feedback, EvaluationDimension,
    EvaluationRating, ReviewCycle, Probation, Notification,
    AuditLog, AdminConfig, User, ChatMessage
)
from .serializers import (
    GoalSerializer, GoalCommentSerializer, FeedbackSerializer,
    EvaluationDimensionSerializer, EvaluationRatingSerializer,
    ReviewCycleSerializer, ProbationSerializer, NotificationSerializer,
    AuditLogSerializer, AdminConfigSerializer, UserSerializer, RegisterSerializer,
    ChatMessageSerializer
)
from django.db.models import Q
from .permissions import (
    IsGoalOwnerOrEvaluatorOrAdmin, CanApproveGoal, IsAdmin, IsManagerOrAdmin
)

class AuthViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    @decorators.action(detail=False, methods=['post'])
    def register(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @decorators.action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        return Response(UserSerializer(request.user).data)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    @decorators.action(detail=True, methods=['post'])
    def offboard(self, request, pk=None):
        """Admin offboarding: Reassign responsibilities and deactivate."""
        old_admin = self.get_object()
        successor_id = request.data.get('successor_id')
        
        if not successor_id:
            return Response({'error': 'Successor ID required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if str(old_admin.id) == str(successor_id):
            return Response({'error': 'Cannot offboard to self'}, status=status.HTTP_400_BAD_REQUEST)

        successor = get_object_or_404(User, id=successor_id, role=User.Role.ADMIN, is_active=True)
        
        # 1. Reassign all open notifications to successor
        Notification.objects.filter(user=old_admin, is_read=False).update(user=successor)
        
        # 2. Deactivate old admin
        old_admin.is_active = False
        old_admin.save()
        
        # 3. Create Audit log
        AuditLog.objects.create(
            user=request.user,
            action='ADMIN_OFFBOARD',
            entity_type='User',
            entity_id=old_admin.id,
            details={'successor': successor.username}
        )
        
        return Response({'status': f'Responsibilities transferred to {successor.get_full_name()}'})

class GoalViewSet(viewsets.ModelViewSet):
    queryset = Goal.objects.all()
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated, IsGoalOwnerOrEvaluatorOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            qs = Goal.objects.all()
        else:
            # Employee sees their goals; Manager sees their goals and reports' goals
            qs = Goal.objects.filter(Q(assigned_to=user) | Q(evaluator=user) | Q(assigned_to__evaluator=user))
        
        # Manual filtering from query params
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
            
        assigned_to = self.request.query_params.get('assigned_to')
        if assigned_to:
            qs = qs.filter(assigned_to_id=assigned_to)
            
        evaluator = self.request.query_params.get('evaluator')
        if evaluator:
            qs = qs.filter(evaluator_id=evaluator)
            
        entity = self.request.query_params.get('entity')
        if entity:
            qs = qs.filter(entity=entity)
            
        priority = self.request.query_params.get('priority')
        if priority:
            qs = qs.filter(priority=priority)
            
        return qs.distinct()

    def perform_create(self, serializer):
        # Default to current user if not provided (e.g., employee creating own goal)
        assigned_to = serializer.validated_data.get('assigned_to', self.request.user)
        # Default to user's evaluator if not provided
        evaluator = serializer.validated_data.get('evaluator', assigned_to.evaluator)
        serializer.save(assigned_to=assigned_to, evaluator=evaluator)

    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def submit(self, request, pk=None):
        goal = self.get_object()
        if goal.status not in [Goal.Status.DRAFT, Goal.Status.REJECTED, Goal.Status.ACTIVE]:
            return Response({'error': 'Goal must be in Draft, Rejected, or Active state to submit.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Track if it was active before submitting for completion
        was_active = goal.status == Goal.Status.ACTIVE
        goal.status = Goal.Status.PENDING
        goal.save()
        
        # Notify manager
        manager = goal.evaluator or goal.assigned_to.evaluator
        if manager:
            msg = f"Goal '{goal.title}' submitted by {goal.assigned_to.get_full_name()} for "
            msg += "completion approval." if was_active else "approval."
            Notification.objects.create(
                user=manager,
                notification_type=Notification.NotificationType.GOAL_SUBMITTED,
                message=msg,
                related_goal=goal
            )
        
        return Response({'status': 'Goal submitted for approval'})

    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, CanApproveGoal])
    def approve(self, request, pk=None):
        goal = self.get_object()
        weightage = request.data.get('weightage')
        if weightage is not None:
            goal.weightage = weightage
            
        # If the goal is 100% or was submitted from active, mark as completed
        # Otherwise, move to active (initial approval)
        if goal.target_completion >= 100:
            goal.status = Goal.Status.COMPLETED
        else:
            # Default to active if it's a first-time approval
            goal.status = Goal.Status.ACTIVE
            
        goal.save()
        
        Notification.objects.create(
            user=goal.assigned_to,
            notification_type=Notification.NotificationType.GOAL_APPROVED,
            message=f"Your goal '{goal.title}' has been approved and is now {goal.status}.",
            related_goal=goal
        )
        send_slack_notification(f"✅ Goal Approved: {goal.title} ({goal.weightage}%) for {goal.assigned_to.first_name} -> {goal.status}")
        return Response({'status': f'Goal {goal.status}', 'weightage': goal.weightage})

    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, CanApproveGoal])
    def reject(self, request, pk=None):
        comment = request.data.get('comment')
        if not comment:
            return Response({'error': 'Rejection comment is mandatory.'}, status=status.HTTP_400_BAD_REQUEST)
        
        goal = self.get_object()
        goal.status = Goal.Status.REJECTED
        goal.rejection_comment = comment
        goal.save()
        
        Notification.objects.create(
            user=goal.assigned_to,
            notification_type=Notification.NotificationType.GOAL_REJECTED,
            message=f"Your goal '{goal.title}' was rejected. Reason: {comment}",
            related_goal=goal
        )
        return Response({'status': 'Goal rejected'})

    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def comments(self, request, pk=None):
        goal = self.get_object()
        serializer = GoalCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(goal=goal, user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def progress(self, request, pk=None):
        goal = self.get_object()
        # Only owner can update progress
        if goal.assigned_to != request.user:
            return Response({'error': 'Only the goal owner can update progress.'}, status=status.HTTP_403_FORBIDDEN)
        
        target_completion = request.data.get('target_completion')
        if target_completion is None:
            return Response({'error': 'target_completion is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            goal.target_completion = int(target_completion)
            goal.save()
        except ValueError:
            return Response({'error': 'Invalid target_completion value.'}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({'status': 'Progress updated', 'target_completion': goal.target_completion})

class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            qs = Feedback.objects.all()
        else:
            # Filter feedback related to user (as employee or manager)
            qs = Feedback.objects.filter(Q(goal__assigned_to=user) | Q(goal__evaluator=user) | Q(goal__assigned_to__evaluator=user))
        
        # Apply manual filters
        goal_id = self.request.query_params.get('goal')
        if goal_id:
            qs = qs.filter(goal_id=goal_id)
            
        fb_type = self.request.query_params.get('feedback_type')
        if fb_type:
            qs = qs.filter(feedback_type=fb_type)

        is_draft = self.request.query_params.get('is_draft')
        if is_draft is not None:
            qs = qs.filter(is_draft=is_draft.lower() == 'true')

        # Cross-share logic: Only show content if BOTH member and evaluator feedback exist for the goal
        final_qs_ids = []
        for feedback in qs:
            # If the user is the one who submitted it, they can always see it
            if feedback.submitted_by == user:
                final_qs_ids.append(feedback.id)
                continue
            
            # Check if both types exist for this goal
            has_member = Feedback.objects.filter(goal=feedback.goal, feedback_type='member').exists()
            has_evaluator = Feedback.objects.filter(goal=feedback.goal, feedback_type='evaluator').exists()
            
            if has_member and has_evaluator:
                final_qs_ids.append(feedback.id)
        
        return Feedback.objects.filter(id__in=final_qs_ids).distinct()

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user)

    @decorators.action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsAdmin])
    def flags(self, request):
        """Admin review queue for red-flagged feedback."""
        qs = Feedback.objects.filter(is_red_flag=True, is_resolved=False).order_by('-flag_triggered_at')
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAdmin])
    def resolve_flag(self, request, pk=None):
        """Admin resolves or adds comments to a flag."""
        feedback = self.get_object()
        feedback.is_resolved = True
        feedback.resolved_at = timezone.now()
        feedback.resolved_by = request.user
        feedback.admin_comments = request.data.get('comments', '')
        feedback.admin_action_taken = True
        feedback.save()
        return Response({'status': 'Flag resolved'})

    @decorators.action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsAdmin])
    def sla_report(self, request):
        """Governance analytics: SLA metrics."""
        from .utils import calculate_sla_metrics
        return Response(calculate_sla_metrics())

class EvaluationRatingViewSet(viewsets.ModelViewSet):
    queryset = EvaluationRating.objects.all()
    serializer_class = EvaluationRatingSerializer

    def perform_create(self, serializer):
        serializer.save(evaluator=self.request.user)

class ReviewCycleViewSet(viewsets.ModelViewSet):
    queryset = ReviewCycle.objects.all()
    serializer_class = ReviewCycleSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            qs = ReviewCycle.objects.all()
        else:
            # Managers/Evaluators see their cycle and their direct reports' cycles
            qs = ReviewCycle.objects.filter(Q(user=user) | Q(user__evaluator=user))
        
        # Filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
            
        return qs.distinct()

class ProbationViewSet(viewsets.ModelViewSet):
    queryset = Probation.objects.all()
    serializer_class = ProbationSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            qs = Probation.objects.all()
        else:
            # Managers see their reports' probation; Employees see their own
            qs = Probation.objects.filter(Q(manager=user) | Q(user=user))
            
        # Apply filters
        status_30 = self.request.query_params.get('day30_status')
        if status_30:
            qs = qs.filter(day30_status=status_30)
            
        status_60 = self.request.query_params.get('day60_status')
        if status_60:
            qs = qs.filter(day60_status=status_60)
            
        status_80 = self.request.query_params.get('day80_status')
        if status_80:
            qs = qs.filter(day80_status=status_80)
            
        return qs.distinct()

    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsAdmin])
    def pause(self, request, pk=None):
        probation = self.get_object()
        reason = request.data.get('reason')
        probation.is_paused = True
        probation.pause_reason = reason
        probation.save()
        return Response({'status': 'Probation paused'})

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @decorators.action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'Marked as read'})

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

class AdminConfigViewSet(viewsets.ModelViewSet):
    queryset = AdminConfig.objects.all()
    serializer_class = AdminConfigSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

class ChatMessageViewSet(viewsets.ModelViewSet):
    queryset = ChatMessage.objects.all()
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ChatMessage.objects.filter(Q(sender=user) | Q(receiver=user))

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @decorators.action(detail=False, methods=['post'])
    def bot(self, request):
        import time
        import random
        import requests
        from django.conf import settings
        
        text = request.data.get('text', '').lower()
        user = request.user
        
        user_msg = ChatMessage.objects.create(sender=user, text=request.data.get('text', ''), receiver=None, is_bot=False)

        bot_reply_text = None
        api_key = getattr(settings, 'GEMINI_API_KEY', '')
        
        if api_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                payload = {
                    "systemInstruction": {
                        "parts": [{"text": "You are a highly intelligent, professional HR & Performance Management Assistant named 'Intelligence Bot'. Provide clear, actionable, and warm advice to employees regarding their goals, burnout, feedback, and promotions. Format responses using clean spacing. Keep answers under 300 words without markdown asterisks."}]
                    },
                    "contents": [
                        {"parts": [{"text": request.data.get('text', "Hello")}]}
                    ]
                }
                resp = requests.post(url, json=payload, timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        bot_reply_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            except Exception as e:
                print("Gemini API Error:", e)

        if not bot_reply_text:
            # Huge comprehensive response corpus fallback
            performance_corpus = {
            "goals": "Setting and achieving goals requires a strategic approach. Here is a detailed breakdown:\n\n1. Use the SMART framework: Specific, Measurable, Achievable, Relevant, and Time-bound.\n2. Break large goals into weekly milestones so they feel less overwhelming.\n3. Regularly update your progress in the system to maintain visibility with your manager.\n4. If you finish tasks early, ask your manager for stretch assignments or look into upskilling opportunities within your role.\n\nKeep iterating on your goals quarterly!",
            "finish": "If you are consistently finishing tasks ahead of schedule, you are demonstrating high efficiency! Here is what you can do next:\n\n- Proactively ask your manager for stretch goals or high-visibility projects.\n- Dedicate some time to upskilling or learning a new tool related to your domain.\n- Offer mentorship to peers who might be struggling with their workload.\n- Ensure the quality of your early work isn't suffering—double check your deliverables.\nAlways log these accomplishments in your goal tracker for your review cycle!",
            "feedback": "Giving and receiving feedback is a cornerstone of professional growth.\n\n- When Giving Feedback: Always use the SBI model (Situation, Behavior, Impact). Instead of 'You are always late', try 'In yesterday's meeting (Situation), you arrived 15 minutes late (Behavior), which delayed our decision making (Impact).'\n- When Receiving Feedback: Listen actively, avoid getting defensive, and ask clarifying questions. Feedback is a gift meant to help you grow.",
            "probation": "The probation period is a critical testing ground to ensure mutual fit.\n\nKey Check-ins: Day 30, Day 60, and Day 80.\n- During Day 30: Focus on understanding the codebase, platform setup, and team culture.\n- During Day 60: You should be actively contributing and owning small features/tasks.\n- During Day 80: Your manager will evaluate your independence, problem-solving skills, and culture alignment to confirm your permanent placement.\nAlways ask questions when blocked!",
            "review": "Performance review cycles are your time to shine and reflect.\n\nHow to prepare:\n1. Self-Advocacy: Gather concrete examples of metrics you've improved or projects you delivered.\n2. Peer Review: Request 360-degree feedback from colleagues you collaborated with.\n3. Weaknesses: Be honest about areas where you struggled and present a plan on how you intend to improve them in the next cycle.\n4. Career Growth: Discuss where you want your role to evolve over the next 1-2 years.",
            "promotion": "Looking to get promoted? That's great ambition!\n\nPromotions are driven by clearly demonstrating you are already operating at the next level.\n1. Identify the gaps between your current level and the next tier in your career matrix.\n2. Consistently out-perform your current OKRs.\n3. Take on leadership or mentoring responsibilities (even informally).\n4. Have an open conversation with your manager about your career trajectory at the beginning of the review cycle, not at the end.",
            "burnout": "I hear you. Experiencing burnout or stress is very common, but it's important to address it early.\n\n- Time Management: Are you taking your required breaks? Block out 'focus time' on your calendar.\n- Prioritization: If everything is priority #1, nothing is. Speak to your manager to correctly stack-rank your tasks.\n- Boundaries: Disconnect from Slack and emails outside of your working hours.\nPlease reach out to HR or your manager to adjust your capacities if you feel chronically overwhelmed."
        }
        
        if not bot_reply_text:
            response_text = "I'm your AI Performance Intelligence. I analyze organizational text to help you grow.\n\nCould you clarify your question? Try asking me in detail about:\n• Setting or achieving your goals\n• Finishing tasks early\n• Preparing for performance reviews\n• Navigating probation\n• Giving or receiving feedback\n• Getting a promotion\n• Managing burnout and workload"
            
            for keyword, detailed_resp in performance_corpus.items():
                if keyword in text:
                    response_text = detailed_resp
                    break
            
            # If no specific keyword matches, provide a fallback generative-like detailed response
            if response_text.startswith("I'm your AI"):
                fallback_responses = [
                    "That's an interesting question about your performance journey. While I don't have a direct rule for that, my analysis suggests that maintaining open communication with your manager and rigorously tracking your weekly deliverables will put you in the best position to succeed. Ask me specifically about your goals, feedback, or reviews if you need a deeper dive!",
                    "Great point. To tackle that, you should look at your current Review Cycle objectives. Are your actions perfectly aligning with your assigned priorities? Try to break your problem down into smaller, measurable milestones. Let me know if you want detailed advice on goal setting or navigating probation!",
                    "Based on best HR practices, I highly recommend documenting this scenario in your 1-on-1 notes with your evaluator. Continuous feedback is critical. If you need step-by-step guidance on giving feedback or achieving tasks faster, just ask!"
                ]
                response_text = random.choice(fallback_responses)

            # Fake artificial delay to simulate AI processing time
            time.sleep(1.5)
            bot_reply_text = response_text

        bot_msg = ChatMessage.objects.create(sender=user, receiver=user, text=bot_reply_text, is_bot=True)

        return Response({
            'user_message': ChatMessageSerializer(user_msg).data,
            'bot_message': ChatMessageSerializer(bot_msg).data
        })

    @decorators.action(detail=True, methods=['post'])
    def react(self, request, pk=None):
        msg = self.get_object()
        emoji = request.data.get('emoji')
        user_id = str(request.user.id)
        
        if not msg.reactions:
            msg.reactions = {}
        
        if emoji:
            msg.reactions[user_id] = emoji
            msg.save()
            
            if msg.is_bot:
                import time
                import random
                time.sleep(1)
                reply = random.choice([
                    f"Thanks for the {emoji}! I'm always here to help.",
                    f"I appreciate the {emoji} reaction! Let me know if you need more details.",
                    f"Glad you liked it! {emoji}"
                ])
                bot_reply = ChatMessage.objects.create(sender=request.user, receiver=request.user, text=reply, is_bot=True)
                return Response({'status': 'reacted', 'message': ChatMessageSerializer(msg).data, 'bot_reply': ChatMessageSerializer(bot_reply).data})
        else:
            if user_id in msg.reactions:
                del msg.reactions[user_id]
            msg.save()

        return Response({'status': 'reacted/removed', 'message': ChatMessageSerializer(msg).data})
