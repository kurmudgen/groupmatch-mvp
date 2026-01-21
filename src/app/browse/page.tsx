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
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Group {
  id: string;
  name: string;
  bio: string;
  photoUrl: string;
  adminUserId: string;
}

export default function BrowsePage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [matchFound, setMatchFound] = useState<Group | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!userData?.groupId) {
        setLoadingGroups(false);
        return;
      }

      try {
        // Get all groups except user's own group
        const groupsSnapshot = await getDocs(collection(db, "groups"));
        const allGroups: Group[] = [];

        groupsSnapshot.forEach((doc) => {
          if (doc.id !== userData.groupId) {
            allGroups.push({
              id: doc.id,
              ...doc.data(),
            } as Group);
          }
        });

        // Get groups the user has already liked
        const likesQuery = query(
          collection(db, "likes"),
          where("fromGroupId", "==", userData.groupId)
        );
        const likesSnapshot = await getDocs(likesQuery);
        const likedGroupIds = new Set<string>();
        likesSnapshot.forEach((doc) => {
          likedGroupIds.add(doc.data().toGroupId);
        });

        // Filter out already liked groups
        const availableGroups = allGroups.filter(
          (group) => !likedGroupIds.has(group.id)
        );

        setGroups(availableGroups);
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setLoadingGroups(false);
      }
    };

    if (userData) {
      fetchGroups();
    }
  }, [userData]);

  const checkForMatch = async (likedGroupId: string) => {
    if (!userData?.groupId) return false;

    // Check if the other group has already liked us
    const matchQuery = query(
      collection(db, "likes"),
      where("fromGroupId", "==", likedGroupId),
      where("toGroupId", "==", userData.groupId)
    );
    const matchSnapshot = await getDocs(matchQuery);

    return !matchSnapshot.empty;
  };

  const createMatch = async (otherGroupId: string) => {
    if (!userData?.groupId) return;

    await addDoc(collection(db, "matches"), {
      groupIds: [userData.groupId, otherGroupId],
      createdAt: serverTimestamp(),
    });
  };

  const handleLike = async () => {
    if (!userData?.groupId || currentIndex >= groups.length) return;

    const likedGroup = groups[currentIndex];

    // Record the like
    await addDoc(collection(db, "likes"), {
      fromGroupId: userData.groupId,
      toGroupId: likedGroup.id,
      createdAt: serverTimestamp(),
    });

    // Check for mutual like
    const isMatch = await checkForMatch(likedGroup.id);

    if (isMatch) {
      await createMatch(likedGroup.id);
      setMatchFound(likedGroup);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePass = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const closeMatchModal = () => {
    setMatchFound(null);
    setCurrentIndex((prev) => prev + 1);
  };

  if (loading || loadingGroups) {
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
            You need to create a group before you can browse other groups.
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

  const currentGroup = groups[currentIndex];

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="text-gray-600 hover:text-gray-800">
            ← Home
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Browse Groups</h1>
          <Link
            href="/matches"
            className="text-purple-600 hover:text-purple-800"
          >
            Matches
          </Link>
        </div>

        {currentGroup ? (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <img
              src={currentGroup.photoUrl}
              alt={currentGroup.name}
              className="w-full h-64 object-cover"
            />
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {currentGroup.name}
              </h2>
              <p className="text-gray-600 mb-6">{currentGroup.bio}</p>

              <div className="flex gap-4">
                <button
                  onClick={handlePass}
                  className="flex-1 bg-gray-200 text-gray-700 font-semibold py-4 rounded-xl hover:bg-gray-300 transition text-lg"
                >
                  Pass
                </button>
                <button
                  onClick={handleLike}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold py-4 rounded-xl hover:opacity-90 transition text-lg"
                >
                  Like
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No More Groups
            </h2>
            <p className="text-gray-600 mb-6">
              You&apos;ve seen all available groups. Check back later for new ones!
            </p>
            <Link
              href="/matches"
              className="inline-block bg-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-purple-700 transition"
            >
              View Your Matches
            </Link>
          </div>
        )}

        <div className="mt-4 text-center text-gray-500">
          {groups.length > 0 && currentIndex < groups.length && (
            <span>
              {currentIndex + 1} of {groups.length} groups
            </span>
          )}
        </div>
      </div>

      {/* Match Modal */}
      {matchFound && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center animate-bounce-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              It&apos;s a Match!
            </h2>
            <p className="text-gray-600 mb-6">
              You and <strong>{matchFound.name}</strong> liked each other!
            </p>
            <div className="space-y-3">
              <Link
                href="/matches"
                className="block w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold py-3 rounded-lg hover:opacity-90 transition"
              >
                Send a Message
              </Link>
              <button
                onClick={closeMatchModal}
                className="block w-full bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition"
              >
                Keep Browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
