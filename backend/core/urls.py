from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AuthViewSet, UserViewSet, GoalViewSet, FeedbackViewSet,
    EvaluationRatingViewSet, ReviewCycleViewSet, ProbationViewSet,
    NotificationViewSet, AuditLogViewSet, AdminConfigViewSet,
    ChatMessageViewSet
)

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'users', UserViewSet)
router.register(r'goals', GoalViewSet)
router.register(r'feedback', FeedbackViewSet)
router.register(r'evaluations', EvaluationRatingViewSet)
router.register(r'cycles', ReviewCycleViewSet)
router.register(r'probation', ProbationViewSet)
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'audit', AuditLogViewSet)
router.register(r'admin-config', AdminConfigViewSet)
router.register(r'chat', ChatMessageViewSet, basename='chat')

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('', include(router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
