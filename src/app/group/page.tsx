"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Group {
  name: string;
  bio: string;
  photoUrl: string;
  adminUserId: string;
  createdAt: Date;
}

export default function GroupPage() {
  const { user, userData, loading, refreshUserData } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState<Group | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    photoUrl: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchGroup = async () => {
      if (userData?.groupId && db) {
        const groupDoc = await getDoc(doc(db, "groups", userData.groupId));
        if (groupDoc.exists()) {
          setGroup(groupDoc.data() as Group);
        }
      }
    };
    fetchGroup();
  }, [userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    setError("");
    setSubmitting(true);

    try {
      const groupId = `group_${user.uid}_${Date.now()}`;

      await setDoc(doc(db, "groups", groupId), {
        name: formData.name,
        bio: formData.bio,
        photoUrl: formData.photoUrl || "https://via.placeholder.com/400x300?text=Group+Photo",
        adminUserId: user.uid,
        createdAt: new Date(),
      });

      await updateDoc(doc(db, "users", user.uid), {
        groupId: groupId,
      });

      await refreshUserData();
      setIsCreating(false);

      // Fetch the newly created group
      const groupDoc = await getDoc(doc(db, "groups", groupId));
      if (groupDoc.exists()) {
        setGroup(groupDoc.data() as Group);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600 text-xl">Loading...</div>
      </main>
    );
  }

  if (!userData?.groupId && !isCreating) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Create Your Group
          </h1>
          <p className="text-gray-600 mb-6">
            You haven&apos;t created a group yet. Create one to start matching!
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="w-full bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 transition"
          >
            Create Group
          </button>
          <Link
            href="/"
            className="block mt-4 text-gray-500 hover:text-gray-700"
          >
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  if (isCreating) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Create Your Group
          </h1>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Group Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                placeholder="The Weekend Warriors"
                required
              />
            </div>

            <div>
              <label
                htmlFor="bio"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Bio
              </label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 h-24 resize-none"
                placeholder="Tell others about your group..."
                required
              />
            </div>

            <div>
              <label
                htmlFor="photoUrl"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Photo URL (optional)
              </label>
              <input
                type="url"
                id="photoUrl"
                value={formData.photoUrl}
                onChange={(e) =>
                  setFormData({ ...formData, photoUrl: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                placeholder="https://example.com/photo.jpg"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Group"}
            </button>
          </form>

          <button
            onClick={() => setIsCreating(false)}
            className="block w-full mt-4 text-center text-gray-500 hover:text-gray-700"
          >
            ← Cancel
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <img
            src={group?.photoUrl || "https://via.placeholder.com/400x300?text=Group+Photo"}
            alt={group?.name}
            className="w-full h-48 object-cover"
          />
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {group?.name}
            </h1>
            <p className="text-gray-600 mb-4">{group?.bio}</p>
            <div className="text-sm text-gray-500">
              You are the admin of this group
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Link
            href="/browse"
            className="block w-full bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 transition text-center"
          >
            Browse Groups
          </Link>
          <Link
            href="/matches"
            className="block w-full bg-white text-purple-600 font-semibold py-3 rounded-lg hover:bg-gray-50 transition text-center border border-purple-600"
          >
            View Matches
          </Link>
          <Link
            href="/"
            className="block w-full text-center text-gray-500 hover:text-gray-700 py-2"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
