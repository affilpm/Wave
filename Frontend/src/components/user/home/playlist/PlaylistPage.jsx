import React, { useState, useEffect } from "react";
import { Play, Pause, Clock, Plus, Share2, X, Shuffle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../../../api";
import PlaylistMenuModal from "./PlaylistMenuModal";
import EditPlaylistModal from "./EditPlaylistModal";
import TrackSearch from "./TrackSearch";
import {
  formatDuration,
  convertToSeconds,
  convertToHrMinFormat,
} from "../../../../utils/formatters";

const PlaylistPage = () => {
  const [playlist, setPlaylist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { playlistId } = useParams();
  const navigate = useNavigate();

  const [totalDuration, setTotalDuration] = useState("");

  useEffect(() => {
    const calculateTotalDuration = () => {
      if (playlist?.tracks?.length) {
        // Accumulate the total duration in seconds
        const totalSeconds = playlist.tracks.reduce((acc, track) => {
          const trackDuration = track.music_details?.duration || "00:00:00"; // Default to '00:00:00' if undefined
          return acc + convertToSeconds(trackDuration);
        }, 0); // Start with 0 seconds

        // Convert total seconds to formatted duration
        const combinedDuration = convertToHrMinFormat(totalSeconds);
        setTotalDuration(combinedDuration);
      }
    };

    calculateTotalDuration();
  }, [playlist]);

  const handleEdit = () => setIsEditModalOpen(true);

  const handleEditPlaylist = (updatedPlaylist) => setPlaylist(updatedPlaylist);

  const handleTogglePrivacy = async () => {
    try {
      await api.patch(`/api/playlist/playlists/${playlistId}/`, {
        is_public: !playlist.is_public,
      });
      setPlaylist((prev) => ({ ...prev, is_public: !prev.is_public }));
    } catch (err) {
      setError("Failed to update playlist privacy");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this playlist?")) {
      try {
        await api.delete(`/api/playlist/playlists/${playlistId}/`);
        navigate("/home");
      } catch (err) {
        setError("Failed to delete playlist");
      }
    }
  };

  const handleRemoveTrack = async (trackId) => {
    try {
      await api.post(`/api/playlist/playlists/${playlistId}/remove_tracks/`, {
        track_ids: [trackId],
      });
      handleTracksUpdate();
    } catch (err) {
      setError("Failed to remove track");
    }
  };

  const handlePlayTrack = (trackId) => {
    setCurrentTrackId(trackId);
    setIsPlaying(true);
  };

  const handleTracksUpdate = async () => {
    try {
      const response = await api.get(`/api/playlist/playlists/${playlistId}/`);
      setPlaylist(response.data);
      console.log(response.data);
    } catch (err) {
      setError("Failed to refresh playlist");
    }
  };

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const response = await api.get(
          `/api/playlist/playlists/${playlistId}/`
        );
        setPlaylist(response.data);
        console.log(response.data);
      } catch (err) {
        setError("Failed to load playlist");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylist();
  }, [playlistId]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-48 w-48 bg-gray-700 animate-pulse rounded-lg"></div>
        <div className="h-12 w-64 bg-gray-700 animate-pulse rounded"></div>
        <div className="h-8 w-32 bg-gray-700 animate-pulse rounded"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 via-black to-black text-white">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-end gap-6 p-6">
        <div className="relative group w-48 h-48 flex-shrink-0">
          <img
            src={playlist.cover_photo || "/api/placeholder/192/192"}
            alt={playlist.name}
            className="w-full h-full object-cover rounded-lg shadow-2xl transition-opacity group-hover:opacity-75"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-md backdrop-blur-sm text-sm font-medium transition-colors"
            >
              Change Photo
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <span className="text-sm font-medium uppercase tracking-wider text-gray-400">
            {playlist.is_public ? "Public Playlist" : "Private Playlist"}
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            {playlist.name}
          </h1>
          <div className="flex items-center gap-4 text-gray-300">
            <span className="text-sm">
              Created by{" "}
              <span className="text-white">
                {playlist.created_by_details?.first_name}
              </span>{" "}
              • {playlist.tracks?.length || 0} songs • {totalDuration}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 p-6">
        <button
          className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center transition-colors"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? (
            <Pause className="h-6 w-6 text-black" />
          ) : (
            <Play className="h-6 w-6 text-black ml-1" />
          )}
        </button>

        <button
          className={`p-2 text-gray-400 hover:text-white transition-colors ${
            isShuffling ? "text-green-500" : ""
          }`}
          onClick={() => setIsShuffling(!isShuffling)}
        >
          <Shuffle className="h-6 w-6" />
        </button>

        <button className="group p-1 border-2 border-gray-400 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200 transform group-hover:scale-90 hover:border-gray-100 hover:bg-transparent">
          <Plus className="h-6 w-6 text-gray-400 group-hover:text-white transition-colors" />
        </button>

        <button className="p-2 text-gray-400 hover:text-white transition-colors">
          <Share2 className="h-6 w-6" />
        </button>

        <PlaylistMenuModal
          playlist={playlist}
          onEdit={handleEdit}
          onTogglePrivacy={handleTogglePrivacy}
          onDelete={handleDelete}
        />
      </div>

      {/* Track List */}
      <div className="flex-1 p-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-gray-400 border-b border-gray-800">
              <th className="font-normal text-left py-3 w-12 pl-4">#</th>
              <th className="font-normal text-left py-3 pl-3">Title</th>
              <th className="font-normal text-left py-3 hidden md:table-cell pl-3">
                Artist
              </th>
              <th className="font-normal text-left py-3 hidden md:table-cell pl-3">
                Added
              </th>
              <th className="font-normal text-center py-3 w-20">
                <Clock className="h-4 w-4 inline" />
              </th>
              <th className="w-8 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {playlist.tracks?.map((track) => (
              <tr
                key={track.id}
                className={`group hover:bg-white/10 transition-colors ${
                  currentTrackId === track.id ? "bg-white/20" : ""
                }`}
              >
                <td className="py-3 pl-4">
                  <div className="flex items-center justify-start w-6">
                    <span className="group-hover:hidden">
                      {currentTrackId === track.id ? "▶️" : track.track_number}
                    </span>
                    <button
                      className="hidden group-hover:flex p-1 hover:text-white text-gray-400"
                      onClick={() => handlePlayTrack(track.id)}
                    >
                      <Play className="h-4 w-4" />
                    </button>
                  </div>
                </td>
                <td className="py-3 pl-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        track.music_details?.cover_photo ||
                        "/api/placeholder/40/40"
                      }
                      alt={track.music_details?.artist_full_name}
                      className="w-10 h-10 rounded-md"
                    />
                    <span className="font-medium">
                      {track.music_details?.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 pl-3 hidden md:table-cell text-gray-400">
                  {track.music_details?.artist_full_name}
                </td>
                <td className="py-3 pl-3 hidden md:table-cell text-gray-400">
                  {track.music_details?.release_date}
                </td>
                <td className="py-3 text-center text-gray-400 w-20">
                  {formatDuration(track.music_details?.duration)}{" "}
                  {/* Format each track's duration */}
                </td>
                <td className="py-3 pr-4 text-right">
                  <button
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-400 transition-all"
                    onClick={() => handleRemoveTrack(track.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <TrackSearch
          playlistId={playlistId}
          onTracksUpdate={handleTracksUpdate}
        />
      </div>

      <EditPlaylistModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onEditPlaylist={handleEditPlaylist}
        playlist={playlist}
      />
    </div>
  );
};

export default PlaylistPage;
