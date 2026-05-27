from datetime import date

from rest_framework import serializers

from users.serializers import UserSerializer
from .models import Cycle, Project


class ProjectListSerializer(serializers.ModelSerializer):
    lead = UserSerializer(read_only=True)

    class Meta:
        model = Project
        fields = ('id', 'name', 'key', 'description', 'lead', 'icon', 'color', 'issue_count', 'created_at')
        read_only_fields = ('id', 'issue_count', 'created_at')


class ProjectDetailSerializer(serializers.ModelSerializer):
    lead = UserSerializer(read_only=True)

    class Meta:
        model = Project
        fields = ('id', 'name', 'key', 'description', 'lead', 'icon', 'color', 'issue_count', 'created_at', 'updated_at')
        read_only_fields = ('id', 'key', 'issue_count', 'created_at', 'updated_at')


class ProjectCreateSerializer(serializers.ModelSerializer):
    lead_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = Project
        fields = ('name', 'key', 'description', 'lead_id', 'icon', 'color')

    def validate_key(self, value):
        value = value.upper().strip()
        org = self.context['request'].organization
        if org and Project.objects.filter(organization=org, key=value).exists():
            raise serializers.ValidationError('A project with this key already exists in the workspace.')
        return value

    def create(self, validated_data):
        validated_data['organization'] = self.context['request'].organization
        return super().create(validated_data)


def _compute_cycle_status(start_date, end_date):
    today = date.today()
    if end_date < today:
        return 'completed'
    if start_date <= today:
        return 'active'
    return 'upcoming'


class CycleSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Cycle
        fields = ('id', 'name', 'status', 'start_date', 'end_date', 'progress', 'created_at')
        read_only_fields = fields

    def get_status(self, obj):
        return _compute_cycle_status(obj.start_date, obj.end_date)

    def get_progress(self, obj):
        total = obj.issues.count()
        if not total:
            return 0
        done = obj.issues.filter(status__in=['done', 'cancelled']).count()
        return round(done / total * 100)


class CycleDetailSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    issue_counts_by_status = serializers.SerializerMethodField()

    class Meta:
        model = Cycle
        fields = (
            'id', 'name', 'description', 'status', 'start_date', 'end_date',
            'progress', 'issue_counts_by_status', 'created_at', 'updated_at',
        )
        read_only_fields = fields

    def get_status(self, obj):
        return _compute_cycle_status(obj.start_date, obj.end_date)

    def get_progress(self, obj):
        total = obj.issues.count()
        if not total:
            return 0
        done = obj.issues.filter(status__in=['done', 'cancelled']).count()
        return round(done / total * 100)

    def get_issue_counts_by_status(self, obj):
        from django.db.models import Count
        counts = obj.issues.values('status').annotate(n=Count('id'))
        return {row['status']: row['n'] for row in counts}


class CycleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cycle
        fields = ('name', 'description', 'start_date', 'end_date')

    def validate(self, data):
        if data.get('end_date') and data.get('start_date') and data['end_date'] <= data['start_date']:
            raise serializers.ValidationError({'end_date': 'end_date must be after start_date.'})
        return data
