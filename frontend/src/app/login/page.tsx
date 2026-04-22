"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onboarded = localStorage.getItem("onboarded");
    const token = localStorage.getItem("token");
    if (!onboarded && !token) {
      router.push("/onboarding");
    }
  }, []);

  const handleLogin = async () => {
    if (!username || !password) return setError("fill in all fields");
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/api/auth/login", { username, password });
      const { token } = res.data;
      setAuth(token, res.data.userId ?? "", username);
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.error ?? "login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* top gradient blob */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-br from-indigo-50 via-white to-pink-50 pointer-events-none" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* logo */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-white text-2xl">◎</span>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">drops</h1>
          <p className="text-gray-400 text-sm mt-1">ephemeral. anonymous. real.</p>
        </div>

        {/* form */}
        <div className="w-full max-w-sm space-y-3">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm">@</span>
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-8 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all"
            />
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm">🔒</span>
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full pl-9 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                signing in...
              </span>
            ) : "sign in →"}
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          new here?{" "}
          <Link href="/register" className="text-indigo-600 font-semibold hover:underline">
            create account
          </Link>
        </p>
      </div>

      {/* bottom text */}
      <div className="text-center pb-8">
        <p className="text-xs text-gray-300">everything disappears. nothing is permanent.</p>
      </div>
    </div>
  );
}
