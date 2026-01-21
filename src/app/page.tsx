"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500">
        <div className="text-white text-xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500 p-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">GroupMatch</h1>
        <p className="text-xl text-white/80 mb-8">
          Find your squad&apos;s perfect match
        </p>

        {user ? (
          <div className="space-y-4">
            <Link
              href="/browse"
              className="block w-64 bg-white text-purple-600 font-semibold py-3 px-6 rounded-full hover:bg-gray-100 transition"
            >
              Browse Groups
            </Link>
            <Link
              href="/matches"
              className="block w-64 bg-white/20 text-white font-semibold py-3 px-6 rounded-full hover:bg-white/30 transition"
            >
              View Matches
            </Link>
            <Link
              href="/group"
              className="block w-64 bg-white/20 text-white font-semibold py-3 px-6 rounded-full hover:bg-white/30 transition"
            >
              My Group
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <Link
              href="/login"
              className="block w-64 bg-white text-purple-600 font-semibold py-3 px-6 rounded-full hover:bg-gray-100 transition"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="block w-64 bg-white/20 text-white font-semibold py-3 px-6 rounded-full hover:bg-white/30 transition"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
