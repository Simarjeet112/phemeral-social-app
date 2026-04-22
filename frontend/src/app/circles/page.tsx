"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const VIBES = ["chill", "hype", "study", "talk", "gaming", "other"];
const VIBE_COLORS: Record<string, string> = {
  chill: "bg-blue-50 text-blue-600",
  hype: "bg-orange-50 text-orange-600",
  study: "bg-green-50 text-green-600",
  talk: "bg-purple-50 text-purple-600",
  gaming: "bg-red-50 text-red-600",
  other: "bg-gray-50 text-gray-600",
};

export default function CirclesPage() {
  const router = useRouter();
  const [circles, setCircles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [vibe, setVibe] = useState("chill");
  const [creating, setCreating] = useState(false);
  // ✅ NEW
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchCircles();
    // ✅ NEW: fetch pending invites
    fetchPendingInvites();
  }, []);

  const fetchCircles = async () => {
    try {
      const res = await api.get("/api/circles");
      setCircles(res.data.circles ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW
  const fetchPendingInvites = async () => {
    try {
      const invRes = await api.get("/api/circles/invites/pending");
      setPendingInvites(invRes.data.invites ?? []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await api.post("/api/circles", { name, vibe });
      setCircles((prev) => [res.data.circle, ...prev]);
      setName("");
      setVibe("chill");
      setShowCreate(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  // ✅ NEW
  const handleAccept = async (inviteId: string) => {
    await api.post(`/api/circles/invites/${inviteId}/accept`);
    fetchCircles();
    setPendingInvites((prev) => prev.filter((i) => i._id !== inviteId));
  };

  // ✅ NEW
  const handleReject = async (inviteId: string) => {
    await api.post(`/api/circles/invites/${inviteId}/reject`);
    setPendingInvites((prev) => prev.filter((i) => i._id !== inviteId));
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-5 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">circles 🔵</h1>
          <p className="text-xs text-gray-400">permanent group chats</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className={`text-xs font-semibold px-4 py-2 rounded-full transition-all ${
            showCreate ? "bg-gray-100 text-gray-500" : "bg-indigo-600 text-white shadow-md shadow-indigo-200"
          }`}
        >
          {showCreate ? "✕ cancel" : "+ circle"}
        </button>
      </div>

      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">

        {showCreate && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">new circle</p>
            <input
              type="text"
              placeholder="circle name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 mb-3"
            />
            <p className="text-xs text-gray-400 mb-2">pick a vibe</p>
            <div className="flex gap-2 flex-wrap mb-4">
              {VIBES.map((v) => (
                <button
                  key={v}
                  onClick={() => setVibe(v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    vibe === v
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="w-full bg-indigo-600 text-white py-3 rounded-2xl text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40"
            >
              {creating ? "creating..." : "create circle 🔵"}
            </button>
          </div>
        )}

        {/* ✅ NEW: Pending invites banner */}
        {pendingInvites.length > 0 && (
          <div className="bg-indigo-50 rounded-3xl p-4 border border-indigo-100">
            <p className="text-xs font-semibold text-indigo-600 mb-3">
              🔔 {pendingInvites.length} circle invite{pendingInvites.length > 1 ? "s" : ""}
            </p>
            {pendingInvites.map((invite) => (
              <div key={invite._id} className="flex items-center gap-2 mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {invite.circleId?.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    from {invite.inviterId?.username}
                  </p>
                </div>
                <button
                  onClick={() => handleAccept(invite._id)}
                  className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-full font-medium"
                >
                  accept
                </button>
                <button
                  onClick={() => handleReject(invite._id)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-all"
                >
                  reject
                </button>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {!loading && circles.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔵</p>
            <p className="text-gray-900 font-semibold">no circles yet</p>
            <p className="text-gray-400 text-sm mt-1">create one or join from a drop room</p>
          </div>
        )}

        {circles.map((circle) => (
          <div
            key={circle._id}
            onClick={() => router.push(`/circles/${circle._id}`)}
            className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-xl font-bold">
                {circle.name[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{circle.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${VIBE_COLORS[circle.vibe]}`}>
                    {circle.vibe}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {circle.members?.length ?? 0} members
                </p>
              </div>
              <span className="text-gray-300">›</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 px-6 py-3 z-20">
        <div className="flex items-center justify-around max-w-xl mx-auto">
          <button onClick={() => router.push("/")} className="flex flex-col items-center gap-1">
            <span className="text-xl">🏠</span>
            <span className="text-xs text-gray-400">feed</span>
          </button>
          <button onClick={() => router.push("/connections")} className="flex flex-col items-center gap-1">
            <span className="text-xl">⚡</span>
            <span className="text-xs text-gray-400">signals</span>
          </button>
          <button onClick={() => router.push("/")} className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-white text-xl font-bold">+</span>
          </button>
          <button onClick={() => router.push("/ghost")} className="flex flex-col items-center gap-1">
            <span className="text-xl">👻</span>
            <span className="text-xs text-gray-400">ghost</span>
          </button>
          <button onClick={() => router.push("/circles")} className="flex flex-col items-center gap-1">
            <span className="text-xl">🔵</span>
            <span className="text-xs text-indigo-600 font-semibold">circles</span>
          </button>
        </div>
      </div>
      <div className="h-24" />
    </div>
  );
}