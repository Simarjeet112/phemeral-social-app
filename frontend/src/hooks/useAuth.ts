"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export const useAuth = () => {
  const router = useRouter();
  const { token, userId, username } = useAuthStore();

  useEffect(() => {
    // if no token in store, check localStorage
    const stored = localStorage.getItem("token");
    if (!stored) {
      router.push("/login"); // redirect to login
    }
  }, []);

  return { token, userId, username };
};