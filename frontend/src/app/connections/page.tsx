"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface Connection {
  _id: string;
  userA: { username: string; _id: string };
  userB: { username: string; _id: string };
  expiresAt: string;
  createdAt: string;
}

export default function ConnectionsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setMyUserId(payload.userId);
    } catch {}
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const res = await api.get("/api/signals/pending");
      setConnections([]);
    } catch {} finally {
      setLoading(false);
    }
  };

  const timeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "expired";
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return hrs > 0 ? `${hrs}h ${mins}m left` : `${mins}m left`;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
        <button onClick={() => router.push("/")} className="text-gray-400 text-sm">← back</button>
        <h1 className="flex-1 text-sm font-semibold text-gray-900">connections ⚡</h1>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-br from-pink-50 to-indigo-50 rounded-3xl p-5 mb-6">
          <p className="text-sm font-semibold text-gray-900 mb-1">how signals work</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            send a signal to someone in a drop room → they accept → you're connected for 24 hours → then it's gone forever. no permanent friendships here.
          </p>
        </div>

        {loading && <p className="text-sm text-gray-400 text-center py-10">loading...</p>}

        {!loading && connections.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">⚡</p>
            <p className="text-gray-900 font-semibold">no connections yet</p>
            <p className="text-gray-400 text-sm mt-1">join a drop and send a signal</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 bg-indigo-600 text-white px-6 py-2.5 rounded-2xl text-sm font-semibold hover:bg-indigo-700 transition-all"
            >
              find drops
            </button>
          </div>
        )}

        <div className="space-y-3">
          {connections.map((conn) => {
            const other = conn.userA._id === myUserId ? conn.userB : conn.userA;
            return (
              <div key={conn._id} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-100 to-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {other.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{other.username}</p>
                    <p className="text-xs text-pink-500 font-medium">{timeLeft(conn.expiresAt)}</p>
                  </div>
                  <button className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full font-medium hover:bg-indigo-100 transition-all">
                    message
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}