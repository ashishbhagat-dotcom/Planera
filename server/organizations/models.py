from django.conf import settings
from django.db import models

from core.models import BaseModel


class Organization(BaseModel):
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=80, unique=True)
    logo_url = models.URLField(max_length=500, blank=True)

    class Meta:
        db_table = 'organizations_organization'
        ordering = ['name']

    def __str__(self):
        return self.name


class Membership(BaseModel):
    OWNER = 'owner'
    ADMIN = 'admin'
    MEMBER = 'member'
    ROLE_CHOICES = [
        (OWNER, 'Owner'),
        (ADMIN, 'Admin'),
        (MEMBER, 'Member'),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='memberships',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='memberships',
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=MEMBER)

    class Meta:
        db_table = 'organizations_membership'
        unique_together = ('organization', 'user')
        ordering = ['role', 'user__email']

    def __str__(self):
        return f'{self.user.email} @ {self.organization.slug} ({self.role})'
