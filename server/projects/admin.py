from django.contrib import admin

from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('key', 'name', 'organization', 'lead', 'issue_count', 'created_at')
    list_filter = ('organization',)
    search_fields = ('name', 'key')
    readonly_fields = ('issue_count',)
