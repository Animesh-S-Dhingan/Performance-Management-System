from rest_framework import serializers, status
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import (
    Goal, GoalComment, Feedback, EvaluationDimension,
    EvaluationRating, ReviewCycle, Probation, Notification,
    AuditLog, AdminConfig
)

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password_confirm', 'email', 'first_name', 'last_name', 'role')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'department', 'date_of_joining', 'evaluator')
        read_only_fields = ('id',)

class GoalCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.get_full_name')

    class Meta:
        model = GoalComment
        fields = ('id', 'goal', 'user', 'user_name', 'text', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')

class FeedbackSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.ReadOnlyField(source='submitted_by.get_full_name')

    class Meta:
        model = Feedback
        fields = ('id', 'goal', 'submitted_by', 'submitted_by_name', 'feedback_type', 'ratings', 'text', 'is_draft', 'submitted_at')
        read_only_fields = ('id', 'submitted_by', 'submitted_at')

class EvaluationRatingSerializer(serializers.ModelSerializer):
    dimension_name = serializers.ReadOnlyField(source='dimension.name')

    class Meta:
        model = EvaluationRating
        fields = ('id', 'goal', 'dimension', 'dimension_name', 'score', 'rating_level', 'evaluator')
        read_only_fields = ('id', 'evaluator')

class GoalSerializer(serializers.ModelSerializer):
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)
    evaluator = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)
    assigned_to_name = serializers.ReadOnlyField(source='assigned_to.get_full_name')
    evaluator_name = serializers.ReadOnlyField(source='evaluator.get_full_name')
    comments = GoalCommentSerializer(many=True, read_only=True)
    feedbacks = FeedbackSerializer(many=True, read_only=True)
    evaluation_ratings = EvaluationRatingSerializer(many=True, read_only=True)

    class Meta:
        model = Goal
        fields = (
            'id', 'title', 'description', 'labels', 'priority', 'status',
            'target_completion', 'assigned_to', 'assigned_to_name', 'evaluator', 'evaluator_name',
            'entity', 'parent_goal', 'weightage', 'due_date', 'goal_period',
            'rejection_comment', 'comments', 'feedbacks', 'evaluation_ratings',
            'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

class EvaluationDimensionSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationDimension
        fields = '__all__'

class ReviewCycleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewCycle
        fields = '__all__'

class ProbationSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.get_full_name')

    class Meta:
        model = Probation
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.get_full_name')

    class Meta:
        model = AuditLog
        fields = '__all__'

class AdminConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminConfig
        fields = '__all__'
