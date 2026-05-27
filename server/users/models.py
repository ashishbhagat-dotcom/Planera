import uuid
import random
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150, blank=True)
    avatar_url = models.URLField(max_length=500, blank=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        db_table = 'users_user'

    def __str__(self):
        return self.email


class OTPRegistration(models.Model):
    email = models.EmailField()
    full_name = models.CharField(max_length=150, blank=True)
    hashed_password = models.CharField(max_length=128)
    otp_code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users_otp_registration'
        indexes = [models.Index(fields=['email', 'is_used'])]

    @classmethod
    def create_for_email(cls, email, full_name, hashed_password):
        cls.objects.filter(email=email, is_used=False).delete()
        code = f'{random.randint(0, 999999):06d}'
        expires_at = timezone.now() + timezone.timedelta(minutes=10)
        return cls.objects.create(
            email=email,
            full_name=full_name,
            hashed_password=hashed_password,
            otp_code=code,
            expires_at=expires_at,
        )

    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at
