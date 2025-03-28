"use client";
import React from "react";
import { useParams } from "next/navigation";

interface Track {
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
    release_date: string; // Release date of the album
  };
  preview_url: string | null;
  duration_ms: number; // Duration of the track in milliseconds
}

export default function Page() {
  const { artist, song } = useParams() as { artist: string; song: string };
  const [track, setTrack] = React.useState<Track | null>(null);
  const [videoId, setVideoId] = React.useState<string | null>(null);
  const [songs, setSongs] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [relatedTracks, setRelatedTracks] = React.useState<any[]>([]); // State for related tracks

  React.useEffect(() => {
    if (artist && song) {
      async function fetchData() {
        try {
          // Fetch song details
          const response = await fetch(
            `/api/Music/route?type=songDetails&artistName=${encodeURIComponent(
              artist
            )}&songName=${encodeURIComponent(song)}`
          );
          if (!response.ok) {
            const errorData = await response.json();
            setError(errorData.error || "Failed to fetch song details");
            return;
          }
          const trackData = await response.json();
          setTrack(trackData);

          // Fetch YouTube video
          const videoResponse = await fetch(
            `/api/Music/route?type=youtubeMusicVideo&artistName=${encodeURIComponent(
              artist
            )}&songName=${encodeURIComponent(song)}`
          );
          const videoData = await videoResponse.json();
          if (videoData.videoId) {
            setVideoId(videoData.videoId);
          }

          // Fetch and display lyrics
          await fetchAndDisplayLyrics(artist, song);

          // Fetch related tracks
          fetchRelatedTracks(trackData.id); // Pass the track ID to fetch related tracks

        } catch (err) {
          console.error("Error fetching data:", err);
          setError("An unexpected error occurred");
        }
      }

      fetchData();
    }
  }, [artist, song]);

  async function fetchAndDisplayLyrics(artistName: string, songName: string) {
    try {
      const response = await fetch(
        `/api/Music/route?type=lyrics&artistName=${encodeURIComponent(
          artistName
        )}&songName=${encodeURIComponent(songName)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch lyrics");
      }

      const data = await response.json();
      if (data.lyrics) {
        const formattedLyrics = formatLyrics(data.lyrics);
        const lyricsContainer = document.getElementById("lyrics-container");
        if (lyricsContainer) {
          lyricsContainer.innerHTML = formattedLyrics;
        }
      } else {
        throw new Error("Lyrics not found");
      }
    } catch (error) {
      console.error("Error fetching lyrics:", error);
      const lyricsContainer = document.getElementById("lyrics-container");
      if (lyricsContainer) {
        lyricsContainer.textContent = "Failed to load lyrics.";
      }
    }
  }


  function formatLyrics(lyrics: string) {
    return lyrics
      .replace(/(.*?)/g, '<div class="lyrics-section"><strong>[$1]</strong></div>')
      .replace(/\n/g, "<br>");
  }
  async function fetchSongs(songName: string) {
    try {
      const response = await fetch(
        `/api/Music/route?type=artistSongs&artistName=${encodeURIComponent(artist)}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch songs");
        return;
      }
      const songsData = await response.json();

      // Filter out duplicates and the current song
      const filteredSongs = songsData
        .filter(
          (song: any, index: number, self: any[]) =>
            song.name.toLowerCase() !== songName.toLowerCase() && // Exclude the current song
            self.findIndex((s) => s.name.toLowerCase() === song.name.toLowerCase()) === index // Remove duplicates
        )
      setSongs(filteredSongs);
    } catch (err) {
      console.error("Error fetching songs:", err);
      setError("An unexpected error occurred");
    }
  }
  fetchSongs(song);

  async function fetchRelatedTracks(trackId: string) {
    try {
      const response = await fetch(
        `/api/Music/route?type=relatedTracks&trackId=${encodeURIComponent(trackId)}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch related tracks");
        return;
      }
      const relatedTracksData = await response.json();
      setRelatedTracks(relatedTracksData);
    } catch (err) {
      console.error("Error fetching related tracks:", err);
      setError("An unexpected error occurred");
    }
  }
  if (error) {
    return <h1>{error}</h1>;
  }

  if (!track) {
    return <h1>Loading...</h1>;
  }

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>{track.name}</h1>
      <h2>by {track.artists.map((a) => a.name).join(", ")}</h2>
      <img src={track.album.images[0]?.url} alt={track.name} width="300" />

      {/* Song Details Table */}
      <table style={{ margin: "20px auto", borderCollapse: "collapse", width: "80%" }}>
        <tbody>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Detail</th>
            <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Value</th>
          </tr>
          <tr>
            <td style={{ border: "1px solid #ddd", padding: "8px" }}>Artist(s)</td>
            <td style={{ border: "1px solid #ddd", padding: "8px" }}>
              {track.artists.map((a) => a.name).join(", ")}
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #ddd", padding: "8px" }}>Album</td>
            <td style={{ border: "1px solid #ddd", padding: "8px" }}>{track.album.name}</td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #ddd", padding: "8px" }}>Duration</td>
            <td style={{ border: "1px solid #ddd", padding: "8px" }}>
              {track.duration_ms
                ? `${Math.floor(track.duration_ms / 60000)}:${(
                  (track.duration_ms % 60000) /
                  1000
                )
                  .toFixed(0)
                  .padStart(2, "0")}`
                : "N/A"}
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #ddd", padding: "8px" }}>Release Date</td>
            <td style={{ border: "1px solid #ddd", padding: "8px" }}>
              {track.album.release_date || "N/A"}
            </td>
          </tr>
        </tbody>
      </table>

      {track.preview_url && (
        <audio controls>
          <source src={track.preview_url} type="audio/mpeg" />
          Your browser does not support the audio tag.
        </audio>
      )}
      <div id="youtube-video" style={{ marginTop: "20px" }}>
        {videoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            allowFullScreen
            width="560"
            height="315"
          ></iframe>
        ) : (
          <p>No video available for this song.</p>
        )}
      </div>
      <div id="lyrics-container" style={{ marginTop: "20px", textAlign: "left" }}>
        <h3>Lyrics:</h3>
        <p>Loading lyrics...</p>
      </div>
      <h1>Songs by {artist}</h1>
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          gap: "20px",
          padding: "10px",
        }}
      >
        {songs.map((song, index) => (
          <div
            key={index}
            style={{
              minWidth: "200px",
              textAlign: "center",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "10px",
            }}
          >
            <img
              src={song.album.images[0]?.url || "/placeholder.jpg"}
              alt={song.name}
              style={{ width: "100%", borderRadius: "8px" }}
            />
            <h3 style={{ fontSize: "16px", margin: "10px 0" }}>{song.name}</h3>
            <p style={{ fontSize: "14px", color: "#555" }}>
              {song.artists.map((a: any) => a.name).join(", ")}
            </p>
          </div>
        ))}
      </div>
      {/* Related Tracks Section */}
      <h1>Related Tracks</h1>
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          gap: "20px",
          padding: "10px",
        }}
      >
        {relatedTracks.map((relatedTrack, index) => (
          <div
            key={index}
            style={{
              minWidth: "200px",
              textAlign: "center",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "10px",
            }}
          >
            <img
              src={relatedTrack.album.images[0]?.url || "/placeholder.jpg"}
              alt={relatedTrack.name}
              style={{ width: "100%", borderRadius: "8px" }}
            />
            <h3 style={{ fontSize: "16px", margin: "10px 0" }}>{relatedTrack.name}</h3>
            <p style={{ fontSize: "14px", color: "#555" }}>
              {relatedTrack.artists.map((a: any) => a.name).join(", ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}