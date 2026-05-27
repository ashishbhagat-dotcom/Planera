from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from .models import User, OTPRegistration


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'avatar_url', 'created_at')
        read_only_fields = ('id', 'email', 'created_at')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('email', 'full_name', 'password')

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data.get('full_name', ''),
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs['email'], password=attrs['password'])
        if not user:
            raise serializers.ValidationError('Invalid credentials.')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled.')
        attrs['user'] = user
        return attrs


class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def save(self):
        email = self.validated_data['email']
        full_name = self.validated_data['full_name']
        hashed = make_password(self.validated_data['password'])
        otp = OTPRegistration.create_for_email(email, full_name, hashed)
        return otp


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6, min_length=6)

    def validate(self, attrs):
        try:
            otp = OTPRegistration.objects.filter(
                email=attrs['email'],
                otp_code=attrs['otp_code'],
                is_used=False,
            ).latest('created_at')
        except OTPRegistration.DoesNotExist:
            raise serializers.ValidationError('Invalid or expired OTP.')
        if not otp.is_valid():
            raise serializers.ValidationError('OTP has expired. Please request a new one.')
        attrs['otp'] = otp
        return attrs

    def save(self):
        otp = self.validated_data['otp']
        user = User.objects.create(
            email=otp.email,
            full_name=otp.full_name,
            password=otp.hashed_password,
        )
        otp.is_used = True
        otp.save(update_fields=['is_used'])
        return user
