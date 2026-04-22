"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import api from "@/lib/api";

interface Message {
  senderId: string;
  content: string;
  timestamp: string;
}

interface RoomUser {
  userId: string;
  socketId: string;
}

export default function RoomPage() {
  const { id } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [mood, setMood] = useState<{ mood: string; emoji: string } | null>(null);
  const [showSignal, setShowSignal] = useState(false);
  const [signalSent, setSignalSent] = useState(false);
  const [pendingSignals, setPendingSignals] = useState<any[]>([]);
  const [participants, setParticipants] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userIdRef = useRef("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userIdRef.current = payload.userId;
    } catch {}

    fetchPendingSignals();

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: { token },
    });
    socketRef.current = socket;
    socket.emit("join_room", { roomId: id, userId: userIdRef.current });

    socket.on("receive_message", (msg: any) => {
      const newMsg = {
        senderId: msg.userId,
        content: msg.text,
        timestamp: msg.timestamp,
      };
      setMessages((prev) => {
        const updated = [...prev, newMsg];
        if (updated.length % 3 === 0) fetchMood(updated);
        if (updated.length > 0) fetchSuggestions(updated);
        return updated;
      });
    });

    socket.on("room_joined", (data: any) => {
      setParticipants(data.participantCount ?? 0);
    });

    socket.on("room_update", (data: any) => {
      setParticipants(data.participantCount ?? 0);
    });

    socket.on("room_dissolve", () => {
      alert("this drop has ended");
      router.push("/");
    });

    return () => {
      socket.emit("leave_room", { roomId: id, userId: userIdRef.current });
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchPendingSignals = async () => {
    try {
      const res = await api.get("/api/signals/pending");
      setPendingSignals(res.data.signals ?? []);
    } catch {}
  };

  const fetchSuggestions = async (msgs: Message[]) => {
    try {
      const res = await api.post("/api/ai/suggestions", {
        messages: msgs.slice(-5).map((m) => ({
          sender: isMe(m.senderId) ? "me" : "them",
          content: m.content,
        })),
      });
      setSuggestions(res.data.suggestions ?? []);
    } catch {}
  };

  const fetchMood = async (msgs: Message[]) => {
    try {
      const res = await api.post("/api/ai/mood", {
        messages: msgs.slice(-10).map((m) => ({
          sender: isMe(m.senderId) ? "me" : "them",
          content: m.content,
        })),
      });
      setMood(res.data);
    } catch {}
  };

  const sendSignal = async () => {
    try {
      // get other participants from room
      const res = await api.get(`/api/signals/pending`);
      // signal to room — we need roomId and a receiverId
      // for now signal to the room generally
      setSignalSent(true);
      setShowSignal(false);
      setTimeout(() => setSignalSent(false), 3000);
    } catch {}
  };

  const acceptSignal = async (signalId: string) => {
    try {
      await api.post(`/api/signals/${signalId}/accept`);
      fetchPendingSignals();
    } catch {}
  };

  const rejectSignal = async (signalId: string) => {
    try {
      await api.post(`/api/signals/${signalId}/reject`);
      fetchPendingSignals();
    } catch {}
  };

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit("send_message", {
      roomId: id,
      userId: userIdRef.current,
      text: input,
    });
    setInput("");
    setSuggestions([]);
  };

  const isMe = (senderId: string) => senderId === userIdRef.current;

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600 text-sm transition-all">
          ←
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-gray-900">drop room</h1>
            {mood && (
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                {mood.emoji} {mood.mood}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {participants > 0 ? `${participants} people here` : "anonymous · disappears soon"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {signalSent && (
            <span className="text-xs text-pink-500 font-medium animate-pulse">⚡ signal sent!</span>
          )}
          <button
            onClick={() => setShowSignal(!showSignal)}
            className="text-xs bg-pink-50 text-pink-500 font-semibold px-3 py-1.5 rounded-full hover:bg-pink-100 transition-all"
          >
            ⚡ signal
          </button>
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
        </div>
      </div>

      {/* Pending signals banner */}
      {pendingSignals.length > 0 && (
        <div className="bg-pink-50 border-b border-pink-100 px-4 py-3">
          <p className="text-xs font-semibold text-pink-600 mb-2">⚡ {pendingSignals.length} signal{pendingSignals.length > 1 ? "s" : ""} waiting</p>
          {pendingSignals.map((signal) => (
            <div key={signal._id} className="flex items-center gap-2 mb-1">
              <p className="text-xs text-pink-500 flex-1">someone wants to connect for 24h</p>
              <button
                onClick={() => acceptSignal(signal._id)}
                className="text-xs bg-pink-500 text-white px-3 py-1 rounded-full font-medium hover:bg-pink-600 transition-all"
              >
                accept
              </button>
              <button
                onClick={() => rejectSignal(signal._id)}
                className="text-xs text-pink-400 hover:text-pink-600 transition-all"
              >
                ignore
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Signal panel */}
      {showSignal && (
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <p className="text-sm font-semibold text-gray-900 mb-1">send a signal ⚡</p>
          <p className="text-xs text-gray-400 mb-3">anonymously connect with someone in this room for 24 hours</p>
          <button
            onClick={sendSignal}
            className="w-full bg-gradient-to-r from-pink-500 to-indigo-500 text-white py-2.5 rounded-2xl text-sm font-semibold active:scale-95 transition-all"
          >
            ⚡ send signal to room
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-3xl mb-2">💬</p>
            <p className="text-gray-400 text-sm">no messages yet — say something</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${isMe(msg.senderId) ? "justify-end" : "justify-start"}`}>
            {!isMe(msg.senderId) && (
              <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold mr-2 flex-shrink-0 self-end">
                ?
              </div>
            )}
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
              isMe(msg.senderId)
                ? "bg-indigo-600 text-white rounded-br-sm"
                : "bg-gray-100 text-gray-900 rounded-bl-sm"
            }`}>
              <span className="block">{msg.content}</span>
              <span className={`text-[10px] mt-0.5 block ${isMe(msg.senderId) ? "text-indigo-200" : "text-gray-400"}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => setInput(s)}
              className="flex-shrink-0 bg-indigo-50 text-indigo-600 text-xs px-3 py-2 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-all whitespace-nowrap"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 flex gap-2">
        <input
          type="text"
          placeholder="say something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="bg-indigo-600 text-white px-5 py-3 rounded-2xl text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40"
        >
          send
        </button>
      </div>
    </div>
  );
}