from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    usage_frequency = models.IntegerField(default=0)

    def __str__(self):
        return self.name


class Task(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    priority_score = models.IntegerField(default=0)
    deadline = models.DateField(null=True, blank=True)
    status = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title



class ContextEntry(models.Model):
    SOURCE_CHOICES = [
        ('email', 'Email'),
        ('whatsapp', 'WhatsApp'),
        ('note', 'Note'),
    ]

    content = models.TextField()
    source_type = models.CharField(max_length=10, choices=SOURCE_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    processed_insights = models.TextField(blank=True)

    def __str__(self):
        return f"{self.source_type} - {self.timestamp}"
