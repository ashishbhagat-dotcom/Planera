from django.contrib import admin

from .models import Activity, Comment, Issue, Label


@admin.register(Label)
class LabelAdmin(admin.ModelAdmin):
    list_display = ('name', 'color', 'organization')
    search_fields = ('name',)


@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = ('identifier', 'title', 'status', 'priority', 'assignee', 'project', 'created_at')
    list_filter = ('status', 'priority', 'project')
    search_fields = ('identifier', 'title')
    raw_id_fields = ('creator', 'assignee')


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ('issue', 'actor', 'verb', 'created_at')
    list_filter = ('verb',)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('issue', 'author', 'created_at')
    search_fields = ('body',)
