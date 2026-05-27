from django.conf import settings
from django.db import models

from core.models import BaseModel


class Label(BaseModel):
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='labels',
    )
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, default='#6366f1')

    class Meta:
        db_table = 'issues_label'
        unique_together = ('organization', 'name')
        ordering = ['name']

    def __str__(self):
        return self.name


class Issue(BaseModel):
    class Status(models.TextChoices):
        BACKLOG = 'backlog', 'Backlog'
        TODO = 'todo', 'Todo'
        IN_PROGRESS = 'in_progress', 'In Progress'
        IN_REVIEW = 'in_review', 'In Review'
        DONE = 'done', 'Done'
        CANCELLED = 'cancelled', 'Cancelled'

    class Priority(models.TextChoices):
        URGENT = 'urgent', 'Urgent'
        HIGH = 'high', 'High'
        MEDIUM = 'medium', 'Medium'
        LOW = 'low', 'Low'
        NONE = 'none', 'No Priority'

    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        related_name='issues',
    )
    identifier = models.CharField(max_length=20)  # e.g. "PLT-42"
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.BACKLOG)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.NONE)
    position = models.CharField(max_length=50, default='a0')  # fractional index
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_issues',
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_issues',
    )
    labels = models.ManyToManyField(Label, blank=True, related_name='issues')
    cycle = models.ForeignKey(
        'projects.Cycle',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='issues',
    )
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='sub_issues',
    )
    due_date = models.DateField(null=True, blank=True)
    estimate = models.PositiveSmallIntegerField(null=True, blank=True)  # story points

    class Meta:
        db_table = 'issues_issue'
        unique_together = ('project', 'identifier')
        ordering = ['position']

    def __str__(self):
        return f'{self.identifier}: {self.title}'


class Activity(BaseModel):
    CREATED = 'created'
    MOVED = 'moved'
    ASSIGNED = 'assigned'
    COMMENTED = 'commented'
    LABELLED = 'labelled'
    UPDATED = 'updated'
    DELETED = 'deleted'

    VERB_CHOICES = [
        (CREATED, 'Created'),
        (MOVED, 'Moved'),
        (ASSIGNED, 'Assigned'),
        (COMMENTED, 'Commented'),
        (LABELLED, 'Labelled'),
        (UPDATED, 'Updated'),
        (DELETED, 'Deleted'),
    ]

    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='activities')
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='activities',
    )
    verb = models.CharField(max_length=50, choices=VERB_CHOICES)
    data = models.JSONField(default=dict)

    class Meta:
        db_table = 'issues_activity'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.actor} {self.verb} {self.issue.identifier}'


class Comment(BaseModel):
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='comments',
    )
    body = models.TextField()

    class Meta:
        db_table = 'issues_comment'
        ordering = ['created_at']

    def __str__(self):
        return f'Comment by {self.author} on {self.issue.identifier}'
