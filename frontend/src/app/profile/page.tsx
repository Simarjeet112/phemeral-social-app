"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function ProfilePage() {
  const router = useRouter();
  const { username, logout } = useAuthStore();
  const [drops, setDrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchMyDrops();
  }, []);

  const fetchMyDrops = async () => {
    try {
      const res = await api.get("/api/drops?lat=28.6139&lng=77.2090");
      setDrops(res.data.drops ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const timeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "expired";
    const mins = Math.floor(diff / 60000);
    return `${mins}m left`;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="text-gray-400 hover:text-gray-600 transition-all text-sm"
        >
          ← back
        </button>
        <h1 className="flex-1 text-sm font-medium text-gray-900">profile</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-red-400 hover:text-red-600 transition-all"
        >
          logout
        </button>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Avatar + username */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-3xl font-medium mb-4">
            {username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <h2 className="text-xl font-medium text-gray-900">{username}</h2>
          <p className="text-sm text-gray-400 mt-1">ephemeral social</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-medium text-gray-900">{drops.length}</p>
            <p className="text-xs text-gray-400 mt-1">drops</p>
          </div>
          <div className="bg-indigo-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-medium text-indigo-600">👻</p>
            <p className="text-xs text-gray-400 mt-1">ghost</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-medium text-gray-900">∞</p>
            <p className="text-xs text-gray-400 mt-1">vibes</p>
          </div>
        </div>

        {/* Recent drops */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">nearby drops</h3>
          {loading && <p className="text-sm text-gray-400">loading...</p>}
          {!loading && drops.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">no drops yet</p>
              <button
                onClick={() => router.push("/")}
                className="mt-4 text-sm text-indigo-600 font-medium"
              >
                create your first drop
              </button>
            </div>
          )}
          <div className="space-y-3">
            {drops.map((drop) => (
              <div
                key={drop._id}
                className="border border-gray-100 rounded-2xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">
                    {new Date(drop.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-xs bg-indigo-50 text-indigo-500 px-2 py-1 rounded-full">
                    {timeLeft(drop.expiresAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-900">{drop.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}