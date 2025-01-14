from django.shortcuts import render
from .serializers import AlbumTrackSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import viewsets, status
from rest_framework.decorators import action
from music.models import AlbumTrack, Album
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from mutagen.mp3 import MP3
from mutagen.wavpack import WavPack
from mutagen import File
from .serializers import AlbumSerializer
from django.core.exceptions import ValidationError
from django.db import IntegrityError
import json
# Create your views here.

class AlbumViewSet(viewsets.ModelViewSet):
    serializer_class = AlbumSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Album.objects.filter(artist=self.request.user.artist_profile)
    def perform_create(self, serializer):
        serializer.save(artist=self.request.user.artist)
        
    @action(detail=True, methods=['patch'])
    def update_is_public(self, request, pk=None):
        try:
            album = self.get_object()  
            
            album.is_public = not album.is_public
            album.save()

            return Response(
                {'is_public': album.is_public},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
                
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        try:
            # Extract tracks data from request
            tracks_data = []
            if 'tracks' in request.data:
                tracks_data = json.loads(request.data['tracks'])
                del request.data['tracks']
            
            # Create serializer with album data
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Add artist to validated data
            serializer.validated_data['artist'] = request.user.artist_profile
            
            # Save album
            album = serializer.save()
            
            # Create album tracks
            for track_data in tracks_data:
                AlbumTrack.objects.create(
                    album=album,
                    track_id=track_data['track'],
                    track_number=track_data['track_number']
                )
            
            # Return updated album data
            serializer = self.get_serializer(album)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    @action(detail=False, methods=['get'])
    def check_album_existence(self, request):
        try:
            album_name = request.query_params.get('name', '').strip()
            
            if not album_name:
                return Response({
                    'exists': False,
                    'message': 'Album name is required'
                })
                
            artist = request.user.artist_profile
            
            exists = Album.objects.filter(
                name__iexact=album_name, 
                # artist=artist
            ).exists()
            
            return Response({
                'exists': exists,
                'message': 'Album name exists' if exists else 'Album name available'
            })
            
        except Exception as e:
            return Response(
                {
                    'error': str(e),
                    'message': 'Failed to check album existence'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
            
    @action(detail=False, methods=['get'])
    def drafts(self, request):
        drafts = self.get_queryset().filter(status='draft')
        serializer = self.get_serializer(drafts, many=True)
        return Response(serializer.data)





###3




class TrackViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AlbumTrackSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter AlbumTrack by the artist associated with the logged-in user.
        Only tracks belonging to albums created by the logged-in user's artist profile are shown.
        """
        user = self.request.user
        # Filter tracks by the logged-in user's artist profile
        return AlbumTrack.objects.filter(album__artist=user.artist_profile)
    @action(detail=False, methods=['get'])
    def available_tracks(self, request):
        """
        Fetch tracks available for the authenticated user.
        This method returns tracks from albums associated with the user's artist profile.
        """
        tracks = self.get_queryset()
        serializer = self.get_serializer(tracks, many=True)
        return Response(serializer.data)
    