"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import api from "@/lib/api";

interface Message {
  label: string;
  content: string;
  timestamp: string;
}

export default function GhostPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "waiting" | "matched">("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [matchId, setMatchId] = useState("");
  const [myLabel, setMyLabel] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 mins in seconds
  const socketRef = useRef<Socket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const matchIdRef = useRef("");
  const myLabelRef = useRef("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("socket connected:", socket.id);
    });

    socket.on("ghost:joined", (data: any) => {
      console.log("ghost:joined confirmed:", data);
    });

    socket.on("ghost:partner_joined", () => {
      console.log("partner joined the ghost room");
    });

    socket.on("ghost:new_message", (msg: any) => {
      console.log("ghost:new_message received:", msg);
      setMessages((prev) => [...prev, {
        label: msg.sender,
        content: msg.content,
        timestamp: msg.timestamp,
      }]);
    });

    socket.on("ghost:partner_left", () => {
      alert("your partner left the chat");
      setStatus("idle");
      setMessages([]);
      setMatchId("");
      setTimeRemaining(600);
      matchIdRef.current = "";
    });

    socket.on("ghost:dissolved", () => {
      setStatus("idle");
      setMessages([]);
      setMatchId("");
      setTimeRemaining(600);
      matchIdRef.current = "";
    });

    socket.on("ghost:error", (err: any) => {
      console.error("ghost error:", err);
    });

    return () => {
      socket.disconnect();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Countdown timer — runs only while matched
  useEffect(() => {
    if (status !== "matched") return;

    setTimeRemaining(600); // reset to 10 min on each new match

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus("idle");
          setMessages([]);
          setMatchId("");
          matchIdRef.current = "";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Format seconds as m:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const enterQueue = async () => {
    try {
      try {
        const existing = await api.get("/api/ghost/match");
        if (existing.data.status === "matched") {
          await api.post(`/api/ghost/dissolve/${existing.data.match._id}`);
        }
      } catch {}

      const res = await api.post("/api/ghost/enter", {
        lat: 28.6139,
        lng: 77.2090,
      });

      if (res.status === 200 && res.data.match) {
        const match = res.data.match;
        setMatchId(match._id);
        matchIdRef.current = match._id;
        setMyLabel("B");
        myLabelRef.current = "B";
        setStatus("matched");
        setTimeout(() => {
          console.log("emitting ghost:join as B, matchId:", match._id);
          socketRef.current?.emit("ghost:join", { matchId: match._id });
        }, 500);
      } else {
        setStatus("waiting");
        startPolling();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startPolling = () => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get("/api/ghost/match");
        if (res.data.status === "matched") {
          const match = res.data.match;
          setMatchId(match._id);
          matchIdRef.current = match._id;
          setMyLabel("A");
          myLabelRef.current = "A";
          setStatus("matched");
          if (pollRef.current) clearInterval(pollRef.current);
          setTimeout(() => {
            console.log("emitting ghost:join as A, matchId:", match._id);
            socketRef.current?.emit("ghost:join", { matchId: match._id });
          }, 500);
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);
  };

  const leaveQueue = async () => {
    try {
      if (matchIdRef.current) {
        await api.post(`/api/ghost/dissolve/${matchIdRef.current}`);
        socketRef.current?.emit("ghost:leave", { matchId: matchIdRef.current });
      }
      await api.post("/api/ghost/leave");
      setStatus("idle");
      setMessages([]);
      setMatchId("");
      setTimeRemaining(600);
      matchIdRef.current = "";
      if (pollRef.current) clearInterval(pollRef.current);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;
    console.log("sending ghost:message matchId:", matchIdRef.current);
    socketRef.current.emit("ghost:message", {
      matchId: matchIdRef.current,
      content: input,
    });
    setInput("");
  };

  const dissolveMatch = async () => {
    try {
      await api.post(`/api/ghost/dissolve/${matchIdRef.current}`);
      socketRef.current?.emit("ghost:leave", { matchId: matchIdRef.current });
      setStatus("idle");
      setMessages([]);
      setMatchId("");
      setTimeRemaining(600);
      matchIdRef.current = "";
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">

      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="text-gray-400 hover:text-gray-600 transition-all text-sm"
        >
          ← back
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-medium text-gray-900">ghost match</h1>
          <p className="text-xs text-gray-400">
            {status === "idle" && "anonymous · 10 min · then it's gone"}
            {status === "waiting" && "looking for someone nearby..."}
            {status === "matched" && `matched · vanishes in ${formatTime(timeRemaining)}`}
          </p>
        </div>
        {status === "matched" && (
          <button
            onClick={dissolveMatch}
            className="text-xs text-red-400 hover:text-red-600 transition-all"
          >
            end
          </button>
        )}
      </div>

      {status === "idle" && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-3xl">👻</span>
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">ghost match</h2>
          <p className="text-sm text-gray-400 mb-8 leading-relaxed">
            get anonymously matched with someone nearby. 10 minutes, then it vanishes forever.
          </p>
          <button
            onClick={enterQueue}
            className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-sm font-medium hover:bg-indigo-700 active:scale-95 transition-all"
          >
            enter the queue
          </button>
        </div>
      )}

      {status === "waiting" && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
            <span className="text-3xl">👻</span>
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">finding someone...</h2>
          <p className="text-sm text-gray-400 mb-8">
            looking for a nearby ghost. this won't take long.
          </p>
          <button
            onClick={leaveQueue}
            className="text-sm text-gray-400 hover:text-gray-600 border border-gray-200 px-6 py-2.5 rounded-2xl transition-all"
          >
            leave queue
          </button>
        </div>
      )}

      {status === "matched" && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-400 text-sm">you're matched — say something before it disappears</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.label === myLabelRef.current ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  msg.label === myLabelRef.current
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-900 rounded-bl-sm"
                }`}>
                  <span className="block">{msg.content}</span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4 flex gap-3">
            <input
              type="text"
              placeholder="say something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="bg-indigo-600 text-white px-5 py-3 rounded-2xl text-sm font-medium hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
            >
              send
            </button>
          </div>
        </>
      )}

    </div>
  );
}
