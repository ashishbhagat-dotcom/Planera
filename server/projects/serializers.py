from rest_framework import serializers

from users.serializers import UserSerializer
from .models import Project


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
