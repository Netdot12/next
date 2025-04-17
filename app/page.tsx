"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link"; // Import Link from next/link

interface ChartItem {
  title: string;
  artist: string;
  image: string;
}

export default function HomePage() {
  const [songs, setSongs] = useState<ChartItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTopSongs() {
      try {
        const response = await fetch(`/api/Music/route?type=topSongs`);
        if (!response.ok) throw new Error("Failed to fetch top songs");
        const data = await response.json();
        setSongs(data);
      } catch (err: any) {
        console.error(err.message);
        setError(err.message);
      }
    }

    fetchTopSongs();
  }, []);

  if (error) {
    return <h1>Error: {error}</h1>;
  }

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Billboard Global 200</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {songs.map((song, idx) => (
          <Link
            key={idx}
            href={`/music/${song.artist.split(/['"&]|feat(?:uring)?/i)[0].trim()}/song/${song.title}`}
          >
            <div className="border rounded-lg p-2 shadow-md bg-gray-800 cursor-pointer">
              <img
                src={song.image}
                alt={song.title}
                className="w-full h-48 object-cover rounded"
              />
              <h2 className="font-semibold mt-2">{song.title}</h2>
              <p className="text-gray-400">
                {song.artist.split(/['"&]|feat(?:uring)?/i)[0].trim()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
