import { create } from "zustand";

interface AuthState {
  token: string | null;
  userId: string | null;
  username: string | null;
  setAuth: (token: string, userId: string, username: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  username: null,

  setAuth: (token, userId, username) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      localStorage.setItem("username", username);
    }
    set({ token, userId, username });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
    }
    set({ token: null, userId: null, username: null });
  },
}));