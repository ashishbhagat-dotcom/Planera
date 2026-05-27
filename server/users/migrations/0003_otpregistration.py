from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_alter_user_groups_alter_user_is_superuser_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='OTPRegistration',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField(max_length=254)),
                ('full_name', models.CharField(blank=True, max_length=150)),
                ('hashed_password', models.CharField(max_length=128)),
                ('otp_code', models.CharField(max_length=6)),
                ('expires_at', models.DateTimeField()),
                ('is_used', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'users_otp_registration',
                'indexes': [models.Index(fields=['email', 'is_used'], name='users_otp_email_used_idx')],
            },
        ),
    ]
