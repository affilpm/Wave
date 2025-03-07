# Generated by Django 5.0.6 on 2025-01-22 10:43

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('music', '0001_initial'),
        ('playlist', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='playlist',
            name='created_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_playlists', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='playlisttrack',
            name='music',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='music.music'),
        ),
        migrations.AddField(
            model_name='playlisttrack',
            name='playlist',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='playlist.playlist'),
        ),
        migrations.AddField(
            model_name='playlist',
            name='tracks',
            field=models.ManyToManyField(related_name='playlists', through='playlist.PlaylistTrack', to='music.music'),
        ),
        migrations.AlterUniqueTogether(
            name='playlisttrack',
            unique_together={('playlist', 'music', 'track_number')},
        ),
    ]
