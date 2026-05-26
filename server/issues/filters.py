import django_filters

from .models import Issue


class IssueFilterSet(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=Issue.Status.choices)
    priority = django_filters.ChoiceFilter(choices=Issue.Priority.choices)
    assignee_id = django_filters.UUIDFilter(field_name='assignee_id')
    label = django_filters.UUIDFilter(field_name='labels__id')
    search = django_filters.CharFilter(field_name='title', lookup_expr='icontains')

    class Meta:
        model = Issue
        fields = ('status', 'priority', 'assignee_id', 'label', 'search')
