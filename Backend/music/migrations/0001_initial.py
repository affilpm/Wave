# Generated by Django 5.1.4 on 2025-03-14 06:01

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('artists', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='EqualizerPreset',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50)),
                ('is_default', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('band_32', models.IntegerField(default=0)),
                ('band_64', models.IntegerField(default=0)),
                ('band_125', models.IntegerField(default=0)),
                ('band_250', models.IntegerField(default=0)),
                ('band_500', models.IntegerField(default=0)),
                ('band_1k', models.IntegerField(default=0)),
                ('band_2k', models.IntegerField(default=0)),
                ('band_4k', models.IntegerField(default=0)),
                ('band_8k', models.IntegerField(default=0)),
                ('band_16k', models.IntegerField(default=0)),
            ],
        ),
        migrations.CreateModel(
            name='Genre',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, unique=True)),
                ('description', models.TextField(blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='Music',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, unique=True)),
                ('cover_photo', models.ImageField(upload_to='music_covers/')),
                ('audio_file', models.FileField(upload_to='music/', validators=[django.core.validators.FileExtensionValidator(allowed_extensions=['mp3', 'wav', 'aac'])])),
                ('video_file', models.FileField(blank=True, null=True, upload_to='music_videos/', validators=[django.core.validators.FileExtensionValidator(allowed_extensions=['mp4', 'mov'])])),
                ('duration', models.DurationField(blank=True, null=True)),
                ('approval_status', models.CharField(choices=[('pending', 'Pending Review'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='pending', max_length=20)),
                ('release_date', models.DateTimeField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_public', models.BooleanField(default=False, help_text='Whether this music is publicly available')),
            ],
        ),
        migrations.CreateModel(
            name='Album',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, unique=True)),
                ('description', models.TextField(blank=True)),
                ('is_public', models.BooleanField(default=True, help_text='Whether this album is publicly available')),
                ('cover_photo', models.ImageField(upload_to='album_covers/', validators=[django.core.validators.FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png'])])),
                ('banner_img', models.ImageField(blank=True, null=True, upload_to='album_banners/', validators=[django.core.validators.FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png'])])),
                ('release_date', models.DateTimeField()),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('published', 'Published'), ('scheduled', 'Scheduled')], default='published', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('duration', models.PositiveIntegerField(default=0, help_text='Total duration of the album in seconds')),
                ('artist', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='albums', to='artists.artist')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='AlbumTrack',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('track_number', models.PositiveIntegerField()),
                ('album', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='music.album')),
            ],
            options={
                'ordering': ['track_number'],
            },
        ),
    ]
