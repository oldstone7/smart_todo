from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Task, ContextEntry, Category, ContextEntry
from .serializers import TaskSerializer, ContextEntrySerializer, CategorySerializer
from .ai_module import SmartTodoAI
import json, re
# GET all tasks
class TaskListView(generics.ListAPIView):
    queryset = Task.objects.all().order_by('-created_at')
    serializer_class = TaskSerializer

# POST new task
class TaskCreateView(generics.CreateAPIView):
    serializer_class = TaskSerializer
    #category was getting stored as id, so we change/create a string/name.
    def perform_create(self, serializer):
        category_name = self.request.data.get('category')

        category = None
        if category_name:
            category, _ = Category.objects.get_or_create(name=category_name)

        serializer.save(category=category)


# GET categories
class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

# GET context entries
class ContextListView(generics.ListAPIView):
    queryset = ContextEntry.objects.all().order_by('-timestamp')
    serializer_class = ContextEntrySerializer

# POST context entry
class ContextCreateView(generics.CreateAPIView):
    serializer_class = ContextEntrySerializer

class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer


class AISuggestionView(APIView):
    
    def post(self, request):
        title = request.data.get('title')
        description = request.data.get('description')
        temp_context = request.data.get('context', '')

        current_date = request.data.get('current_date')
        current_day = request.data.get('current_day')

        # Fetch the latest 3 context entries from DB
        latest_contexts = ContextEntry.objects.order_by('-timestamp')[:5]
        db_context = "\n".join([c.content for c in latest_contexts])

        #  Combine both user-entered + stored context
        combined_context = f"{temp_context.strip()}\n\nRecent Notes:\n{db_context.strip()}"

        ai = SmartTodoAI()
        try:
            result = ai.analyze_task(title, description, combined_context, current_date, current_day)
            print("gemini output: ", result)
            #helper function to clean the input from LLM into pure json.
            def clean_json_string(raw: str):
                # Remove Markdown-style triple backticks and `json` label
                cleaned = re.sub(r"^```json\s*|```$", "", raw.strip(), flags=re.MULTILINE)
                return cleaned
            raw_result = result
            cleaned_result = clean_json_string(raw_result)
            parsed = json.loads(cleaned_result)
            return Response(parsed)
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class AIRescoreTasks(APIView):
    def post(self, request):
        new_task = request.data.get('new_task')
        current_tasks = request.data.get('current_tasks')
        current_date = request.data.get('current_date')
        current_day = request.data.get('current_day')

        ai = SmartTodoAI()
        try:
            result = ai.rescore_tasks(new_task, current_tasks, current_date, current_day)
            parsed = json.loads(result)
            return Response(parsed)
        except Exception as e:
            return Response({'error': str(e)}, status=500)
