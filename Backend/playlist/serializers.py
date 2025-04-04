# serializers.py
from rest_framework import serializers
from .models import Playlist, PlaylistTrack
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets
# from music.serializers import MusicSerializer
from users.serializers import UserSerializer
from music.models import Music
from rest_framework import serializers
from datetime import timedelta
from music.models import Genre
import os

class MusicSerializer(serializers.ModelSerializer):
    artist_email = serializers.SerializerMethodField()
    artist_full_name = serializers.SerializerMethodField()
    artist_username = serializers.SerializerMethodField()
    
    class Meta:
        model = Music
        fields = [
            'id', 'name', 'cover_photo', 'release_date',
            'approval_status', 'duration', 'artist', 
            'artist_email', 'artist_full_name',
            'artist_username', 'is_public',
        ]

    def get_artist_email(self, obj):
        # Assuming the artist field is related to the User model
        return obj.artist.user.email if obj.artist and obj.artist.user else None

    def get_artist_username(self, obj):
        # Assuming the artist field is related to the User model
        return obj.artist.user.username if obj.artist and obj.artist.user else None
    
    def get_artist_full_name(self, obj):
        # Combine first name and last name
        if obj.artist and obj.artist.user:
            return f"{obj.artist.user.first_name} {obj.artist.user.last_name}".strip()
        return None
    
    def validate_cover_photo(self, value):
        # Check the length of the filename
        file_name, file_extension = os.path.splitext(value.name)
        if len(file_name) > 250:
            raise serializers.ValidationError("Ensure this filename has at most 100 characters.")
        return value
    
    
    
class PlaylistTrackSerializer(serializers.ModelSerializer):
    music_details = MusicSerializer(source='music', read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = PlaylistTrack
        fields = ['track_number', 'music_details', 'created_at']
        read_only_fields = ['id', 'created_at']
        
        
class PlaylistTrackViewSet(viewsets.ModelViewSet):
   serializer_class = PlaylistTrackSerializer
   permission_classes = [IsAuthenticated]
   
   def get_queryset(self):
       # Fetch playlist tracks for the authenticated user's playlists
       return PlaylistTrack.objects.filter(playlist__created_by=self.request.user)
   

class PlaylistSerializer(serializers.ModelSerializer):
    tracks = PlaylistTrackSerializer(source='playlisttrack_set', many=True, read_only=True)
    # created_by_details = UserSerializer(source='created_by', read_only=True)
    created_by = serializers.CharField(source='created_by.email', read_only = True) 
    created_by_username = serializers.CharField(source='created_by.username', read_only = True)  # To show username
    
    
    class Meta:
        model = Playlist
        fields = [
            'id', 'name', 'description', 'is_public', 
            'cover_photo', 'duration', 'created_at', 
            'updated_at', 'tracks', 'created_by_username',
            'created_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by_username', 'created_by']


    def create(self, validated_data):
        # Assign the current user as the creator
        user = self.context['request'].user
        validated_data['created_by'] = user
        return super().create(validated_data)
    
    def validate_is_public(self, value):
        # Handle string values from form data
        if isinstance(value, str):
            if value.lower() == 'true':
                return True
            elif value.lower() == 'false':
                return False
        return value
    
    def validate_name(self, value):
        user = self.context['request'].user  # Get the logged-in user
        
        # For updates, exclude the current instance from the uniqueness check
        current_instance = getattr(self, 'instance', None)
        
        # Check if this is an update operation on an existing playlist
        if current_instance is not None:
            # If updating an existing playlist with the same name, this is allowed
            if current_instance.name == value:
                return value
                
            # Otherwise, check if another playlist has this name
            if Playlist.objects.filter(name=value, created_by=user).exclude(id=current_instance.id).exists():
                raise serializers.ValidationError("You already have a playlist with this name.")
        else:
            # For new playlists, perform the regular check
            if Playlist.objects.filter(name=value, created_by=user).exists():
                raise serializers.ValidationError("You already have a playlist with this name.")
                
        return value
    
    
    