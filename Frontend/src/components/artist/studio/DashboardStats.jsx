import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';
import { Music, Disc, PlayCircle, Users } from 'lucide-react';
import api from '../../../api';
import { Tooltip } from "react-tooltip";

const DashboardStats = () => {
  const [stats, setStats] = useState({
    totalTracks: 0,
    totalAlbums: 0,
    totalPlays: 0,
    totalListeners: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [tracksRes, albumsRes, playsRes, listenersRes] = await Promise.all([
          api.get('api/artists/track-count/'),
          api.get('api/artists/album-count/'),
          api.get('api/artists/total-plays/'),
          api.get('api/artists/listeners/'),
        ]);

        setStats({
          totalTracks: tracksRes.data.total_tracks,
          totalAlbums: albumsRes.data.total_albums,
          totalPlays: playsRes.data.total_plays,
          totalListeners: listenersRes.data.total_listeners,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard icon={Music} label="Total Tracks" value={stats.totalTracks} color="bg-blue-600" />
      <StatCard icon={Disc} label="Albums" value={stats.totalAlbums} color="bg-purple-600" />
      <StatCard 
        icon={PlayCircle} 
        label={
          <div className="flex items-center gap-2">
            Total Plays
            <span data-tooltip-id="play-tooltip" className="cursor-pointer text-gray-400">
              ℹ️
            </span>
            <Tooltip id="play-tooltip" place="top" content="A play is counted only after 30 seconds of listening." />
          </div>
        } 
        value={stats.totalPlays.toLocaleString()} 
        color="bg-green-600" 
      />
      <StatCard icon={Users} label="Monthly Listeners" value={stats.totalListeners.toLocaleString()} color="bg-orange-600" />
    </div>
  );
};

export default DashboardStats;