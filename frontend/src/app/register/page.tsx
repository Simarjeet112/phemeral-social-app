"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !password) return setError("fill in all fields");
    if (password.length < 6) return setError("password must be at least 6 characters");
    setLoading(true);
    setError("");
    try {
      await api.post("/api/auth/register", { username, password });
      router.push("/login");
    } catch (err: any) {
      setError(err.response?.data?.error ?? "registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-br from-pink-50 via-white to-indigo-50 pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-white text-2xl">◎</span>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">join drops</h1>
          <p className="text-gray-400 text-sm mt-1">your identity is temporary here</p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm">@</span>
            <input
              type="text"
              placeholder="pick a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-8 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all"
            />
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔒</span>
            <input
              type="password"
              placeholder="password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              className="w-full pl-9 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all"
            />
          </div>

          {/* password strength indicator */}
          {password.length > 0 && (
            <div className="flex gap-1 px-1">
              {[1,2,3,4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    password.length >= i * 3
                      ? password.length >= 10 ? "bg-green-400"
                      : password.length >= 6 ? "bg-indigo-400"
                      : "bg-orange-400"
                      : "bg-gray-100"
                  }`}
                />
              ))}
              <span className="text-xs text-gray-400 ml-1">
                {password.length < 6 ? "too short" : password.length < 10 ? "ok" : "strong"}
              </span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                creating account...
              </span>
            ) : "create account →"}
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          already have one?{" "}
          <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
            sign in
          </Link>
        </p>
      </div>

      <div className="text-center pb-8">
        <p className="text-xs text-gray-300">everything disappears. nothing is permanent.</p>
      </div>
    </div>
  );
}