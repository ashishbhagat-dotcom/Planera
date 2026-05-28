from rest_framework import serializers

from users.serializers import UserSerializer
from .models import Activity, Comment, Issue, Label


class SubIssueSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)

    class Meta:
        model = Issue
        fields = ('id', 'identifier', 'title', 'status', 'priority', 'assignee')
        read_only_fields = fields


class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = ('id', 'name', 'color')
        read_only_fields = ('id',)


class IssueListSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)
    labels = LabelSerializer(many=True, read_only=True)
    project_key = serializers.CharField(source='project.key', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    sub_issue_count = serializers.SerializerMethodField()
    completed_sub_issue_count = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = (
            'id', 'identifier', 'title', 'status', 'priority',
            'position', 'assignee', 'labels', 'due_date', 'estimate',
            'cycle_id', 'parent_id', 'sub_issue_count', 'completed_sub_issue_count',
            'project_key', 'project_name', 'created_at', 'updated_at',
        )
        read_only_fields = fields

    def get_sub_issue_count(self, obj):
        return obj.sub_issues.count()

    def get_completed_sub_issue_count(self, obj):
        return obj.sub_issues.filter(status__in=['done', 'cancelled']).count()


class IssueDetailSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    assignee = UserSerializer(read_only=True)
    labels = LabelSerializer(many=True, read_only=True)
    sub_issues = SubIssueSerializer(many=True, read_only=True)
    parent = SubIssueSerializer(read_only=True)
    sub_issue_count = serializers.SerializerMethodField()
    completed_sub_issue_count = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = (
            'id', 'identifier', 'title', 'description', 'status', 'priority',
            'position', 'creator', 'assignee', 'labels', 'due_date', 'estimate',
            'cycle_id', 'parent_id', 'parent', 'sub_issues',
            'sub_issue_count', 'completed_sub_issue_count',
            'created_at', 'updated_at',
        )
        read_only_fields = fields

    def get_sub_issue_count(self, obj):
        return obj.sub_issues.count()

    def get_completed_sub_issue_count(self, obj):
        return obj.sub_issues.filter(status__in=['done', 'cancelled']).count()


class IssueCreateSerializer(serializers.ModelSerializer):
    assignee_id = serializers.UUIDField(required=False, allow_null=True)
    label_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, write_only=True
    )
    parent_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = Issue
        fields = (
            'title', 'description', 'status', 'priority',
            'assignee_id', 'label_ids', 'due_date', 'estimate', 'parent_id',
        )

    def validate_parent_id(self, value):
        if value is None:
            return value
        project = self.context.get('project')
        try:
            parent = Issue.objects.get(pk=value, project=project)
        except Issue.DoesNotExist:
            raise serializers.ValidationError('Parent issue not found in this project.')
        if parent.parent_id is not None:
            raise serializers.ValidationError('Sub-issues cannot be nested more than 1 level deep.')
        return value

    def create(self, validated_data):
        label_ids = validated_data.pop('label_ids', [])
        issue = Issue.objects.create(**validated_data)
        if label_ids:
            issue.labels.set(label_ids)
        return issue


class IssueUpdateSerializer(serializers.ModelSerializer):
    assignee_id = serializers.UUIDField(required=False, allow_null=True)
    label_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, write_only=True
    )

    class Meta:
        model = Issue
        fields = (
            'title', 'description', 'status', 'priority',
            'assignee_id', 'label_ids', 'due_date', 'estimate',
        )

    def update(self, instance, validated_data):
        label_ids = validated_data.pop('label_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if label_ids is not None:
            instance.labels.set(label_ids)
        return instance


class IssueMoveSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Issue.Status.choices)
    position = serializers.CharField(max_length=50)


class ActivitySerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)

    class Meta:
        model = Activity
        fields = ('id', 'actor', 'verb', 'data', 'created_at')
        read_only_fields = fields


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ('id', 'author', 'body', 'created_at', 'updated_at')
        read_only_fields = ('id', 'author', 'created_at', 'updated_at')


class BulkUpdateSerializer(serializers.Serializer):
    identifiers = serializers.ListField(
        child=serializers.CharField(), min_length=1, max_length=100
    )
    changes = serializers.DictField()


class BulkMoveNextSprintSerializer(serializers.Serializer):
    identifiers = serializers.ListField(
        child=serializers.CharField(), min_length=1, max_length=100
    )
