from django.contrib import admin
from .models import Artist
from django.contrib import admin
from .models import Artist

@admin.register(Artist)
class ArtistAdmin(admin.ModelAdmin):
    list_display = ['user', 'status', 'submitted_at', 'updated_at']
    list_filter = ['status']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']