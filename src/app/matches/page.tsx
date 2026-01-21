"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Match {
  id: string;
  groupIds: string[];
  createdAt: Date;
}

interface Group {
  id: string;
  name: string;
  bio: string;
  photoUrl: string;
}

interface MatchWithGroup {
  matchId: string;
  otherGroup: Group;
}

export default function MatchesPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [matches, setMatches] = useState<MatchWithGroup[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchMatches = async () => {
      if (!userData?.groupId) {
        setLoadingMatches(false);
        return;
      }

      try {
        // Get all matches where user's group is involved
        const matchesQuery = query(
          collection(db, "matches"),
          where("groupIds", "array-contains", userData.groupId)
        );
        const matchesSnapshot = await getDocs(matchesQuery);

        const matchesWithGroups: MatchWithGroup[] = [];

        for (const matchDoc of matchesSnapshot.docs) {
          const matchData = matchDoc.data() as Match;
          const otherGroupId = matchData.groupIds.find(
            (id) => id !== userData.groupId
          );

          if (otherGroupId) {
            const groupDoc = await getDoc(doc(db, "groups", otherGroupId));
            if (groupDoc.exists()) {
              matchesWithGroups.push({
                matchId: matchDoc.id,
                otherGroup: {
                  id: groupDoc.id,
                  ...groupDoc.data(),
                } as Group,
              });
            }
          }
        }

        setMatches(matchesWithGroups);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoadingMatches(false);
      }
    };

    if (userData) {
      fetchMatches();
    }
  }, [userData]);

  if (loading || loadingMatches) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600 text-xl">Loading...</div>
      </main>
    );
  }

  if (!userData?.groupId) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Create a Group First
          </h1>
          <p className="text-gray-600 mb-6">
            You need to create a group before you can see matches.
          </p>
          <Link
            href="/group"
            className="inline-block bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 transition"
          >
            Create Group
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="text-gray-600 hover:text-gray-800">
            ← Home
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Your Matches</h1>
          <Link href="/browse" className="text-purple-600 hover:text-purple-800">
            Browse
          </Link>
        </div>

        {matches.length > 0 ? (
          <div className="space-y-4">
            {matches.map((match) => (
              <Link
                key={match.matchId}
                href={`/chat/${match.matchId}`}
                className="block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
              >
                <div className="flex items-center p-4">
                  <img
                    src={match.otherGroup.photoUrl}
                    alt={match.otherGroup.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div className="ml-4 flex-1">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {match.otherGroup.name}
                    </h2>
                    <p className="text-gray-500 text-sm truncate">
                      {match.otherGroup.bio}
                    </p>
                  </div>
                  <div className="text-purple-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">💝</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No Matches Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Keep browsing to find groups that match with you!
            </p>
            <Link
              href="/browse"
              className="inline-block bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 transition"
            >
              Browse Groups
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
