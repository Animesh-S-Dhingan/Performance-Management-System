from rest_framework import viewsets, permissions, status, decorators
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from django.utils import timezone
from .models import (
    Goal, GoalComment, Feedback, EvaluationDimension,
    EvaluationRating, ReviewCycle, Probation, Notification,
    AuditLog, AdminConfig, User
)
from .serializers import (
    GoalSerializer, GoalCommentSerializer, FeedbackSerializer,
    EvaluationDimensionSerializer, EvaluationRatingSerializer,
    ReviewCycleSerializer, ProbationSerializer, NotificationSerializer,
    AuditLogSerializer, AdminConfigSerializer, UserSerializer, RegisterSerializer
)
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

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class GoalViewSet(viewsets.ModelViewSet):
    queryset = Goal.objects.all()
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticated, IsGoalOwnerOrEvaluatorOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Goal.objects.all()
        # Employee sees their goals; Manager sees their goals and reports' goals
        return Goal.objects.filter(assigned_to=user) | Goal.objects.filter(evaluator=user) | Goal.objects.filter(assigned_to__evaluator=user)

    def perform_create(self, serializer):
        serializer.save(assigned_to=self.request.user)

    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def submit(self, request, pk=None):
        goal = self.get_object()
        if goal.status not in [Goal.Status.DRAFT, Goal.Status.REJECTED]:
            return Response({'error': 'Goal must be in Draft or Rejected state to submit.'}, status=status.HTTP_400_BAD_REQUEST)
        
        goal.status = Goal.Status.PENDING
        goal.save()
        
        # Notify manager
        manager = goal.evaluator or goal.assigned_to.evaluator
        if manager:
            Notification.objects.create(
                user=manager,
                notification_type=Notification.NotificationType.GOAL_SUBMITTED,
                message=f"Goal '{goal.title}' submitted by {goal.assigned_to.get_full_name()} for approval.",
                related_goal=goal
            )
        
        return Response({'status': 'Goal submitted for approval'})

    @decorators.action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, CanApproveGoal])
    def approve(self, request, pk=None):
        goal = self.get_object()
        goal.status = Goal.Status.ACTIVE
        goal.save()
        
        Notification.objects.create(
            user=goal.assigned_to,
            notification_type=Notification.NotificationType.GOAL_APPROVED,
            message=f"Your goal '{goal.title}' has been approved.",
            related_goal=goal
        )
        return Response({'status': 'Goal approved'})

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

class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user)

class EvaluationRatingViewSet(viewsets.ModelViewSet):
    queryset = EvaluationRating.objects.all()
    serializer_class = EvaluationRatingSerializer

    def perform_create(self, serializer):
        serializer.save(evaluator=self.request.user)

class ReviewCycleViewSet(viewsets.ModelViewSet):
    queryset = ReviewCycle.objects.all()
    serializer_class = ReviewCycleSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

class ProbationViewSet(viewsets.ModelViewSet):
    queryset = Probation.objects.all()
    serializer_class = ProbationSerializer

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
