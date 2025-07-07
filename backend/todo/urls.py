from django.urls import path
from .views import (
    TaskListView, TaskCreateView,
    CategoryListView,
    ContextListView, ContextCreateView,
    AISuggestionView,
    TaskDetailView,
    AIRescoreTasks
)

urlpatterns = [
    path('tasks/', TaskListView.as_view()),
    path('tasks/create/', TaskCreateView.as_view()),
    path('categories/', CategoryListView.as_view()),
    path('context/', ContextListView.as_view()),
    path('context/create/', ContextCreateView.as_view()),
    path('ai/suggest/', AISuggestionView.as_view()),
    path('tasks/<int:pk>/', TaskDetailView.as_view()),
    path('ai/rescore/', AIRescoreTasks.as_view())

]
