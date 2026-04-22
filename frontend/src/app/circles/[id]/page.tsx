"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import api from "@/lib/api";

interface Message {
  _id: string;
  text: string;
  senderId: { _id: string; username: string };
  createdAt: string;
}

export default function CircleChatPage() {
  const { id } = useParams();
  const router = useRouter();
  const [circle, setCircle] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [myUserId, setMyUserId] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [addUsername, setAddUsername] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setMyUserId(payload.userId);
    } catch {}

    fetchCircle();
    fetchMessages();

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("circle:join", { circleId: id });
    });

    socket.on("circle:new_message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.emit("circle:leave", { circleId: id });
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchCircle = async () => {
    try {
      const res = await api.get(`/api/circles/${id}`);
      setCircle(res.data.circle);
    } catch {}
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/api/circles/${id}/messages`);
      setMessages(res.data.messages ?? []);
    } catch {}
  };

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit("circle:message", { circleId: id, text: input });
    setInput("");
  };

  const handleSendInvite = async () => {
    if (!addUsername.trim()) return;
    setAdding(true);
    setAddError("");
    setAddSuccess("");
    try {
      const res = await api.post(`/api/circles/${id}/invite`, { username: addUsername });
      setAddSuccess(res.data.message);
      setAddUsername("");
      setTimeout(() => setAddSuccess(""), 3000);
    } catch (err: any) {
      setAddError(err.response?.data?.error ?? "Failed to send invite");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (memberId: string, username: string) => {
    if (!confirm(`Remove ${username}?`)) return;
    try {
      await api.delete(`/api/circles/${id}/members/${memberId}`);
      fetchCircle();
    } catch (err: any) {
      alert(err.response?.data?.error ?? "Failed to remove");
    }
  };

  const handleLeave = async () => {
    if (!confirm("Leave this circle?")) return;
    try {
      await api.post(`/api/circles/${id}/leave`);
      router.push("/circles");
    } catch (err: any) {
      alert(err.response?.data?.error ?? "Failed to leave");
    }
  };

  const isMe = (senderId: string) => senderId === myUserId;
  const isCreator = circle?.createdBy?._id === myUserId || circle?.createdBy === myUserId;

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/circles")} className="text-gray-400 text-sm">←</button>
        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
          {circle?.name?.[0]?.toUpperCase() ?? "C"}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">{circle?.name ?? "circle"}</p>
          <p className="text-xs text-gray-400">{circle?.members?.length ?? 0} members · permanent</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full font-medium hover:bg-indigo-100 transition-all"
          >
            👥 members
          </button>
          {!isCreator && (
            <button
              onClick={handleLeave}
              className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-full font-medium hover:bg-red-100 transition-all"
            >
              leave
            </button>
          )}
        </div>
      </div>

      {/* Members panel */}
      {showMembers && (
        <div className="bg-gray-50 border-b border-gray-100 px-4 py-4">
          {/* Invite member — creator only */}
          {isCreator && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-700 mb-2">invite by username</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="invite by username..."
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-all"
                />
                <button
                  onClick={handleSendInvite}
                  disabled={adding || !addUsername.trim()}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40"
                >
                  {adding ? "..." : "invite"}
                </button>
              </div>
              {addError && <p className="text-xs text-red-500 mt-1">{addError}</p>}
              {addSuccess && <p className="text-xs text-green-500 mt-1">{addSuccess}</p>}
            </div>
          )}

          {/* Member list */}
          <p className="text-xs font-semibold text-gray-700 mb-2">members ({circle?.members?.length ?? 0}/20)</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {circle?.members?.map((member: any) => {
              const memberId = member._id ?? member;
              const memberUsername = member.username ?? "unknown";
              const isOwner = circle.createdBy?._id === memberId || circle.createdBy === memberId;

              return (
                <div key={memberId} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold">
                    {memberUsername[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-900 flex-1">{memberUsername}</span>
                  {isOwner && (
                    <span className="text-xs bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full">creator</span>
                  )}
                  {isCreator && !isOwner && memberId !== myUserId && (
                    <button
                      onClick={() => handleRemoveMember(memberId, memberUsername)}
                      className="text-xs text-red-400 hover:text-red-600 transition-all"
                    >
                      remove
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <p className="text-3xl mb-2">🔵</p>
            <p className="text-gray-400 text-sm">no messages yet — start the convo</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg._id} className={`flex ${isMe(msg.senderId._id) ? "justify-end" : "justify-start"}`}>
            {!isMe(msg.senderId._id) && (
              <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold mr-2 self-end flex-shrink-0">
                {msg.senderId.username[0].toUpperCase()}
              </div>
            )}
            <div className={`max-w-[75%]`}>
              {!isMe(msg.senderId._id) && (
                <p className="text-xs text-gray-400 mb-1 ml-1">{msg.senderId.username}</p>
              )}
              <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                isMe(msg.senderId._id)
                  ? "bg-indigo-600 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-900 rounded-bl-sm"
              }`}>
                <span className="block">{msg.text}</span>
                <span className={`text-[10px] mt-0.5 block ${isMe(msg.senderId._id) ? "text-indigo-200" : "text-gray-400"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 flex gap-2">
        <input
          type="text"
          placeholder="message the circle..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 transition-all"
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