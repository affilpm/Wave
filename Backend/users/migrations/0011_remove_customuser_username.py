# Generated by Django 5.1.4 on 2024-12-31 14:13

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0010_customuser_username'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='customuser',
            name='username',
        ),
    ]