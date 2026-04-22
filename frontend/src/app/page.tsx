"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface Drop {
  _id: string;
  content: { text: string; image?: string };
  createdAt: string;
  expiresAt: string;
  createdBy: { username: string } | string;
}

const REACTIONS = ["🔥", "👀", "💀", "❤️", "😭", "⚡"];

export default function FeedPage() {
  const router = useRouter();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [caption, setCaption] = useState("");
  const [ttl, setTtl] = useState(30);
  const [posting, setPosting] = useState(false);
  const [reactions, setReactions] = useState<Record<string, Record<string, number>>>({});
  const [myReactions, setMyReactions] = useState<Record<string, string>>({});
  const [now, setNow] = useState(Date.now());
  const [mounted, setMounted] = useState(false);
  const [floatingEmoji, setFloatingEmoji] = useState<{id: string, emoji: string, x: number, y: number} | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchDrops();
    // live countdown ticker
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (showCreate) textareaRef.current?.focus();
  }, [showCreate]);

  const fetchDrops = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/drops?lat=28.6139&lng=77.2090");
      setDrops(res.data.drops ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDrop = async () => {
    if (!caption.trim()) return;
    setPosting(true);
    try {
      await api.post("/api/drops", { text: caption, duration: ttl, maxSize: 10 });
      setCaption("");
      setShowCreate(false);
      await fetchDrops();
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };

  const handleJoin = async (dropId: string) => {
    try {
      const res = await api.post(`/api/drops/${dropId}/join`);
      const roomId = res.data.room?._id;
      if (roomId) router.push(`/room/${roomId}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReaction = (dropId: string, emoji: string, e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setFloatingEmoji({ 
      id: Math.random().toString(), 
      emoji, 
      x: e.clientX, 
      y: e.clientY 
    });
    setTimeout(() => setFloatingEmoji(null), 800);

    setMyReactions(prev => ({ ...prev, [dropId]: emoji }));
    setReactions(prev => {
      const dropReactions = { ...(prev[dropId] ?? {}) };
      const old = myReactions[dropId];
      if (old && old !== emoji) {
        dropReactions[old] = Math.max(0, (dropReactions[old] ?? 1) - 1);
      }
      dropReactions[emoji] = (dropReactions[emoji] ?? 0) + 1;
      return { ...prev, [dropId]: dropReactions };
    });
  };

  // live countdown
  const timeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - now;
    if (diff <= 0) return "expired";
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const isHot = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - now;
    return diff < 5 * 60 * 1000;
  };

  const isCritical = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - now;
    return diff < 60 * 1000;
  };

  const getName = (drop: Drop) =>
    typeof drop.createdBy === "object" ? drop.createdBy.username : "anon";

  const avatarLetter = mounted
    ? (localStorage.getItem("username")?.[0]?.toUpperCase() ?? "?")
    : "?";

  return (
    <div className="min-h-screen bg-[#F9FAFB]">

      {/* Floating emoji animation */}
      {floatingEmoji && (
        <div
          key={floatingEmoji.id}
          className="fixed pointer-events-none z-50 text-3xl animate-bounce"
          style={{ left: floatingEmoji.x - 16, top: floatingEmoji.y - 40 }}
        >
          {floatingEmoji.emoji}
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-5 py-3">
        <div className="flex items-center justify-between max-w-xl mx-auto">
          <div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">drops 🌀</h1>
            <p className="text-xs text-gray-400">{drops.length} live around you</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/ghost")}
              className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-2 rounded-full hover:bg-indigo-100 transition-all"
            >
              👻 ghost
            </button>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full transition-all ${
                showCreate ? "bg-gray-100 text-gray-500" : "bg-indigo-600 text-white shadow-md shadow-indigo-200"
              }`}
            >
              {showCreate ? "✕ cancel" : "+ drop"}
            </button>
            <button
              onClick={() => router.push("/profile")}
              className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold"
            >
              {avatarLetter}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">

        {/* Create drop */}
        {showCreate && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-3">new drop</p>
            <textarea
              ref={textareaRef}
              placeholder="what's happening around you? 👀"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="w-full bg-gray-50 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs font-medium text-indigo-500 whitespace-nowrap">⏱ {ttl}m</span>
              <input
                type="range" min={10} max={60} step={5} value={ttl}
                onChange={(e) => setTtl(Number(e.target.value))}
                className="flex-1 accent-indigo-600"
              />
            </div>
            <button
              onClick={handleCreateDrop}
              disabled={posting || !caption.trim()}
              className="w-full mt-3 bg-indigo-600 text-white py-3 rounded-2xl text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40 shadow-md shadow-indigo-200"
            >
              {posting ? "dropping..." : "drop it 🌀"}
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">finding drops near you...</p>
          </div>
        )}

        {!loading && drops.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🌀</div>
            <p className="text-gray-900 font-semibold text-lg">nothing around you</p>
            <p className="text-gray-400 text-sm mt-1">be the first to drop something</p>
          </div>
        )}

        {drops.map((drop) => {
          const dropReactions = reactions[drop._id] ?? {};
          const myReaction = myReactions[drop._id];
          const critical = isCritical(drop.expiresAt);
          const hot = isHot(drop.expiresAt);

          return (
            <div
              key={drop._id}
              className={`bg-white rounded-3xl p-5 shadow-sm border transition-all duration-200 hover:-translate-y-0.5 ${
                critical ? "border-red-200 shadow-red-50" : "border-gray-100"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    {getName(drop)[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{getName(drop)}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(drop.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                {/* Live countdown */}
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 font-mono ${
                  critical ? "bg-red-500 text-white animate-pulse" :
                  hot ? "bg-red-50 text-red-500" : "bg-indigo-50 text-indigo-500"
                }`}>
                  {critical ? "🔴" : hot ? "🔥" : "⏱"} {timeLeft(drop.expiresAt)}
                </span>
              </div>

              {/* Caption */}
              <p className="text-gray-900 text-[15px] leading-relaxed mb-4 font-medium">
                {drop.content?.text}
              </p>

              {/* Emoji reactions row */}
              <div className="flex gap-1.5 mb-3 flex-wrap">
                {REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={(e) => handleReaction(drop._id, emoji, e)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm transition-all active:scale-110 ${
                      myReaction === emoji
                        ? "bg-indigo-100 scale-110 shadow-sm"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    {emoji}
                    {dropReactions[emoji] ? (
                      <span className="text-xs text-gray-500 font-medium">{dropReactions[emoji]}</span>
                    ) : null}
                  </button>
                ))}
              </div>

              {/* Join button */}
              <button
                onClick={() => handleJoin(drop._id)}
                className={`w-full py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-sm ${
                  critical
                    ? "bg-red-500 text-white shadow-red-200 animate-pulse"
                    : "bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700"
                }`}
              >
                {critical ? "⚠️ entering last minute!" : "enter drop →"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 px-6 py-3 z-20">
        <div className="flex items-center justify-around max-w-xl mx-auto">
          <button onClick={() => router.push("/")} className="flex flex-col items-center gap-1">
            <span className="text-xl">🏠</span>
            <span className="text-xs text-indigo-600 font-semibold">feed</span>
          </button>
          <button onClick={() => router.push("/connections")} className="flex flex-col items-center gap-1">
            <span className="text-xl">⚡</span>
            <span className="text-xs text-gray-400">signals</span>
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 active:scale-95 transition-all"
          >
            <span className="text-white text-xl font-bold">+</span>
          </button>
          <button onClick={() => router.push("/ghost")} className="flex flex-col items-center gap-1">
            <span className="text-xl">👻</span>
            <span className="text-xs text-gray-400">ghost</span>
          </button>
          <button onClick={() => router.push("/circles")} className="flex flex-col items-center gap-1">
            <span className="text-xl">🔵</span>
            <span className="text-xs text-gray-400">circles</span>
          </button>
        </div>
      </div>

      <div className="h-24" />
    </div>
  );
}
