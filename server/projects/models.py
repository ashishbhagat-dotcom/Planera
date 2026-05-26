from django.conf import settings
from django.db import models

from core.models import BaseModel


class Project(BaseModel):
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='projects',
    )
    name = models.CharField(max_length=150)
    key = models.CharField(max_length=10)  # e.g. "PLT", "MOB"
    description = models.TextField(blank=True)
    lead = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='led_projects',
    )
    icon = models.CharField(max_length=10, blank=True, default='📋')
    color = models.CharField(max_length=7, blank=True, default='#6366f1')
    issue_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'projects_project'
        unique_together = ('organization', 'key')
        ordering = ['name']

    def __str__(self):
        return f'{self.key} — {self.name}'
