# Generated by Django 5.1.4 on 2025-02-05 06:28

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('music', '0001_initial'),
        ('playlist', '0002_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='playlist',
            constraint=models.UniqueConstraint(fields=('name', 'created_by'), name='unique_playlist_per_user'),
        ),
    ]
