# Generated by Django 5.1.4 on 2025-03-14 06:01

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('artists', '0001_initial'),
        ('music', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='artist',
            name='genres',
            field=models.ManyToManyField(related_name='artists', to='music.genre'),
        ),
    ]
