"""
Custom permissions for the PMS platform.
"""
from rest_framework import permissions


class IsEmployee(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'employee'


class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'manager'


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsManagerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('manager', 'admin')


class IsGoalOwnerOrEvaluatorOrAdmin(permissions.BasePermission):
    """Allows access to goal owner, goal evaluator, owner's evaluator, or admin."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == 'admin':
            return True
        if obj.assigned_to == user:
            return True
        if obj.evaluator == user:
            return True
        if obj.assigned_to.evaluator == user:
            return True
        return False


class CanApproveGoal(permissions.BasePermission):
    """Only evaluators (manager assigned to goal or user) and admins can approve/reject."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == 'admin':
            return True
        if obj.evaluator == user:
            return True
        if obj.evaluator is None and obj.assigned_to.evaluator == user:
            return True
        return False
