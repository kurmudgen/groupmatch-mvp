"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Group {
  id: string;
  name: string;
  photoUrl: string;
}

interface Message {
  id: string;
  groupId: string;
  text: string;
  createdAt: Timestamp;
}

export default function ChatPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;

  const [otherGroup, setOtherGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingChat, setLoadingChat] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchChatData = async () => {
      if (!userData?.groupId || !matchId || !db) {
        setLoadingChat(false);
        return;
      }

      try {
        // Get match document
        const matchDoc = await getDoc(doc(db, "matches", matchId));
        if (!matchDoc.exists()) {
          router.push("/matches");
          return;
        }

        const matchData = matchDoc.data();
        const groupIds = matchData.groupIds as string[];

        // Verify user's group is part of this match
        if (!groupIds.includes(userData.groupId)) {
          router.push("/matches");
          return;
        }

        // Get other group's info
        const otherGroupId = groupIds.find((id) => id !== userData.groupId);
        if (otherGroupId) {
          const groupDoc = await getDoc(doc(db, "groups", otherGroupId));
          if (groupDoc.exists()) {
            setOtherGroup({
              id: groupDoc.id,
              ...groupDoc.data(),
            } as Group);
          }
        }

        // Get messages
        await fetchMessages();
      } catch (error) {
        console.error("Error fetching chat data:", error);
      } finally {
        setLoadingChat(false);
      }
    };

    if (userData) {
      fetchChatData();
    }
  }, [userData, matchId, router]);

  const fetchMessages = async () => {
    if (!db) return;
    const messagesQuery = query(
      collection(db, "matches", matchId, "messages"),
      orderBy("createdAt", "asc")
    );
    const messagesSnapshot = await getDocs(messagesQuery);

    const fetchedMessages: Message[] = [];
    messagesSnapshot.forEach((doc) => {
      fetchedMessages.push({
        id: doc.id,
        ...doc.data(),
      } as Message);
    });

    setMessages(fetchedMessages);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userData?.groupId || sending || !db) return;

    setSending(true);

    try {
      await addDoc(collection(db, "matches", matchId, "messages"), {
        groupId: userData.groupId,
        text: newMessage.trim(),
        createdAt: serverTimestamp(),
      });

      setNewMessage("");
      await fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    await fetchMessages();
  };

  if (loading || loadingChat) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600 text-xl">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center gap-4">
        <Link href="/matches" className="text-gray-600 hover:text-gray-800">
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        {otherGroup && (
          <>
            <img
              src={otherGroup.photoUrl}
              alt={otherGroup.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <h1 className="text-lg font-semibold text-gray-800 flex-1">
              {otherGroup.name}
            </h1>
          </>
        )}
        <button
          onClick={handleRefresh}
          className="text-purple-600 hover:text-purple-800"
          title="Refresh messages"
        >
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.groupId === userData?.groupId;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isOwnMessage
                      ? "bg-purple-600 text-white rounded-br-sm"
                      : "bg-white text-gray-800 rounded-bl-sm shadow"
                  }`}
                >
                  <p>{message.text}</p>
                  {message.createdAt && (
                    <p
                      className={`text-xs mt-1 ${
                        isOwnMessage ? "text-purple-200" : "text-gray-400"
                      }`}
                    >
                      {message.createdAt.toDate().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form
        onSubmit={handleSendMessage}
        className="bg-white p-4 shadow-lg flex gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition disabled:opacity-50"
        >
          {sending ? "..." : "Send"}
        </button>
      </form>
    </main>
  );
}
