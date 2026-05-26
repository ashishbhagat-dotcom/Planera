from rest_framework import serializers

from users.serializers import UserSerializer
from .models import Membership, Organization


class WorkspaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ('id', 'name', 'slug', 'logo_url', 'created_at')
        read_only_fields = ('id', 'created_at')

    def validate_slug(self, value):
        if Organization.objects.filter(slug=value).exists():
            raise serializers.ValidationError('A workspace with this slug already exists.')
        return value


class MembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Membership
        fields = ('id', 'user', 'role', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')


class MembershipUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membership
        fields = ('role',)

    def validate_role(self, value):
        if value not in (Membership.OWNER, Membership.ADMIN, Membership.MEMBER):
            raise serializers.ValidationError('Invalid role.')
        return value


class InviteMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(
        choices=[Membership.ADMIN, Membership.MEMBER],
        default=Membership.MEMBER,
    )
