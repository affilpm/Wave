from django.shortcuts import render
from .serializers import AlbumTrackSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import viewsets, status
from rest_framework.views import APIView
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
from rest_framework.parsers import JSONParser
from music.serializers import  MusicSerializer
from rest_framework.viewsets import ModelViewSet
from music.models import Music, MusicApprovalStatus
from django.db.models import Q, Prefetch




# Create your views here.
class AlbumData(viewsets.ModelViewSet):
    serializer_class = AlbumSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Fetch albums with proper music visibility rules:
        - For users' albums, only show public tracks
        - For other users' albums, only show public albums with public tracks
        """
        user = self.request.user
        
        # Base queryset - user can see all their albums plus public albums from others
        queryset = Album.objects.filter(
            is_public=True
        )
        
        # Prefetch related tracks with proper visibility rules
        queryset = queryset.prefetch_related(
            Prefetch(
                'albumtrack_set',
                queryset=AlbumTrack.objects.filter(
                    track__is_public=True
                ).select_related('track')
            )
        )
        
        return queryset

        
        
class AlbumViewSet(viewsets.ModelViewSet):
    serializer_class = AlbumSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Album.objects.filter(artist__user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(artist__user=self.request.user)
        
    def destroy(self, request, *args, **kwargs):
        """
        Completely delete the album, including any related files or associated data.
        """
        album = self.get_object()  # Get the album object to be deleted
        # Optional: You can add logic to delete related files or data here
        album.delete()  # Deletes the album from the database

        # Return a success response
        return Response({"detail": "Album deleted successfully."}, status=status.HTTP_204_NO_CONTENT)    
        
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
            if not serializer.is_valid():
                
                return Response({
                    'error': 'Validation failed',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
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
    def validate_album_name(request):
        """
        Endpoint to check if an album name already exists.
        """
        try:
            album_name = request.query_params.get('name', '').strip()
            album_id = request.query_params.get('id', None)  # Optional for editing scenarios

            if not album_name:
                return Response({
                    'exists': False,
                    'message': 'Album name is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Filter albums with the same name but exclude the current album being edited
            query = Album.objects.filter(name__iexact=album_name)
            if album_id:
                query = query.exclude(id=album_id)

            exists = query.exists()

            return Response({
                'exists': exists,
                'message': 'Album name exists' if exists else 'Album name available'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {
                    'error': str(e),
                    'message': 'Failed to validate album name'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )        
            
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        try:
            # Get existing album
            album = self.get_object()

            # Create a mutable copy of request.data if it's immutable
            mutable_data = request.data.copy() if hasattr(request.data, 'copy') else request.data

            # Extract tracks data from request
            tracks_data = None
            if 'tracks' in mutable_data:
                try:
                    tracks_data = json.loads(mutable_data['tracks'])
                    del mutable_data['tracks']
                except json.JSONDecodeError:
                    return Response(
                        {'error': 'Invalid tracks data format'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Update album data
            serializer = self.get_serializer(album, data=mutable_data, partial=True)
            serializer.is_valid(raise_exception=True)
            updated_album = serializer.save()

            if tracks_data is not None:
                existing_tracks = {t.track_id: t for t in AlbumTrack.objects.filter(album=album)}

                new_tracks = []
                for track_data in tracks_data:
                    track_id = track_data['track']
                    track_number = track_data['track_number']

                    if track_id in existing_tracks:
                        # Update the existing track if needed
                        existing_track = existing_tracks[track_id]
                        if existing_track.track_number != track_number:
                            existing_track.track_number = track_number
                            existing_track.save()
                    else:
                        # Create a new track
                        new_tracks.append(AlbumTrack(album=updated_album, track_id=track_id, track_number=track_number))

                # Bulk create only new tracks
                AlbumTrack.objects.bulk_create(new_tracks)

                # Optionally, remove tracks that are not in the updated list
                track_ids = {t['track'] for t in tracks_data}
                AlbumTrack.objects.filter(album=album).exclude(track_id__in=track_ids).delete()

            # Return updated album data
            serializer = self.get_serializer(updated_album)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            # Rollback will happen automatically if there's an error due to @transaction.atomic
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )     

 
            
    @action(detail=False, methods=['get'])
    def drafts(self, request):
        drafts = self.get_queryset().filter(status='draft')
        serializer = self.get_serializer(drafts, many=True)
        return Response(serializer.data)






class MusicViewSet(ModelViewSet):
    queryset = Music.objects.all()
    serializer_class = MusicSerializer

    def get_queryset(self):
        used_tracks = AlbumTrack.objects.values_list('track_id', flat=True)

        queryset = Music.objects.filter(
            artist__user=self.request.user,
            approval_status=MusicApprovalStatus.APPROVED  # Ensure only approved tracks are retrieved
        ).exclude(id__in=used_tracks).select_related('artist__user').prefetch_related('genres')

        
        return queryset
    
    
    
