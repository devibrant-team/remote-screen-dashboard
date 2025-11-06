// src/Components/Dropdown/DefaultPlaylistDropdown.tsx
import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../../store";

import { useGetNormalPlaylist } from "../../ReactQuery/GetPlaylists/GetNormalPlaylist";
import { setDefaultPlaylist } from "../../Redux/ScreenManagement/ScreenManagementSlice";

type Playlist = {
  id: number;
  name: string;
  duration?: number;
  slideNumber?: number;
  media?: string;
};

type PlaylistWithKind = Playlist & {
  kind: "normal" | "interactive";
};

const DefaultPlaylistDropdown: React.FC = () => {
  const dispatch = useDispatch();

  // current selected playlist id from screen form
  const selectedPlaylistId = useSelector(
    (state: RootState) => state.screenManagement.playlist_id
  );

  const { data: normalData, isLoading: loadingNormal } = useGetNormalPlaylist();

  // Normalize normal playlists
  const normalPlaylists: PlaylistWithKind[] = useMemo(() => {
    if (Array.isArray(normalData)) {
      return (normalData as Playlist[]).map((p) => ({
        ...p,
        kind: "normal",
      }));
    }
    return [];
  }, [normalData]);

  // Normal first, then interactive
  const playlists: PlaylistWithKind[] = useMemo(
    () => [...normalPlaylists],
    [normalPlaylists]
  );

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    // store id as string | null in redux
    dispatch(setDefaultPlaylist(value === "" ? null : value));
  };

  if (loadingNormal) {
    return <div className="text-sm text-neutral-500">Loading playlists...</div>;
  }

  if (!playlists.length) {
    return <div className="text-sm text-neutral-500">No playlists found.</div>;
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-700">
        Default Playlist
      </label>
      <select
        value={selectedPlaylistId ?? ""}
        onChange={handleChange}
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition focus:border-neutral-400"
      >
        <option value="">No default playlist</option>

        {/* Normal first */}
        {normalPlaylists.map((pl) => (
          <option key={`normal-${pl.id}`} value={String(pl.id)}>
            {pl.name} (normal)
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-neutral-500">
        This playlist will play by default on this screen.
      </p>
    </div>
  );
};

export default DefaultPlaylistDropdown;
